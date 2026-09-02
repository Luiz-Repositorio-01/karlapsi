import { TZDate } from '@date-fns/tz';

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const WEEKDAY_LONG = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const WEEKDAY_NAMES = WEEKDAY_LONG;
export const WEEKDAY_SHORT_NAMES = WEEKDAY_SHORT;

/** Moeda em Real. `null` vira texto neutro em vez de "R$ 0,00". */
export function formatCurrency(cents: number | null | undefined, fallback = 'A combinar'): string {
  if (cents === null || cents === undefined) return fallback;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatCentsInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** Converte "1.234,56" ou "1234.56" em centavos. */
export function parseCurrencyToCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(/R\$/i, '');
  if (!normalized) return null;
  const cleaned = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function zoned(value: string | Date, timezone = DEFAULT_TIMEZONE): TZDate {
  return new TZDate(typeof value === 'string' ? new Date(value) : value, timezone);
}

export function formatDate(value: string | Date, timezone = DEFAULT_TIMEZONE): string {
  const date = zoned(value, timezone);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function formatTime(value: string | Date, timezone = DEFAULT_TIMEZONE): string {
  const date = zoned(value, timezone);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTime(value: string | Date, timezone = DEFAULT_TIMEZONE): string {
  return `${formatDate(value, timezone)} às ${formatTime(value, timezone)}`;
}

export function formatLongDate(value: string | Date, timezone = DEFAULT_TIMEZONE): string {
  const date = zoned(value, timezone);
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

/** Data local YYYY-MM-DD → "Ter, 10 de março". */
export function formatDateKeyLabel(dateKey: string): string {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return `${WEEKDAY_SHORT[date.getUTCDay()]}, ${date.getUTCDate()} de ${months[date.getUTCMonth()]}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return hours === 1 ? '1 hora' : `${hours} horas`;
  return `${hours}h${String(rest).padStart(2, '0')}`;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return value;
}

/**
 * CPF sempre mascarado por padrão (LGPD: minimização na exibição).
 * Somente telas que realmente precisam do número completo passam `full`.
 */
export function formatCpf(value: string | null | undefined, mode: 'masked' | 'full' = 'masked'): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  const formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  if (mode === 'full') return formatted;
  return `***.${digits.slice(3, 6)}.***-${digits.slice(9)}`;
}

export function formatAge(birthDate: string | null | undefined, now = new Date()): string {
  if (!birthDate) return '';
  const [year = '0', month = '1', day = '1'] = birthDate.split('-');
  let age = now.getFullYear() - Number(year);
  const monthDiff = now.getMonth() + 1 - Number(month);
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < Number(day))) age -= 1;
  if (age < 0) return '';
  return age === 1 ? '1 ano' : `${age} anos`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** Recorta texto corrido para cards e assinaturas, sem cortar no meio de palavras. */
export function truncateText(text: string, maxLength = 280): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Link de WhatsApp com mensagem pré-preenchida. */
export function whatsappLink(number: string, message?: string): string {
  const digits = number.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
