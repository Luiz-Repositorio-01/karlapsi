import { z } from 'zod';

/**
 * Validação de entrada — SEMPRE executada no servidor.
 * Os mesmos schemas são reutilizados no cliente apenas para dar feedback
 * imediato; nunca como única barreira.
 */

const digits = (value: string) => value.replace(/\D/g, '');

export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Informe o telefone com DDD')
  .transform(digits)
  .refine((value) => value.length >= 10 && value.length <= 13, 'Telefone inválido');

export const emailSchema = z
  .string()
  .trim()
  .min(5, 'Informe o e-mail')
  .max(160, 'E-mail muito longo')
  .email('E-mail inválido')
  .transform((value) => value.toLowerCase());

export const nameSchema = z
  .string()
  .trim()
  .min(3, 'Informe o nome completo')
  .max(160, 'Nome muito longo');

export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export const cpfSchema = z
  .string()
  .trim()
  .transform(digits)
  .refine((value) => value.length === 0 || value.length === 11, 'CPF deve ter 11 dígitos')
  .refine((value) => value.length === 0 || isValidCpf(value), 'CPF inválido')
  .transform((value) => (value.length === 11 ? value : undefined))
  .optional();

/** Validação real dos dígitos verificadores (evita CPF inventado no cadastro). */
export function isValidCpf(value: string): boolean {
  const cpf = digits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcCheck = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcCheck(9) === Number(cpf[9]) && calcCheck(10) === Number(cpf[10]);
}

export const slugSchema = z
  .string()
  .trim()
  .min(2, 'Slug muito curto')
  .max(80, 'Slug muito longo')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífen');

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z$/));

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use AAAA-MM-DD)');

export const timeOnlySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (use HH:MM)');

// -----------------------------------------------------------------------------
// Site público
// -----------------------------------------------------------------------------
export const appointmentRequestSchema = z.object({
  serviceId: z.string().uuid('Selecione um serviço válido'),
  startsAt: isoDateTimeSchema,
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  birthDate: dateOnlySchema.optional(),
  isForDependent: z.boolean().default(false),
  dependentName: optionalText(160),
  message: optionalText(1200),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a política de privacidade' }),
  }),
});

export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;

export const contactMessageSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: optionalText(160),
  message: z.string().trim().min(10, 'Escreva sua mensagem').max(4000, 'Mensagem muito longa'),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a política de privacidade' }),
  }),
});

export const dataSubjectRequestSchema = z.object({
  requesterName: nameSchema,
  requesterEmail: emailSchema,
  requestType: z.enum(['access', 'rectification', 'deletion', 'portability', 'revoke_consent']),
  details: optionalText(2000),
});

export const checkoutSchema = z.object({
  productSlug: slugSchema,
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema.optional(),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a política de privacidade' }),
  }),
});

// -----------------------------------------------------------------------------
// Painel administrativo
// -----------------------------------------------------------------------------
export const patientSchema = z.object({
  fullName: nameSchema,
  socialName: optionalText(160),
  cpf: cpfSchema,
  rg: optionalText(30),
  birthDate: dateOnlySchema.optional().or(z.literal('').transform(() => undefined)),
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  phone: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  whatsapp: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  addressStreet: optionalText(160),
  addressNumber: optionalText(20),
  addressComplement: optionalText(80),
  addressDistrict: optionalText(80),
  addressCity: optionalText(80),
  addressState: optionalText(2),
  addressZip: optionalText(9),
  guardianName: optionalText(160),
  guardianPhone: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  guardianRelationship: optionalText(60),
  referralSource: optionalText(120),
  adminNotes: optionalText(4000),
});

export const appointmentSchema = z
  .object({
    patientId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
    serviceId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
    date: dateOnlySchema,
    startTime: timeOnlySchema,
    endTime: timeOnlySchema,
    status: z.enum([
      'requested',
      'confirmed',
      'awaiting_payment',
      'paid',
      'completed',
      'cancelled',
      'no_show',
      'rescheduled',
    ]),
    origin: z.enum(['public_site', 'admin', 'whatsapp', 'phone', 'import', 'other']),
    priceCents: z.coerce.number().int().min(0).optional(),
    paymentMethod: z
      .enum([
        'mercadopago',
        'pix',
        'credit_card',
        'debit_card',
        'cash',
        'bank_transfer',
        'health_insurance',
        'other',
      ])
      .optional()
      .or(z.literal('').transform(() => undefined)),
    contactName: optionalText(160),
    contactEmail: emailSchema.optional().or(z.literal('').transform(() => undefined)),
    contactPhone: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
    adminNotes: optionalText(4000),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'O horário final deve ser depois do inicial',
    path: ['endTime'],
  });

export const blockedTimeSchema = z
  .object({
    date: dateOnlySchema,
    startTime: timeOnlySchema,
    endTime: timeOnlySchema,
    reason: optionalText(200),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'O horário final deve ser depois do inicial',
    path: ['endTime'],
  });

export const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(120),
  slug: slugSchema,
  summary: optionalText(400),
  description: optionalText(4000),
  durationMinutes: z.coerce.number().int().min(10, 'Mínimo de 10 minutos').max(600),
  priceCents: z.coerce.number().int().min(0).optional(),
  showPricePublicly: z.boolean().default(false),
  allowsOnlineBooking: z.boolean().default(true),
  requiresPayment: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().trim().url('URL inválida').optional().or(z.literal('').transform(() => undefined)),
  preparationNotes: optionalText(1000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const availabilityRuleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: timeOnlySchema,
    endTime: timeOnlySchema,
    slotIntervalMinutes: z.coerce.number().int().min(5).max(240),
    breakStartTime: timeOnlySchema.optional().or(z.literal('').transform(() => undefined)),
    breakEndTime: timeOnlySchema.optional().or(z.literal('').transform(() => undefined)),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'O fim deve ser depois do início',
    path: ['endTime'],
  })
  .refine(
    (data) =>
      (!data.breakStartTime && !data.breakEndTime) ||
      (Boolean(data.breakStartTime) && Boolean(data.breakEndTime) && data.breakEndTime! > data.breakStartTime!),
    { message: 'Intervalo inválido', path: ['breakEndTime'] },
  );

export const availabilityExceptionSchema = z
  .object({
    exceptionDate: dateOnlySchema,
    isAvailable: z.boolean().default(false),
    startTime: timeOnlySchema.optional().or(z.literal('').transform(() => undefined)),
    endTime: timeOnlySchema.optional().or(z.literal('').transform(() => undefined)),
    reason: optionalText(200),
  })
  .refine((data) => !data.isAvailable || (data.startTime && data.endTime), {
    message: 'Informe início e fim do horário especial',
    path: ['startTime'],
  });

export const paymentSchema = z.object({
  patientId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  appointmentId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  description: z.string().trim().min(2, 'Informe a descrição').max(300),
  amountCents: z.coerce.number().int().min(0, 'Valor inválido'),
  status: z.enum([
    'pending',
    'approved',
    'authorized',
    'in_process',
    'rejected',
    'cancelled',
    'refunded',
    'charged_back',
  ]),
  method: z
    .enum([
      'mercadopago',
      'pix',
      'credit_card',
      'debit_card',
      'cash',
      'bank_transfer',
      'health_insurance',
      'other',
    ])
    .optional()
    .or(z.literal('').transform(() => undefined)),
  dueDate: dateOnlySchema.optional().or(z.literal('').transform(() => undefined)),
});

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, 'Informe o título').max(200),
  slug: slugSchema,
  excerpt: optionalText(400),
  content: z.string().trim().min(20, 'O conteúdo está muito curto'),
  coverUrl: z.string().trim().url('URL inválida').optional().or(z.literal('').transform(() => undefined)),
  coverAlt: optionalText(200),
  categoryId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  scheduledFor: z.string().optional().or(z.literal('').transform(() => undefined)),
  seoTitle: optionalText(70),
  seoDescription: optionalText(320),
  tags: z.string().optional().transform((value) =>
    value
      ? value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [],
  ),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  type: z.enum(['infobook', 'landing_page', 'material', 'service', 'other']),
  summary: optionalText(400),
  description: optionalText(4000),
  priceCents: z.coerce.number().int().min(0),
  isFree: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  coverUrl: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
  externalUrl: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
  audience: optionalText(300),
  benefits: z.string().optional().transform((value) =>
    value
      ? value
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [],
  ),
});

export const settingsSchema = z.object({
  identity: z.object({
    brand_name: z.string().trim().min(2).max(120),
    professional_name: z.string().trim().min(2).max(120),
    positioning: z.string().trim().min(2).max(120),
    headline: z.string().trim().min(5).max(240),
    subheadline: z.string().trim().max(600),
    professional_registration_label: z.string().trim().max(60),
    professional_registration_value: z.string().trim().max(60),
    short_bio: z.string().trim().max(2000),
    photo_url: z.string().trim().max(500),
  }),
  contact: z.object({
    whatsapp: z.string().trim().max(20),
    phone: z.string().trim().max(20),
    email: z.string().trim().max(160),
    instagram: z.string().trim().max(160),
    address_line: z.string().trim().max(200),
    city: z.string().trim().max(80),
    state: z.string().trim().max(2),
    service_area: z.string().trim().max(120),
    office_hours_label: z.string().trim().max(160),
  }),
  booking: z.object({
    timezone: z.string().trim().min(3).max(60),
    min_lead_hours: z.coerce.number().min(0).max(720),
    max_advance_days: z.coerce.number().min(1).max(365),
    default_slot_interval_minutes: z.coerce.number().min(5).max(240),
    auto_confirm: z.boolean(),
    show_prices_publicly: z.boolean(),
    require_consent: z.boolean(),
    consent_version: z.string().trim().max(10),
  }),
  seo: z.object({
    site_name: z.string().trim().min(2).max(120),
    default_title: z.string().trim().min(5).max(70),
    default_description: z.string().trim().min(10).max(320),
    default_keywords: z.string().trim().max(300),
  }),
  features: z.object({
    show_testimonials: z.boolean(),
    enable_online_payments: z.boolean(),
    enable_pdf_online: z.boolean(),
    enable_blog: z.boolean(),
    enable_store: z.boolean(),
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(200),
});

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Use ao menos 10 caracteres')
      .max(200)
      .regex(/[a-z]/, 'Inclua uma letra minúscula')
      .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
      .regex(/\d/, 'Inclua um número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

/** Extrai o primeiro erro de cada campo em formato pronto para a UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
