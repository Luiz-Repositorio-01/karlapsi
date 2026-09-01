#!/usr/bin/env bash
# Importa site_kaka.zip (ou outro pacote legado) para public/legacy/ sem alterar bytes.
#
# Uso:
#   ./scripts/import-legacy-zip.sh /caminho/para/site_kaka.zip
#
# O script:
# 1. Extrai em diretório temporário
# 2. Inventaria HTML/CSS/JS/PDF/imagens/fontes
# 3. Calcula SHA-256 antes da cópia
# 4. Copia para public/legacy/ (estrutura relativa)
# 5. Recalcula hashes e falha se houver divergência
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${1:-}"
DEST="$ROOT/public/legacy"
HASH_LOG="$DEST/.import-hashes.txt"

if [[ -z "$ZIP" || ! -f "$ZIP" ]]; then
  echo "Uso: $0 /caminho/para/site_kaka.zip" >&2
  echo "Arquivo não encontrado. Coloque o ZIP no ambiente e passe o caminho." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Extraindo $ZIP"
unzip -q "$ZIP" -d "$TMP/extract"

# Se o ZIP tem uma única pasta raiz, descer um nível.
ROOT_CONTENT="$TMP/extract"
entries=("$TMP/extract"/*)
if [[ ${#entries[@]} -eq 1 && -d "${entries[0]}" ]]; then
  ROOT_CONTENT="${entries[0]}"
fi

echo "==> Inventário"
find "$ROOT_CONTENT" -type f | sed "s|^$ROOT_CONTENT/||" | sort | tee "$TMP/inventory.txt" | wc -l | awk '{print $1 " arquivos"}'
echo "Por extensão:"
find "$ROOT_CONTENT" -type f -printf '%f\n' | awk -F. '{print tolower($NF)}' | sort | uniq -c | sort -rn

# Detectar PDF Online / landing / infobooks por heurística de nomes (não inventa conteúdo).
echo "==> Heurísticas de pastas"
find "$ROOT_CONTENT" -type d \( -iname '*pdf*' -o -iname '*infobook*' -o -iname '*landing*' -o -iname '*cuidar*' -o -iname '*autismo*' \) | sed "s|^$ROOT_CONTENT/||" || true

echo "==> Hashes de origem"
(
  cd "$ROOT_CONTENT"
  find . -type f -print0 | sort -z | xargs -0 sha256sum
) > "$TMP/hashes-before.txt"

mkdir -p "$DEST"
# Preserva README existente se houver
if [[ -f "$DEST/README.md" ]]; then
  cp "$DEST/README.md" "$TMP/README.md.bak"
fi

echo "==> Copiando para public/legacy/ (bytes intactos)"
# Cópia espelhada; se a estrutura do ZIP já for pdf-online/landing-pages, mantém.
rsync -a --delete --exclude 'README.md' --exclude '.import-hashes.txt' "$ROOT_CONTENT"/ "$DEST"/

if [[ -f "$TMP/README.md.bak" ]]; then
  cp "$TMP/README.md.bak" "$DEST/README.md"
fi

echo "==> Hashes de destino"
(
  cd "$DEST"
  find . -type f ! -name 'README.md' ! -name '.import-hashes.txt' -print0 | sort -z | xargs -0 sha256sum
) > "$TMP/hashes-after.txt"

# Comparar apenas arquivos presentes em ambos (caminhos relativos)
python3 - <<'PY' "$TMP/hashes-before.txt" "$TMP/hashes-after.txt" "$HASH_LOG"
import sys
from pathlib import Path

before_path, after_path, out_path = sys.argv[1:4]

def load(p):
    m = {}
    for line in Path(p).read_text().splitlines():
        if not line.strip():
            continue
        digest, path = line.split(None, 1)
        m[path] = digest
    return m

before, after = load(before_path), load(after_path)
mismatches = []
for path, digest in before.items():
    if path not in after:
        mismatches.append(f"MISSING after copy: {path}")
    elif after[path] != digest:
        mismatches.append(f"HASH CHANGED: {path} {digest} -> {after[path]}")
extra = [p for p in after if p not in before]
if mismatches:
    print("FALHA — integridade quebrada:")
    print("\n".join(mismatches[:50]))
    sys.exit(2)
print(f"OK — {len(before)} arquivos com hash idêntico")
if extra:
    print(f"Nota: {len(extra)} arquivos extras no destino (ex.: README)")
Path(out_path).write_text(
    f"# Import hashes {len(before)} files\n" + Path(before_path).read_text()
)
PY

echo "==> Pronto. Reinicie o Next.js e abra /pdf-online, /infobooks e /landing-pages."
