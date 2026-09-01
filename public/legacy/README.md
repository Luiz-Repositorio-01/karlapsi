# Módulos originais preservados (`/public/legacy`)

Esta pasta guarda **os arquivos originais** do PDF Online e dos infobooks.
Eles são servidos como estáticos, **sem alteração de bytes**.

> **Não edite o conteúdo destes arquivos.**

## Estrutura

```
public/legacy/
├── pdf-online/                 ← editor interno (somente equipe autenticada)
│   └── index.html
└── infobooks/
    ├── autismo/                ← landing original (catálogo público)
    └── cuidar/
```

## Como o site usa esta pasta

| Item | Comportamento |
| --- | --- |
| `/admin/pdf-online` | Painel interno incorpora `legacy/pdf-online/index.html`. Visitantes não têm acesso. |
| `/legacy/pdf-online/*` | Exige login. Sem sessão, redireciona para `/login`. |
| `/pdf-online` | Redireciona para `/infobooks` (o editor não entra no site público). |
| `/infobooks/autismo` e `/infobooks/cuidar` | Vitrine nova com capa, texto original e botão Hotmart. O HTML original permanece intacto. |

## Regras de segurança

- O `proxy.ts` autentica `/admin` e `/legacy/pdf-online`.
- Infobooks públicos em `/legacy/infobooks` continuam acessíveis sem login.
- O ESLint ignora esta pasta.
- O CSP permite `frame-src 'self'` para incorporar os HTML originais no mesmo domínio.
