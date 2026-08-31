# Karla Neuropsi — novo site

Projeto moderno em Next.js/React para substituir a página estática da Karla Dias sem apagar os ativos existentes.

## O que já está estruturado
- Home comercial com foco elevado em neuropsicologia.
- Páginas de Sobre, Atendimentos, Infobooks, Blog, Contato e Agendamento.
- Área profissional `/login` + `/admin` com dashboard, pacientes, agenda, conteúdos, financeiro e configurações.
- PDF Online original preservado e acessível em `/pdf-online`.
- Landing pages originais preservadas em `/infobooks/cuidar` e `/infobooks/autismo`.
- Checkout Mercado Pago via API (`/api/checkout`) e webhook (`/api/webhooks/mercadopago`).
- Schema Supabase em `supabase/schema.sql` para pacientes, agenda, solicitações, produtos, pedidos, artigos e configurações.
- Design responsivo, tipografia editorial, microinterações, cards, CTA, acessibilidade básica e estrutura SEO.

## Importante antes de produção
A autenticação mostrada nesta primeira versão é um modo de implantação/demo. Para produção, conectar Supabase Auth e aplicar as políticas do schema.

O Mercado Pago está pronto para receber o `MERCADOPAGO_ACCESS_TOKEN`, mas uma conta real e suas credenciais precisam ser criadas pelo proprietário. Nunca coloque o token no frontend.

## Variáveis
Copie `.env.example` para `.env.local` e preencha as credenciais de produção.

## Comandos
```bash
npm install
npm run dev
npm run build
npm start
```

## Preservação
Os arquivos originais dentro de `public/legacy` não foram editados. O `index.html` do PDF Online, das duas landing pages e seus respectivos CSS/JS/assets permanecem como estavam no pacote original.
