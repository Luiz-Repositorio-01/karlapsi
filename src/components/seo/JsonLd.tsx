/**
 * Injeta dados estruturados.
 *
 * O conteúdo vem exclusivamente do próprio servidor (configurações e banco),
 * nunca de entrada do usuário. `JSON.stringify` com escape de `<` evita
 * qualquer possibilidade de quebra do bloco `<script>`.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;

  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
