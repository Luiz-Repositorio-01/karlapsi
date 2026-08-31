/** Estrutura de navegação do site público (fonte única para header e footer). */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  href?: string;
  items: NavItem[];
}

export const PRIMARY_NAV: (NavItem | NavGroup)[] = [
  {
    label: 'Neuropsicologia',
    href: '/neuropsicologia',
    items: [
      {
        label: 'O que é neuropsicologia',
        href: '/neuropsicologia',
        description: 'Conceito, indicações e etapas da avaliação',
      },
      {
        label: 'Avaliação neuropsicológica',
        href: '/avaliacao-neuropsicologica',
        description: 'Quando é indicada e como o processo é conduzido',
      },
      {
        label: 'Atendimentos',
        href: '/atendimentos',
        description: 'Formatos, duração e o que esperar',
      },
    ],
  },
  { label: 'Serviços', href: '/servicos' },
  {
    label: 'Conteúdos',
    href: '/publicacoes',
    items: [
      { label: 'Blog', href: '/blog', description: 'Artigos sobre cognição e aprendizagem' },
      { label: 'Infobooks', href: '/infobooks', description: 'Materiais digitais para aprofundar' },
      { label: 'PDF Online', href: '/pdf-online', description: 'Leitura online do material' },
      { label: 'Materiais', href: '/materiais', description: 'Produtos digitais disponíveis' },
      { label: 'Landing pages', href: '/landing-pages', description: 'Páginas dos materiais' },
    ],
  },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
];

export const FOOTER_NAV: NavGroup[] = [
  {
    label: 'Neuropsicologia',
    items: [
      { label: 'O que é', href: '/neuropsicologia' },
      { label: 'Avaliação neuropsicológica', href: '/avaliacao-neuropsicologica' },
      { label: 'Atendimentos', href: '/atendimentos' },
      { label: 'Serviços', href: '/servicos' },
    ],
  },
  {
    label: 'Conteúdos',
    items: [
      { label: 'Blog', href: '/blog' },
      { label: 'Infobooks', href: '/infobooks' },
      { label: 'PDF Online', href: '/pdf-online' },
      { label: 'Materiais', href: '/materiais' },
      { label: 'Landing pages', href: '/landing-pages' },
      { label: 'Publicações', href: '/publicacoes' },
    ],
  },
  {
    label: 'Atendimento',
    items: [
      { label: 'Agendar', href: '/agendamento' },
      { label: 'Contato', href: '/contato' },
      { label: 'Sobre', href: '/sobre' },
    ],
  },
  {
    label: 'Institucional',
    items: [
      { label: 'Política de privacidade', href: '/politica-de-privacidade' },
      { label: 'Termos de uso', href: '/termos' },
      { label: 'Área profissional', href: '/login' },
    ],
  },
];

export function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item;
}
