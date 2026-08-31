import 'server-only';

import { headers } from 'next/headers';
import type { z, ZodTypeAny } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';
import { can, type Permission } from '@/lib/auth/rbac';
import { humanizeDomainError } from '@/lib/utils/labels';
import {
  errorState,
  successState,
  validationState,
  type ActionState,
} from '@/lib/actions/state';

/**
 * Base das Server Actions do painel.
 *
 * Toda ação passa por `authorize()`, que confirma sessão e permissão NO
 * SERVIDOR antes de qualquer escrita. Mesmo assim, a autorização definitiva é
 * do banco (RLS): se uma policy negar, a operação falha, e a UI mostra o erro.
 */

// Reexporta o contrato compartilhado para as ações não precisarem de dois
// imports; o estado em si vive em `@/lib/actions/state` (client-safe).
export { errorState, successState, validationState };
export type { ActionState };

export class ActionAuthorizationError extends Error {
  constructor(message = 'Você não tem permissão para esta ação.') {
    super(message);
    this.name = 'ActionAuthorizationError';
  }
}

export interface AuthorizedContext {
  session: SessionUser;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
}

export async function authorize(permission: Permission): Promise<AuthorizedContext> {
  const session = await getSessionUser();
  if (!session) throw new ActionAuthorizationError('Sessão expirada. Entre novamente.');
  if (!can(session.profile.role, permission)) throw new ActionAuthorizationError();

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new ActionAuthorizationError('Banco de dados não configurado.');

  return { session, supabase };
}

/** Registra a ação na trilha de auditoria (nunca inclui senha/token). */
export async function audit(
  context: AuthorizedContext,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const headerList = await headers();
    await context.supabase.rpc('log_audit_event', {
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId ?? null,
      p_details: details ?? {},
      p_ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      p_user_agent: headerList.get('user-agent')?.slice(0, 400) ?? null,
    });
  } catch (error) {
    // Falha de auditoria não deve derrubar a operação do usuário, mas precisa
    // aparecer no log do servidor.
    console.error('[audit] não foi possível registrar o evento:', error);
  }
}

/** Converte FormData em objeto, tratando checkboxes e campos vazios. */
export function formToObject(
  formData: FormData,
  options?: { booleans?: string[]; numbers?: string[] },
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    result[key] = value;
  }

  for (const key of options?.booleans ?? []) {
    result[key] = formData.get(key) === 'on' || formData.get(key) === 'true';
  }

  for (const key of options?.numbers ?? []) {
    const raw = formData.get(key);
    if (raw === null || raw === '') {
      delete result[key];
    }
  }

  return result;
}

export function parseForm<Schema extends ZodTypeAny>(
  schema: Schema,
  formData: FormData,
  options?: { booleans?: string[]; numbers?: string[] },
): { ok: true; data: z.output<Schema> } | { ok: false; state: ActionState } {
  const parsed = schema.safeParse(formToObject(formData, options));
  if (!parsed.success) return { ok: false, state: validationState(parsed.error) };
  return { ok: true, data: parsed.data };
}

/** Traduz erros de banco em mensagens compreensíveis. */
export function databaseErrorState(error: { message: string; code?: string }): ActionState {
  if (error.code === '23P01' || error.message.includes('appointments_no_overlap')) {
    return errorState('Já existe um atendimento ativo neste horário. Escolha outro horário.');
  }
  if (error.code === '23505' || error.message.includes('duplicate key')) {
    return errorState('Já existe um registro com este identificador (slug, CPF ou e-mail).');
  }
  if (error.code === '42501' || error.message.includes('row-level security')) {
    return errorState('Seu perfil não tem permissão para esta operação.');
  }
  if (error.code === '23514') {
    return errorState('Algum valor informado não atende às regras de validação do sistema.');
  }

  return errorState(humanizeDomainError(error.message, 'Não foi possível concluir a operação.'));
}

/** Envolve a ação capturando erros de autorização em estado de UI. */
export async function runAction(
  handler: () => Promise<ActionState>,
): Promise<ActionState> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ActionAuthorizationError) {
      return errorState(error.message);
    }
    console.error('[action] falha inesperada:', error);
    return errorState('Erro inesperado. Tente novamente.');
  }
}
