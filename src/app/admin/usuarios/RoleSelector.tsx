'use client';

import { useActionState, useEffect, useRef } from 'react';
import { inputClasses } from '@/components/ui';
import { useToast } from '@/components/ui/interactive';
import { IDLE_STATE, type ActionState } from '@/lib/actions/state';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/types';

/**
 * Troca de papel.
 *
 * O formulário é enviado na mudança do select; o banco reforça quem pode
 * conceder cada papel (ver triggers em 002_auth_profiles.sql).
 */
export function RoleSelector({
  action,
  profileId,
  currentRole,
  roles,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  profileId: string;
  currentRole: UserRole;
  roles: UserRole[];
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (state.status === 'success' && state.message) notify(state.message, 'success');
    if (state.status === 'error' && state.message) notify(state.message, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="profileId" value={profileId} />
      <label className="sr-only" htmlFor={`papel-${profileId}`}>
        Papel de acesso
      </label>
      <select
        id={`papel-${profileId}`}
        name="role"
        defaultValue={currentRole}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className={`${inputClasses} min-w-[11rem] py-2 text-sm`}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </form>
  );
}
