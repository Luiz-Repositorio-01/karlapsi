/**
 * Tipos de domínio espelhando o schema em `supabase/migrations`.
 *
 * A tipagem gerada pelo Supabase CLI (`supabase gen types typescript`) pode
 * substituir este arquivo quando o projeto estiver conectado; até então estes
 * tipos são a fonte de verdade da aplicação e a conversão acontece somente na
 * camada de dados (`src/lib/data`).
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'ASSISTANT' | 'PROFESSIONAL';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'awaiting_payment'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type AppointmentOrigin = 'public_site' | 'admin' | 'whatsapp' | 'phone' | 'import' | 'other';

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

export type PaymentMethod =
  | 'mercadopago'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'bank_transfer'
  | 'health_insurance'
  | 'other';

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'fulfilled';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type ProductType = 'infobook' | 'landing_page' | 'material' | 'service' | 'other';

export type RequestStatus = 'new' | 'in_review' | 'accepted' | 'declined' | 'archived';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  is_active: boolean;
  is_public_author: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  duration_minutes: number;
  price_cents: number | null;
  currency: string;
  show_price_publicly: boolean;
  allows_online_booking: boolean;
  requires_payment: boolean;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
  preparation_notes: string | null;
  sort_order: number;
}

export interface AvailabilityRule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
  break_start_time: string | null;
  break_end_time: string | null;
  service_id: string | null;
  professional_id: string | null;
  is_active: boolean;
}

export interface AvailabilityException {
  id: string;
  exception_date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  slot_interval_minutes: number | null;
  reason: string | null;
}

export interface Patient {
  id: string;
  full_name: string;
  social_name: string | null;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relationship: string | null;
  referral_source: string | null;
  admin_notes: string | null;
  tags: string[];
  is_demo: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string | null;
  service_id: string | null;
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  origin: AppointmentOrigin;
  price_cents: number | null;
  payment_method: PaymentMethod | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  patient_notes: string | null;
  admin_notes: string | null;
  cancellation_reason: string | null;
  rescheduled_from: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithRelations extends Appointment {
  patient: Pick<Patient, 'id' | 'full_name' | 'phone' | 'email'> | null;
  service: Pick<Service, 'id' | 'name' | 'slug' | 'duration_minutes'> | null;
}

export interface BlockedTime {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface Payment {
  id: string;
  patient_id: string | null;
  appointment_id: string | null;
  order_id: string | null;
  service_id: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  due_date: string | null;
  paid_at: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  provider_status: string | null;
  provider_preference_id: string | null;
  checkout_url: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface PaymentWithRelations extends Payment {
  patient: Pick<Patient, 'id' | 'full_name'> | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  summary: string | null;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  is_free: boolean;
  is_active: boolean;
  is_featured: boolean;
  cover_url: string | null;
  file_path: string | null;
  preview_url: string | null;
  external_url: string | null;
  benefits: string[];
  audience: string | null;
  sort_order: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  total_cents: number;
  currency: string;
  external_reference: string | null;
  created_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  cover_alt: string | null;
  category_id: string | null;
  author_id: string | null;
  status: ContentStatus;
  published_at: string | null;
  scheduled_for: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  reading_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithRelations extends BlogPost {
  category: BlogCategory | null;
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'bio' | 'specialty'> | null;
}

export interface Infobook {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  product_id: string | null;
  is_free: boolean;
  price_cents: number | null;
  file_path: string | null;
  public_file_url: string | null;
  preview_url: string | null;
  legacy_path: string | null;
  pages: number | null;
  status: ContentStatus;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface LandingPage {
  id: string;
  name: string;
  slug: string;
  headline: string | null;
  description: string | null;
  benefits: string[];
  audience: string | null;
  cover_url: string | null;
  price_cents: number | null;
  cta_label: string | null;
  cta_url: string | null;
  legacy_path: string | null;
  product_id: string | null;
  status: ContentStatus;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface Testimonial {
  id: string;
  author_display_name: string;
  author_context: string | null;
  content: string;
  is_published: boolean;
  sort_order: number;
}

export interface SitePageSection {
  id: string;
  heading: string;
  body?: string;
  items?: { title: string; description?: string }[];
}

export interface SitePage {
  slug: string;
  title: string;
  subtitle: string | null;
  sections: SitePageSection[];
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
}

export interface AppointmentRequest {
  id: string;
  appointment_id: string | null;
  service_id: string | null;
  requested_start: string;
  full_name: string;
  email: string;
  phone: string;
  is_for_dependent: boolean;
  dependent_name: string | null;
  message: string | null;
  status: RequestStatus;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: RequestStatus;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  bucket: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: 'private' | 'staff' | 'public';
  patient_id: string | null;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  channel: 'email' | 'whatsapp' | 'push' | 'internal';
  template: string;
  recipient: string | null;
  subject: string | null;
  payload: Record<string, unknown>;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  error: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_email: string | null;
  actor_role: UserRole | null;
  action: string;
  entity: string;
  entity_id: string | null;
  changed_fields: string[] | null;
  created_at: string;
}

export interface DashboardMetrics {
  appointments_today: number;
  upcoming_appointments: number;
  pending_requests: number;
  active_patients: number;
  revenue_month_cents: number | null;
  pending_payments_cents: number | null;
  published_posts: number;
  unread_notifications: number;
}

export interface BusyRange {
  starts_at: string;
  ends_at: string;
}

/** Configurações editáveis (site_settings). */
export interface IdentitySettings {
  brand_name: string;
  professional_name: string;
  positioning: string;
  headline: string;
  subheadline: string;
  professional_registration_label: string;
  professional_registration_value: string;
  short_bio: string;
  photo_url: string;
}

export interface ContactSettings {
  whatsapp: string;
  phone: string;
  email: string;
  instagram: string;
  address_line: string;
  city: string;
  state: string;
  service_area: string;
  office_hours_label: string;
}

export interface BookingSettings {
  timezone: string;
  min_lead_hours: number;
  max_advance_days: number;
  default_slot_interval_minutes: number;
  auto_confirm: boolean;
  show_prices_publicly: boolean;
  require_consent: boolean;
  consent_version: string;
}

export interface SeoSettings {
  site_name: string;
  default_title: string;
  default_description: string;
  default_keywords: string;
}

export interface FeatureSettings {
  show_testimonials: boolean;
  enable_online_payments: boolean;
  enable_pdf_online: boolean;
  enable_blog: boolean;
  enable_store: boolean;
}

export interface SiteSettings {
  identity: IdentitySettings;
  contact: ContactSettings;
  booking: BookingSettings;
  seo: SeoSettings;
  features: FeatureSettings;
}
