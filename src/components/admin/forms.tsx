'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, buttonClasses } from '@/components/ui';
import { ConfirmDialog, SubmitButton, useToast } from '@/components/ui/interactive';
import { IDLE_STATE, type ActionState } from '@/lib/actions/state';

/**
 * Ponte entre Server Actions e feedback de interface.
 *
 * Toda ação do painel expõe `loading`, `disabled`, sucesso e erro — nenhuma
 * operação fica sem retorno visível para quem clicou.
 */

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  onSuccess,
  className,
  variant = 'primary',
  hiddenFields,
  showInlineFeedback = true,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode | ((state: ActionState) => ReactNode);
  submitLabel: string;
  pendingLabel?: string;
  onSuccess?: () => void;
  className?: string;
  variant?: Parameters<typeof buttonClasses>[0];
  hiddenFields?: Record<string, string | number | boolean | null | undefined>;
  showInlineFeedback?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const { notify } = useToast();

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      notify(state.message, 'success');
      onSuccess?.();
    }
    if (state.status === 'error' && state.message && !state.fields) {
      notify(state.message, 'error');
    }
    // `notify`/`onSuccess` são estáveis o suficiente; o gatilho é o estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className={className} noValidate>
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) =>
            value === null || value === undefined ? null : (
              <input key={key} type="hidden" name={key} value={String(value)} />
            ),
          )
        : null}

      {typeof children === 'function' ? children(state) : children}

      {showInlineFeedback && state.status === 'error' && state.message ? (
        <Alert tone="danger" className="mt-4">
          {state.message}
        </Alert>
      ) : null}

      <div className="mt-5">
        <SubmitButton pending={pending} pendingLabel={pendingLabel} variant={variant}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}

/** Botão que dispara uma ação com campos fixos (mudança de status etc.). */
export function ActionButton({
  action,
  label,
  fields,
  variant = 'secondary',
  size = 'sm',
  confirm,
  pendingLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: ReactNode;
  fields: Record<string, string | number | boolean>;
  variant?: Parameters<typeof buttonClasses>[0];
  size?: Parameters<typeof buttonClasses>[1];
  confirm?: { title: string; description?: string; confirmLabel?: string; danger?: boolean };
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (state.status === 'success' && state.message) notify(state.message, 'success');
    if (state.status === 'error' && state.message) notify(state.message, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="inline">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={String(value)} />
      ))}

      {confirm ? (
        <>
          <Button
            type="button"
            variant={variant}
            size={size}
            disabled={pending}
            onClick={() => setDialogOpen(true)}
          >
            {pending ? (pendingLabel ?? '…') : label}
          </Button>
          <ConfirmDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onConfirm={() => {
              setDialogOpen(false);
              formRef.current?.requestSubmit();
            }}
            title={confirm.title}
            description={confirm.description}
            confirmLabel={confirm.confirmLabel}
            tone={confirm.danger ? 'danger' : 'primary'}
            pending={pending}
          />
        </>
      ) : (
        <SubmitButton pending={pending} pendingLabel={pendingLabel ?? '…'} variant={variant} size={size}>
          {label}
        </SubmitButton>
      )}
    </form>
  );
}

/** Ação sem campos (ex.: "marcar todas como lidas"). */
export function SimpleAction({
  action,
  label,
  variant = 'secondary',
  size = 'sm',
}: {
  action: () => Promise<ActionState>;
  label: ReactNode;
  variant?: Parameters<typeof buttonClasses>[0];
  size?: Parameters<typeof buttonClasses>[1];
}) {
  const [pending, setPending] = useState(false);
  const { notify } = useToast();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const result = await action();
          if (result.message) {
            notify(result.message, result.status === 'error' ? 'error' : 'success');
          }
        } catch {
          notify('Não foi possível concluir a ação.', 'error');
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? '…' : label}
    </Button>
  );
}
