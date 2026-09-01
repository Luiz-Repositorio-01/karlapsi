# Editor de Documentos Online (HTML · CSS · JavaScript puro)

Editor de documentos tipo Word que roda **inteiramente no navegador**, sem framework e sem
servidor obrigatório. Abre por `index.html` e funciona com Live Server no VS Code. Instalável
como PWA e funciona offline.

> ✅ **Sem React · Sem Next.js · Sem Vue · Sem Angular · Sem Svelte · Sem Electron.**
> Núcleo em HTML5, CSS3 e JavaScript (ES Modules). Bibliotecas externas só quando necessárias.

## Como executar

- **Mais simples:** abra `index.html` com **Live Server** (VS Code) — recomendado, pois os
  ES Modules e o Service Worker exigem `http://` (não funcionam bem via `file://`).
- Ou qualquer servidor estático: `python -m http.server` na pasta do projeto.
- Publicável como **site estático** (GitHub Pages, Netlify, etc.).

## Estrutura

```
pdf online/
├── index.html            # página inicial (launcher: novo / abrir recentes)
├── editor.html           # o editor
├── manifest.webmanifest  # PWA
├── service-worker.js     # cache offline
├── favicon.ico
├── css/                  # estilos modulares (reset, variables, layout, toolbar, pages, tables, ...)
├── js/                   # módulos ES desacoplados (ver abaixo)
└── assets/icons/         # ícones do PWA
```

### Módulos JavaScript

| Arquivo | Responsabilidade |
|---|---|
| `app.js` | Bootstrap: conecta ribbon, menus, painéis e módulos |
| `editor-core.js` | Núcleo: modelo ↔ DOM, páginas, histórico, serialização |
| `document-model.js` | Modelo de dados do documento |
| `page-setup.js` | Tamanhos, orientação, margens |
| `formatting.js` | Formatação de texto (Selection/Range + execCommand) |
| `tables.js` | Tabelas editáveis + barra de contexto |
| `images.js` | Imagens flutuantes posicionáveis |
| `charts.js` | Gráficos em Canvas (colunas, barras, linha, área, pizza, rosca) com dados editáveis |
| `shapes.js` | Formas e linhas em SVG (mover/redimensionar, cor/borda) |
| `pagination.js` | Repaginação automática por altura útil |
| `docx-export.js` | Exportar Word (.doc HTML-Word) |
| `insert.js` | Quebras, linha, data, nº de página, caixa de texto |
| `find-replace.js` | Localizar e substituir com destaque |
| `selection.js` | Utilidades de Selection/Range |
| `history.js` | Desfazer/refazer por snapshots |
| `storage.js` | IndexedDB (documentos) + LocalStorage (preferências) |
| `autosave.js` | Salvamento automático e recuperação |
| `import.js` | Importar TXT / DOCX (Mammoth) / PDF (PDF.js) |
| `pdf-export.js` | Exportar PDF (pesquisável via impressão / imagem via jsPDF) |
| `print.js` | Impressão nativa com `@page` dinâmico |
| `keyboard-shortcuts.js` | Atalhos de teclado |
| `ui.js` | Modais, menus, miniaturas, propriedades, régua, zoom |
| `utils.js` | Utilidades genéricas |

## Timbrado da Karla (saída timbrada)

O documento **sai com o timbrado da Karla Dias** por padrão: a imagem
`assets/karla-dias/timbrado.png` é aplicada como fundo full-page da folha, com as margens no
espaço seguro do timbrado (52/22/59/22 mm). Aparece **na tela, na impressão e no PDF exportado**
(`print-color-adjust: exact` garante o fundo na impressão; o html2canvas captura o fundo no PDF-imagem).
Alternar em **Layout → Timbrado** (Karla / Nenhum) ou em *Configurar página → Papel timbrado*.

## Modelo de documento

```js
{
  id, title, createdAt, updatedAt,
  settings: { pageSize, orientation, customW, customH, margins:{top,right,bottom,left}, marginPreset, fontFamily, fontSize },
  pages: [ { id, html, header, footer } ],
  metadata: { author, subject, keywords },
  versions: []
}
```

Salvo em **IndexedDB** (store `documentos`). Preferências (tema, zoom, painéis) em **LocalStorage**.

## Exportar PDF

- **Exportar PDF (texto pesquisável)** → usa a impressão nativa do navegador; escolha
  *“Salvar como PDF”*. Gera texto vetorial selecionável/pesquisável, alta fidelidade.
- **Baixar PDF (imagem)** → `jsPDF` + `html2canvas`, download direto (rasterizado). Conveniência.

## Bibliotecas (carregadas sob demanda, via CDN)

| Lib | Uso | Por quê |
|---|---|---|
| jsPDF | PDF rasterizado | Geração client-side consolidada |
| html2canvas | Snapshot das folhas | Necessário para o PDF-imagem |
| Mammoth.js | Importar DOCX | Melhor conversor DOCX→HTML no navegador |
| PDF.js | Importar PDF | Padrão de fato para ler PDF no browser |
| Font Awesome | Ícones | Ícones da interface |

Arquitetura desacoplada: qualquer lib pode ser trocada sem afetar o núcleo.

## Limitações reais (honestas)

- **Repaginação automática**: implementada (redistribui blocos por altura útil). Roda ao editar
  (discreta), no botão *Layout → Ajustar páginas*, e automaticamente antes de exportar/imprimir.
  Não divide um único bloco gigante (ex.: uma tabela maior que a página) — esse caso pede quebra manual.
- **Exportar Word**: gera `.doc` HTML-Word (abre no Word/LibreOffice com texto, títulos, listas,
  tabelas, imagens e configuração de página). **Não** é OOXML nativo (.docx); o timbrado de fundo é
  garantido no **PDF/impressão**, não no .doc.
- **Edição de PDF** existente: importa o **texto** do PDF para edição; edição sobre o layout
  vetorial original e OCR de PDFs digitalizados são itens de roadmap.
- **Gráficos**: colunas, barras, linha, área, pizza e rosca (Canvas, dados editáveis). Tipos avançados
  (radar, funil, velocímetro) são roadmap.
- Corretor ortográfico usa o nativo do navegador (`spellcheck`); gramática/controle de alterações e
  comentários são roadmap.

## Roadmap (próximas etapas)

Tipos de gráfico avançados (radar/funil), divisão automática de tabelas grandes entre páginas,
exportação OOXML .docx nativa, edição vetorial de PDF, OCR, comentários/controle de alterações,
colaboração e login (Supabase).
