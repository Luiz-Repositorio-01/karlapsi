import type { Profile, UserRole } from '@/lib/types';

/**
 * Matriz de permissões.
 *
 * DEVELOPER: operação técnica (site, conteúdo, catálogo, configurações, auditoria)
 * sem pacientes, agenda clínica, documentos ou financeiro.
 */
export const PERMISSIONS = {
  'dashboard:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL', 'DEVELOPER'],
  'agenda:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'agenda:manage': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'patients:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'patients:manage': ['OWNER', 'ADMIN', 'ASSISTANT'],
  'patients:anonymize': ['OWNER', 'ADMIN'],
  'services:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL', 'DEVELOPER'],
  'services:manage': ['OWNER', 'ADMIN', 'DEVELOPER'],
  'availability:manage': ['OWNER', 'ADMIN', 'PROFESSIONAL', 'DEVELOPER'],
  'finance:view': ['OWNER', 'ADMIN'],
  'finance:manage': ['OWNER', 'ADMIN'],
  'products:view': ['OWNER', 'ADMIN', 'DEVELOPER'],
  'products:manage': ['OWNER', 'ADMIN', 'DEVELOPER'],
  'content:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL', 'DEVELOPER'],
  'content:manage': ['OWNER', 'ADMIN', 'PROFESSIONAL', 'DEVELOPER'],
  'documents:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL'],
  'documents:manage': ['OWNER', 'ADMIN', 'PROFESSIONAL'],
  'notifications:view': ['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL', 'DEVELOPER'],
  'settings:view': ['OWNER', 'ADMIN', 'DEVELOPER'],
  'settings:manage': ['OWNER', 'ADMIN', 'DEVELOPER'],
  'users:manage': ['OWNER'],
  'audit:view': ['OWNER', 'ADMIN', 'DEVELOPER'],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

/**
 * Papel efetivo na aplicação. Antes da migration 015 o banco pode estar em ADMIN/ASSISTANT
 * com `user_metadata.role = DEVELOPER` — a UI e as actions seguem DEVELOPER.
 */
export function resolveEffectiveRole(
  profile: Pick<Profile, 'role' | 'email'>,
  metadata?: { role?: unknown } | null,
): UserRole {
  if (profile.role === 'DEVELOPER') return 'DEVELOPER';
  const intended = metadata?.role;
  if (intended === 'DEVELOPER') return 'DEVELOPER';
  return profile.role;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Proprietária',
  ADMIN: 'Administração',
  ASSISTANT: 'Secretaria',
  PROFESSIONAL: 'Profissional',
  DEVELOPER: 'Desenvolvimento',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  OWNER: 'Controle total, incluindo permissões de acesso e dados financeiros.',
  ADMIN: 'Administra o sistema, agenda, pacientes, financeiro e conteúdos.',
  ASSISTANT: 'Apoio operacional: agenda, pacientes e solicitações. Sem acesso financeiro.',
  PROFESSIONAL: 'Agenda, pacientes e conteúdos. Sem acesso financeiro nem a permissões.',
  DEVELOPER:
    'Operação técnica do site: conteúdo, configurações, catálogo e auditoria. Sem pacientes, documentos clínicos ou financeiro.',
};
