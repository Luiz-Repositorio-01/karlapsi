'use client';

import { useState, type ReactNode } from 'react';
import { Pencil, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormField,
  fieldAria,
  inputClasses,
} from '@/components/ui';
import { Modal } from '@/components/ui/interactive';
import { ActionButton, ActionForm } from '@/components/admin/forms';
import { CurrencyField } from '@/components/admin/CurrencyField';
import { cn } from '@/lib/utils/cn';
import { slugify } from '@/lib/utils/format';
import type { ActionState } from '@/lib/actions/state';

/**
 * CRUD genérico do painel.
 *
 * Serviços, produtos, infobooks, landing pages e depoimentos compartilham o
 * mesmo padrão de tela (lista + modal de formulário). Em vez de repetir cinco
 * telas quase idênticas, a estrutura é declarada por uma lista de campos e a
 * Server Action específica de cada recurso é injetada.
 */

export interface CrudField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'checkbox'
    | 'select'
    | 'url'
    | 'slug'
    | 'currency-cents'
    | 'date'
    | 'datetime';
  hint?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  fullWidth?: boolean;
  /** Nome do campo de origem para gerar o slug automaticamente. */
  slugSource?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
}

export type CrudBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'sand';

export interface CrudListItem {
  id: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  badges?: { label: string; tone?: CrudBadgeTone }[];
  href?: string;
  hrefLabel?: string;
  values: Record<string, string | number | boolean | null | undefined>;
  extraAction?: {
    label: string;
    action: (state: ActionState, formData: FormData) => Promise<ActionState>;
    fields: Record<string, string | number | boolean>;
  };
}

export interface CrudManagerProps {
  items: CrudListItem[];
  fields: CrudField[];
  /** Server Action com o id como primeiro parâmetro (vinculado no cliente). */
  action: (id: string | null, state: ActionState, formData: FormData) => Promise<ActionState>;
  createLabel: string;
  editLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  modalSize?: 'md' | 'lg';
  extraActions?: ReactNode;
}

export function CrudManager({
  items,
  fields,
  action,
  createLabel,
  editLabel,
  emptyTitle,
  emptyDescription,
  modalSize = 'lg',
  extraActions,
}: CrudManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const editingItem = items.find((item) => item.id === editingId) ?? null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {createLabel}
        </Button>
        {extraActions}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              {createLabel}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <CrudRow
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                badges={
                  item.badges?.length ? (
                    <>
                      {item.badges.map((badge) => (
                        <Badge key={badge.label} tone={badge.tone}>
                          {badge.label}
                        </Badge>
                      ))}
                    </>
                  ) : null
                }
                onEdit={() => setEditingId(item.id)}
                actions={
                  <>
                    {item.href ? (
                      <ButtonLink href={item.href} external variant="ghost" size="sm">
                        {item.hrefLabel ?? 'Ver no site'}
                      </ButtonLink>
                    ) : null}
                    {item.extraAction ? (
                      <ActionButton
                        action={item.extraAction.action}
                        label={item.extraAction.label}
                        variant="ghost"
                        fields={item.extraAction.fields}
                      />
                    ) : null}
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title={createLabel} size={modalSize}>
        <CrudForm
          fields={fields}
          values={{}}
          action={action.bind(null, null)}
          submitLabel="Criar"
          onDone={() => setCreating(false)}
        />
      </Modal>

      <Modal
        open={Boolean(editingItem)}
        onClose={() => setEditingId(null)}
        title={editLabel}
        size={modalSize}
      >
        {editingItem ? (
          <CrudForm
            fields={fields}
            values={editingItem.values}
            action={action.bind(null, editingItem.id)}
            submitLabel="Salvar alterações"
            onDone={() => setEditingId(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function CrudForm({
  fields,
  values,
  action,
  submitLabel,
  onDone,
}: {
  fields: CrudField[];
  values: Record<string, string | number | boolean | null | undefined>;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  onDone: () => void;
}) {
  // Slug sugerido a partir do título enquanto o usuário digita (editável).
  const [slugValues, setSlugValues] = useState<Record<string, string>>({});

  return (
    <ActionForm action={action} submitLabel={submitLabel} pendingLabel="Salvando…" onSuccess={onDone}>
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `crud-${field.name}`;
            const error = state.fields?.[field.name];
            const rawValue = values[field.name];

            if (field.type === 'currency-cents') {
              return (
                <CurrencyField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  defaultCents={typeof rawValue === 'number' ? rawValue : null}
                  hint={field.hint}
                  error={error}
                  required={field.required}
                  className={cn(field.fullWidth && 'sm:col-span-2')}
                />
              );
            }

            if (field.type === 'checkbox') {
              return (
                <label
                  key={field.name}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl bg-surface-muted p-4',
                    field.fullWidth && 'sm:col-span-2',
                  )}
                >
                  <input
                    type="checkbox"
                    name={field.name}
                    defaultChecked={Boolean(rawValue)}
                    className="mt-0.5 h-4 w-4 accent-petrol-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink-soft">{field.label}</span>
                    {field.hint ? (
                      <span className="mt-0.5 block text-xs text-ink-faint">{field.hint}</span>
                    ) : null}
                  </span>
                </label>
              );
            }

            return (
              <FormField
                key={field.name}
                label={field.label}
                htmlFor={id}
                hint={field.hint}
                error={error}
                required={field.required}
                className={cn(field.fullWidth && 'sm:col-span-2')}
              >
                {field.type === 'textarea' ? (
                  <textarea
                    {...fieldAria(id, { hint: Boolean(field.hint), error: Boolean(error) })}
                    name={field.name}
                    rows={field.rows ?? 4}
                    defaultValue={rawValue == null ? '' : String(rawValue)}
                    className={cn(inputClasses, 'resize-y')}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select
                    {...fieldAria(id, { hint: Boolean(field.hint), error: Boolean(error) })}
                    name={field.name}
                    defaultValue={rawValue == null ? '' : String(rawValue)}
                    className={inputClasses}
                    required={field.required}
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'slug' ? (
                  <input
                    {...fieldAria(id, { hint: Boolean(field.hint), error: Boolean(error) })}
                    type="text"
                    name={field.name}
                    value={
                      slugValues[field.name] ??
                      (rawValue == null ? '' : String(rawValue))
                    }
                    onChange={(event) =>
                      setSlugValues((current) => ({
                        ...current,
                        [field.name]: slugify(event.target.value),
                      }))
                    }
                    className={inputClasses}
                    required={field.required}
                  />
                ) : (
                  <input
                    {...fieldAria(id, { hint: Boolean(field.hint), error: Boolean(error) })}
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'url'
                          ? 'url'
                          : field.type === 'date'
                            ? 'date'
                            : field.type === 'datetime'
                              ? 'datetime-local'
                              : 'text'
                    }
                    name={field.name}
                    defaultValue={rawValue == null ? '' : String(rawValue)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={inputClasses}
                    required={field.required}
                    onChange={
                      field.slugSource
                        ? undefined
                        : (event) => {
                            // Sugere slug automaticamente ao digitar o título.
                            const slugField = fields.find((item) => item.slugSource === field.name);
                            if (slugField && !slugValues[slugField.name]) {
                              setSlugValues((current) => ({
                                ...current,
                                [slugField.name]: slugify(event.target.value),
                              }));
                            }
                          }
                    }
                  />
                )}
              </FormField>
            );
          })}
        </div>
      )}
    </ActionForm>
  );
}

/** Linha padrão de item nas listas de CRUD. */
export function CrudRow({
  title,
  subtitle,
  meta,
  badges,
  onEdit,
  actions,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  badges?: ReactNode;
  onEdit: () => void;
  actions?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{title}</p>
            {badges}
          </div>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>
          ) : null}
          {meta ? <p className="mt-1.5 text-xs text-ink-faint">{meta}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            Editar
          </Button>
          {actions}
        </div>
      </div>
    </Card>
  );
}
