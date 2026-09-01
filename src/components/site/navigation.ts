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

/**
 * Menu limpo — sem PDF Online nem Landing Pages na experiência pública.
 */
export const PRIMARY_NAV: (NavItem | NavGroup)[] = [
  { label: 'Sobre', href: '/sobre' },
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
        description: 'Online, presencial e o que esperar',
      },
    ],
  },
  { label: 'Atendimentos', href: '/atendimentos' },
  { label: 'Infobooks', href: '/infobooks' },
  { label: 'Blog', href: '/blog' },
  { label: 'Novidades', href: '/novidades' },
  { label: 'Contato', href: '/contato' },
];

/** Footer compacto — poucos links, sem PDF Online / Landing Pages. */
export const FOOTER_NAV: NavItem[] = [
  { label: 'Início', href: '/' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Atendimentos', href: '/atendimentos' },
  { label: 'Infobooks', href: '/infobooks' },
  { label: 'Blog', href: '/blog' },
  { label: 'Novidades', href: '/novidades' },
  { label: 'Agendamento', href: '/agendamento' },
  { label: 'Contato', href: '/contato' },
  { label: 'Privacidade', href: '/politica-de-privacidade' },
  { label: 'Termos', href: '/termos' },
];

export function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item;
}
