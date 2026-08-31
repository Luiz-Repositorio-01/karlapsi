import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { computeAvailability, formatDateKey } from '@/lib/domain/availability';
import { getSiteSettings } from '@/lib/data/public';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/utils/labels';
import type {
  AppointmentRequest,
  AppointmentWithRelations,
  AuditLog,
  AvailabilityException,
  AvailabilityRule,
  BlockedTime,
  BlogCategory,
  BlogPost,
  ContactMessage,
  DashboardMetrics,
  DocumentRecord,
  Infobook,
  LandingPage,
  NotificationRecord,
  Order,
  Patient,
  PaymentWithRelations,
  Product,
  Profile,
  Service,
  SitePage,
  Testimonial,
} from '@/lib/types';

/**
 * Leituras do painel administrativo.
 *
 * Todas usam o cliente de sessão: o Postgres aplica RLS conforme o papel do
 * usuário autenticado. Uma função como `listPayments()` chamada por um
 * ASSISTANT retorna vazio porque a policy nega — a interface esconde o menu,
 * e o banco garante.
 */

export interface AdminResult<T> {
  data: T;
  /** Supabase indisponível/não configurado — a UI mostra estado explícito. */
  unavailable: boolean;
  error?: string;
}

async function adminQuery<T>(
  run: (client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) => Promise<T>,
  fallback: T,
): Promise<AdminResult<T>> {
  const client = await createSupabaseServerClient();
  if (!client) return { data: fallback, unavailable: true };

  try {
    return { data: await run(client), unavailable: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[data/admin] consulta falhou:', message);
    return { data: fallback, unavailable: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------------
export async function getDashboardMetrics(): Promise<AdminResult<DashboardMetrics | null>> {
  return adminQuery(async (client) => {
    const { data, error } = await client.rpc('dashboard_metrics');
    if (error) throw error;
    return (data as DashboardMetrics) ?? null;
  }, null);
}

// -----------------------------------------------------------------------------
// Agenda
// -----------------------------------------------------------------------------
const APPOINTMENT_SELECT =
  '*, patient:patients(id, full_name, phone, email), service:services(id, name, slug, duration_minutes)';

export async function listAppointments(options: {
  from: string;
  to: string;
  status?: string[];
}): Promise<AdminResult<AppointmentWithRelations[]>> {
  return adminQuery(async (client) => {
    let builder = client
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .gte('starts_at', options.from)
      .lte('starts_at', options.to)
      .order('starts_at', { ascending: true });

    if (options.status && options.status.length > 0) {
      builder = builder.in('status', options.status);
    }

    const { data, error } = await builder;
    if (error) throw error;
    return (data ?? []) as AppointmentWithRelations[];
  }, []);
}

export async function getAppointment(
  id: string,
): Promise<AdminResult<AppointmentWithRelations | null>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as AppointmentWithRelations | null) ?? null;
  }, null);
}

export async function listUpcomingAppointments(
  limit = 8,
): Promise<AdminResult<AppointmentWithRelations[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .gte('starts_at', new Date().toISOString())
      .in('status', ACTIVE_APPOINTMENT_STATUSES)
      .order('starts_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AppointmentWithRelations[];
  }, []);
}

export async function listPendingRequests(
  limit = 20,
): Promise<AdminResult<AppointmentWithRelations[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .eq('status', 'requested')
      .order('starts_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AppointmentWithRelations[];
  }, []);
}

export async function listBlockedTimes(options: {
  from: string;
  to: string;
}): Promise<AdminResult<BlockedTime[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('blocked_times')
      .select('id, starts_at, ends_at, reason')
      .gte('starts_at', options.from)
      .lte('starts_at', options.to)
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as BlockedTime[];
  }, []);
}

export async function listAppointmentRequests(
  limit = 30,
): Promise<AdminResult<AppointmentRequest[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('appointment_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AppointmentRequest[];
  }, []);
}

/** Horários livres para o painel (mesmo algoritmo do site público). */
export async function getAdminAvailability(options: {
  serviceId?: string | null;
  durationMinutes: number;
  fromDate: string;
  days: number;
}) {
  const settings = await getSiteSettings();
  const client = await createSupabaseServerClient();
  if (!client) return { days: [], timezone: settings.booking.timezone };

  const rangeStart = new Date(`${options.fromDate}T00:00:00.000Z`);
  const rangeEnd = new Date(rangeStart.getTime() + (options.days + 2) * 86_400_000);

  const [rules, exceptions, appointments, blocks] = await Promise.all([
    client.from('availability_rules').select('*').eq('is_active', true),
    client
      .from('availability_exceptions')
      .select('*')
      .gte('exception_date', options.fromDate)
      .lte('exception_date', formatDateKey(rangeEnd, settings.booking.timezone)),
    client
      .from('appointments')
      .select('starts_at, ends_at')
      .in('status', ACTIVE_APPOINTMENT_STATUSES)
      .gte('starts_at', rangeStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString()),
    client
      .from('blocked_times')
      .select('starts_at, ends_at')
      .gte('starts_at', rangeStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString()),
  ]);

  const busy = [
    ...((appointments.data ?? []) as { starts_at: string; ends_at: string }[]),
    ...((blocks.data ?? []) as { starts_at: string; ends_at: string }[]),
  ];

  return {
    timezone: settings.booking.timezone,
    days: computeAvailability({
      rules: (rules.data ?? []) as AvailabilityRule[],
      exceptions: (exceptions.data ?? []) as AvailabilityException[],
      busy,
      durationMinutes: options.durationMinutes,
      timezone: settings.booking.timezone,
      fromDate: options.fromDate,
      days: options.days,
      // No painel a equipe pode marcar para hoje mesmo.
      minLeadHours: 0,
      now: new Date(),
      serviceId: options.serviceId ?? null,
    }),
  };
}

// -----------------------------------------------------------------------------
// Pacientes
// -----------------------------------------------------------------------------
export async function listPatients(options: {
  search?: string;
  includeArchived?: boolean;
  orderBy?: 'name' | 'recent';
  limit?: number;
}): Promise<AdminResult<Patient[]>> {
  return adminQuery(async (client) => {
    let builder = client.from('patients').select('*');

    if (!options.includeArchived) builder = builder.is('archived_at', null);

    if (options.search && options.search.trim().length > 1) {
      const term = options.search.trim().replace(/[%,]/g, '');
      const digits = term.replace(/\D/g, '');
      const filters = [
        `full_name.ilike.%${term}%`,
        `social_name.ilike.%${term}%`,
        `email.ilike.%${term}%`,
      ];
      if (digits.length >= 4) {
        filters.push(`phone.ilike.%${digits}%`, `cpf.ilike.%${digits}%`);
      }
      builder = builder.or(filters.join(','));
    }

    builder =
      options.orderBy === 'recent'
        ? builder.order('created_at', { ascending: false })
        : builder.order('full_name', { ascending: true });

    const { data, error } = await builder.limit(options.limit ?? 100);
    if (error) throw error;
    return (data ?? []) as Patient[];
  }, []);
}

export async function getPatient(id: string): Promise<AdminResult<Patient | null>> {
  return adminQuery(async (client) => {
    const { data, error } = await client.from('patients').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as Patient | null) ?? null;
  }, null);
}

export async function getPatientTimeline(patientId: string) {
  const client = await createSupabaseServerClient();
  if (!client) {
    return { appointments: [], payments: [], documents: [], history: [] };
  }

  const [appointments, payments, documents, history] = await Promise.all([
    client
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .eq('patient_id', patientId)
      .order('starts_at', { ascending: false })
      .limit(50),
    client
      .from('payments')
      .select('*, patient:patients(id, full_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(50),
    client
      .from('documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(50),
    client
      .from('audit_logs')
      .select('id, actor_email, actor_role, action, entity, entity_id, changed_fields, created_at')
      .eq('entity', 'patients')
      .eq('entity_id', patientId)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  return {
    appointments: (appointments.data ?? []) as AppointmentWithRelations[],
    payments: (payments.data ?? []) as PaymentWithRelations[],
    documents: (documents.data ?? []) as DocumentRecord[],
    history: (history.data ?? []) as AuditLog[],
  };
}

// -----------------------------------------------------------------------------
// Serviços e disponibilidade
// -----------------------------------------------------------------------------
export async function listAllServices(): Promise<AdminResult<Service[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Service[];
  }, []);
}

export async function listAvailabilityRules(): Promise<AdminResult<AvailabilityRule[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('availability_rules')
      .select('*')
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data ?? []) as AvailabilityRule[];
  }, []);
}

export async function listAvailabilityExceptions(): Promise<AdminResult<AvailabilityException[]>> {
  return adminQuery(async (client) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await client
      .from('availability_exceptions')
      .select('*')
      .gte('exception_date', today)
      .order('exception_date', { ascending: true });
    if (error) throw error;
    return (data ?? []) as AvailabilityException[];
  }, []);
}

// -----------------------------------------------------------------------------
// Financeiro
// -----------------------------------------------------------------------------
export async function listPayments(options: {
  status?: string[];
  limit?: number;
}): Promise<AdminResult<PaymentWithRelations[]>> {
  return adminQuery(async (client) => {
    let builder = client
      .from('payments')
      .select('*, patient:patients(id, full_name)')
      .order('created_at', { ascending: false });

    if (options.status && options.status.length > 0) {
      builder = builder.in('status', options.status);
    }

    const { data, error } = await builder.limit(options.limit ?? 100);
    if (error) throw error;
    return (data ?? []) as PaymentWithRelations[];
  }, []);
}

export async function listOrders(limit = 50): Promise<AdminResult<Order[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Order[];
  }, []);
}

// -----------------------------------------------------------------------------
// Conteúdo
// -----------------------------------------------------------------------------
export async function listAllPosts(): Promise<AdminResult<BlogPost[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  }, []);
}

export async function getPost(id: string): Promise<AdminResult<BlogPost | null>> {
  return adminQuery(async (client) => {
    const { data, error } = await client.from('blog_posts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as BlogPost | null) ?? null;
  }, null);
}

export async function listAllCategories(): Promise<AdminResult<BlogCategory[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as BlogCategory[];
  }, []);
}

export async function listAllProducts(): Promise<AdminResult<Product[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Product[];
  }, []);
}

export async function listAllInfobooks(): Promise<AdminResult<Infobook[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('infobooks')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Infobook[];
  }, []);
}

export async function listAllLandingPages(): Promise<AdminResult<LandingPage[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('landing_pages')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as LandingPage[];
  }, []);
}

export async function listTestimonials(): Promise<AdminResult<Testimonial[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('testimonials')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Testimonial[];
  }, []);
}

export async function listSitePages(): Promise<AdminResult<SitePage[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client.from('site_pages').select('*').order('slug');
    if (error) throw error;
    return (data ?? []) as SitePage[];
  }, []);
}

// -----------------------------------------------------------------------------
// Documentos, notificações, contatos, usuários e auditoria
// -----------------------------------------------------------------------------
export async function listDocuments(limit = 60): Promise<AdminResult<DocumentRecord[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as DocumentRecord[];
  }, []);
}

export async function listNotifications(limit = 60): Promise<AdminResult<NotificationRecord[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as NotificationRecord[];
  }, []);
}

export async function countUnreadNotifications(): Promise<number> {
  const client = await createSupabaseServerClient();
  if (!client) return 0;

  const { count } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('channel', 'internal')
    .is('read_at', null);

  return count ?? 0;
}

export async function listContactMessages(limit = 40): Promise<AdminResult<ContactMessage[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ContactMessage[];
  }, []);
}

export async function listProfiles(): Promise<AdminResult<Profile[]>> {
  return adminQuery(async (client) => {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Profile[];
  }, []);
}

export async function listAuditLogs(options: {
  entity?: string;
  limit?: number;
}): Promise<AdminResult<AuditLog[]>> {
  return adminQuery(async (client) => {
    let builder = client
      .from('audit_logs')
      .select('id, actor_email, actor_role, action, entity, entity_id, changed_fields, created_at')
      .order('created_at', { ascending: false });

    if (options.entity) builder = builder.eq('entity', options.entity);

    const { data, error } = await builder.limit(options.limit ?? 100);
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  }, []);
}

export async function getSettingsForAdmin(): Promise<
  AdminResult<Record<string, Record<string, unknown>>>
> {
  return adminQuery(async (client) => {
    const { data, error } = await client.from('site_settings').select('key, value');
    if (error) throw error;
    const rows = (data ?? []) as { key: string; value: Record<string, unknown> }[];
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }, {});
}
