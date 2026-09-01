import type { Permission } from '@/lib/auth/rbac';

/**
 * Itens da sidebar. Cada item declara a permissão exigida — a montagem do menu
 * acontece no servidor, então um perfil sem acesso nem recebe o link no HTML.
 */
export interface AdminNavItem {
  label: string;
  href: string;
  icon: AdminIconName;
  permission: Permission;
  exact?: boolean;
}

export type AdminIconName =
  | 'dashboard'
  | 'calendar'
  | 'users'
  | 'briefcase'
  | 'clock'
  | 'wallet'
  | 'package'
  | 'book'
  | 'layout'
  | 'edit'
  | 'file'
  | 'bell'
  | 'settings'
  | 'shield'
  | 'history';

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Operação',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: 'dashboard',
        permission: 'dashboard:view',
        exact: true,
      },
      { label: 'Agenda', href: '/admin/agenda', icon: 'calendar', permission: 'agenda:view' },
      { label: 'Pacientes', href: '/admin/pacientes', icon: 'users', permission: 'patients:view' },
      {
        label: 'Serviços',
        href: '/admin/servicos',
        icon: 'briefcase',
        permission: 'services:view',
      },
      {
        label: 'Disponibilidade',
        href: '/admin/disponibilidade',
        icon: 'clock',
        permission: 'availability:manage',
      },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Financeiro', href: '/admin/financeiro', icon: 'wallet', permission: 'finance:view' },
      { label: 'Produtos', href: '/admin/produtos', icon: 'package', permission: 'products:view' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      {
        label: 'Calendário editorial',
        href: '/admin/blog',
        icon: 'edit',
        permission: 'content:view',
      },
      { label: 'Infobooks', href: '/admin/infobooks', icon: 'book', permission: 'content:view' },
      {
        label: 'Landing pages',
        href: '/admin/landing-pages',
        icon: 'layout',
        permission: 'content:view',
      },
      {
        label: 'Páginas',
        href: '/admin/paginas',
        icon: 'layout',
        permission: 'settings:manage',
      },
      {
        label: 'Depoimentos',
        href: '/admin/depoimentos',
        icon: 'file',
        permission: 'content:view',
      },
      {
        label: 'Documentos',
        href: '/admin/documentos',
        icon: 'file',
        permission: 'documents:view',
      },
      {
        label: 'PDF Online',
        href: '/admin/pdf-online',
        icon: 'file',
        permission: 'documents:view',
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        label: 'Notificações',
        href: '/admin/notificacoes',
        icon: 'bell',
        permission: 'notifications:view',
      },
      {
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: 'settings',
        permission: 'settings:view',
      },
      { label: 'Usuários', href: '/admin/usuarios', icon: 'shield', permission: 'users:manage' },
      { label: 'Auditoria', href: '/admin/auditoria', icon: 'history', permission: 'audit:view' },
    ],
  },
];
