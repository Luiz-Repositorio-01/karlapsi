# Módulos originais preservados (`/public/legacy`)

Esta pasta guarda **os arquivos originais** do PDF Online, dos infobooks e das
landing pages. Eles são servidos como arquivos estáticos, **sem passar pelo
processamento do Next.js**, exatamente como estavam antes da reconstrução do
site.

> **Não edite o conteúdo destes arquivos.** O site novo apenas os apresenta em
> uma área própria, com destaque na Home e navegação integrada.

## Estrutura esperada

```
public/legacy/
├── pdf-online/
│   ├── index.html          ← página original do PDF Online
│   ├── assets/…            ← CSS, JS, imagens e fontes originais
│   └── *.pdf               ← PDFs, se houver
└── landing-pages/
    ├── <slug>/
    │   ├── index.html      ← landing page original (ex.: cuidar, autismo)
    │   └── assets/…
    └── …
```

## Como o site usa esta pasta

| Item | Comportamento |
| --- | --- |
| `/pdf-online` | Página nova que apresenta o módulo e **incorpora** `legacy/pdf-online/index.html` quando o arquivo existe. Se não existir, a página explica o que falta em vez de mostrar um iframe quebrado. |
| `/landing-pages/<slug>` e `/infobooks/<slug>` | Vitrine nova com o botão "Acessar" apontando para o HTML original correspondente. |
| URLs antigas | Continuam válidas: `next.config.ts` reescreve `/pdf-online/index.html`, `/pdf-online/assets/*`, `/infobooks/<slug>/index.html`, `/infobooks/<slug>/assets/*`, `/landing-pages/<slug>/index.html` e `/landing-pages/<slug>/assets/*` para os arquivos desta pasta. Nenhum link publicado é quebrado. |

Também é possível registrar o caminho manualmente no painel administrativo, no
campo **Caminho legado** de cada infobook ou landing page (por exemplo
`legacy/landing-pages/cuidar/index.html`).

## Por que a pasta está (quase) vazia neste repositório

No repositório recebido, apenas os arquivos de configuração do projeto estavam
versionados — o `README` antigo mencionava `public/legacy`, mas os arquivos
originais nunca foram enviados ao Git (o histórico tem um único commit, sem
essas pastas).

Para restaurar os módulos originais, copie as pastas do pacote original para os
caminhos acima e faça o deploy. **Nenhuma outra alteração é necessária:** a
detecção é automática e as URLs antigas já estão mapeadas.

## Regras de segurança aplicadas a esta pasta

- O `proxy.ts` (autenticação/sessão) ignora `/legacy/*`, para não interferir no
  funcionamento dos arquivos originais.
- O ESLint ignora esta pasta, evitando que o código legado quebre o lint.
- O CSP do site permite `frame-src 'self'`, o que autoriza a incorporação dos
  arquivos legados por serem servidos pelo mesmo domínio.
