import type { UserRole } from '@/lib/types';

/**
 * Matriz de permissões.
 *
 * Esta matriz existe para a INTERFACE (esconder o que não é permitido) e para
 * checagem antecipada em Server Actions. A autorização efetiva é do banco
 * (RLS + funções `app.is_staff/is_admin/is_owner`): mesmo que alguém burle o
 * frontend, o Postgres recusa a operação.
 */
export const PERMISSIONS = {
  'dashboard:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'agenda:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'agenda:manage': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'patients:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'patients:manage': ['OWNER', 'ADMIN', 'ASSISTANT'],
  'patients:anonymize': ['OWNER', 'ADMIN'],
  'services:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'services:manage': ['OWNER', 'ADMIN'],
  'availability:manage': ['OWNER', 'ADMIN', 'PROFESSIONAL'],
  'finance:view': ['OWNER', 'ADMIN'],
  'finance:manage': ['OWNER', 'ADMIN'],
  'products:view': ['OWNER', 'ADMIN'],
  'products:manage': ['OWNER', 'ADMIN'],
  'content:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'content:manage': ['OWNER', 'ADMIN', 'PROFESSIONAL'],
  'documents:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'documents:manage': ['OWNER', 'ADMIN', 'PROFESSIONAL'],
  'notifications:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'settings:view': ['OWNER', 'ADMIN'],
  'settings:manage': ['OWNER', 'ADMIN'],
  'users:manage': ['OWNER'],
  'audit:view': ['OWNER', 'ADMIN'],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Proprietária',
  ADMIN: 'Administração',
  ASSISTANT: 'Secretaria',
  PROFESSIONAL: 'Profissional',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  OWNER: 'Controle total, incluindo permissões de acesso e dados financeiros.',
  ADMIN: 'Administra o sistema, agenda, pacientes, financeiro e conteúdos.',
  ASSISTANT: 'Apoio operacional: agenda, pacientes e solicitações. Sem acesso financeiro.',
  PROFESSIONAL: 'Agenda, pacientes e conteúdos. Sem acesso financeiro nem a permissões.',
};
