import type { ZodError } from 'zod';
import { fieldErrors } from '@/lib/validation/schemas';

/**
 * Contrato de estado das Server Actions.
 *
 * Este módulo é compartilhado entre servidor e cliente (por isso NÃO importa
 * `server-only`): os componentes de formulário precisam do tipo e do estado
 * inicial para `useActionState`.
 */
export interface ActionState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  /** Erros por campo, no formato `{ campo: mensagem }`. */
  fields?: Record<string, string>;
}

export const IDLE_STATE: ActionState = { status: 'idle' };

export function successState(message: string): ActionState {
  return { status: 'success', message };
}

export function errorState(message: string, fields?: Record<string, string>): ActionState {
  return { status: 'error', message, fields };
}

export function validationState(error: ZodError): ActionState {
  return {
    status: 'error',
    message: 'Verifique os campos destacados.',
    fields: fieldErrors(error),
  };
}
