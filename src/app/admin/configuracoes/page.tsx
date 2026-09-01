import { CheckCircle2, XCircle } from 'lucide-react';
import { Alert, Badge, Card, FormField, fieldAria, inputClasses } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { ActionForm } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { getSiteSettings } from '@/lib/data/public';
import { saveSettings } from '@/app/admin/_actions/settings';
import { integrationStatus } from '@/lib/env';
import { getProductionReadiness } from '@/lib/settings/readiness';
import { cn } from '@/lib/utils/cn';

/** Tudo o que é configurável sem tocar em código. */
export default async function ConfiguracoesPage() {
  await requirePermission('settings:view', '/admin/configuracoes');
  const settings = await getSiteSettings();
  const integrations = integrationStatus();
  const readiness = getProductionReadiness(settings);

  const field = (name: string) => `configuracoes-${name.replace(/\./g, '-')}`;
  const pendingItems = readiness.items.filter((item) => item.status !== 'ok');

  return (
    <>
      <AdminPageHeader
        title="Configurações"
        description="Identidade, contato, regras de agendamento, SEO e módulos do site. As alterações refletem no site público imediatamente."
      />

      {pendingItems.length > 0 ? (
        <Alert
          tone={readiness.blockedCount > 0 ? 'warning' : 'info'}
          title={
            readiness.blockedCount > 0
              ? 'Configuração pendente — go-live bloqueado'
              : 'Configuração pendente — dados reais ainda faltam'
          }
          className="mb-6"
        >
          <p className="mb-3 text-sm">
            O site nunca inventa registro, bio, foto ou credenciais. Itens abaixo precisam ser
            preenchidos por você (ou com variáveis de ambiente no provedor de hospedagem).
          </p>
          <ul className="space-y-1.5 text-sm">
            {pendingItems.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-2">
                <Badge tone={item.status === 'blocked' ? 'warning' : 'neutral'}>
                  {item.status === 'blocked' ? 'bloqueado' : 'pendente'}
                </Badge>
                <span>{item.label}</span>
                {item.hint ? <span className="text-ink-faint">— {item.hint}</span> : null}
              </li>
            ))}
          </ul>
        </Alert>
      ) : (
        <Alert tone="success" title="Configuração completa" className="mb-6">
          Integrações e dados profissionais mínimos estão preenchidos.
        </Alert>
      )}

      <Alert tone="info" title="Sobre informações profissionais" className="mb-6">
        Registro profissional, biografia, formação, especializações e foto aparecem no site{' '}
        <strong>somente</strong> se forem preenchidos aqui. O sistema nunca gera, presume ou
        completa esse tipo de informação.
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ActionForm
          action={saveSettings}
          submitLabel="Salvar configurações"
          pendingLabel="Salvando…"
          className="space-y-6"
        >
            <>
              <Card>
                <h2 className="font-display text-lg text-ink">Identidade</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <FormField label="Nome da marca" htmlFor={field('identity.brand_name')} required>
                    <input
                      {...fieldAria(field('identity.brand_name'), {})}
                      type="text"
                      name="identity.brand_name"
                      defaultValue={settings.identity.brand_name}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Nome da profissional"
                    htmlFor={field('identity.professional_name')}
                    required
                  >
                    <input
                      {...fieldAria(field('identity.professional_name'), {})}
                      type="text"
                      name="identity.professional_name"
                      defaultValue={settings.identity.professional_name}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField label="Posicionamento" htmlFor={field('identity.positioning')} required>
                    <input
                      {...fieldAria(field('identity.positioning'), {})}
                      type="text"
                      name="identity.positioning"
                      defaultValue={settings.identity.positioning}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Foto (URL)"
                    htmlFor={field('identity.photo_url')}
                    hint="Bucket public-assets do Supabase Storage"
                  >
                    <input
                      {...fieldAria(field('identity.photo_url'), { hint: true })}
                      type="text"
                      name="identity.photo_url"
                      defaultValue={settings.identity.photo_url}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Logo (URL)"
                    htmlFor={field('identity.logo_url')}
                    hint="Opcional. Sem logo, o header usa o nome tipográfico."
                  >
                    <input
                      {...fieldAria(field('identity.logo_url'), { hint: true })}
                      type="text"
                      name="identity.logo_url"
                      defaultValue={settings.identity.logo_url}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Título da Home"
                    htmlFor={field('identity.headline')}
                    required
                    className="sm:col-span-2"
                  >
                    <input
                      {...fieldAria(field('identity.headline'), {})}
                      type="text"
                      name="identity.headline"
                      defaultValue={settings.identity.headline}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Subtítulo da Home"
                    htmlFor={field('identity.subheadline')}
                    className="sm:col-span-2"
                  >
                    <textarea
                      {...fieldAria(field('identity.subheadline'), {})}
                      name="identity.subheadline"
                      rows={3}
                      defaultValue={settings.identity.subheadline}
                      className={cn(inputClasses, 'resize-y')}
                    />
                  </FormField>

                  <FormField
                    label="Rótulo do registro profissional"
                    htmlFor={field('identity.professional_registration_label')}
                    hint="Ex.: CRP. Deixe vazio para não exibir."
                  >
                    <input
                      {...fieldAria(field('identity.professional_registration_label'), { hint: true })}
                      type="text"
                      name="identity.professional_registration_label"
                      defaultValue={settings.identity.professional_registration_label}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Número do registro"
                    htmlFor={field('identity.professional_registration_value')}
                    hint="Informe apenas o número real e verificável."
                  >
                    <input
                      {...fieldAria(field('identity.professional_registration_value'), { hint: true })}
                      type="text"
                      name="identity.professional_registration_value"
                      defaultValue={settings.identity.professional_registration_value}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Apresentação (bio)"
                    htmlFor={field('identity.short_bio')}
                    hint="Aparece em Sobre e na assinatura dos artigos. Use parágrafos separados por linha em branco."
                    className="sm:col-span-2"
                  >
                    <textarea
                      {...fieldAria(field('identity.short_bio'), { hint: true })}
                      name="identity.short_bio"
                      rows={6}
                      defaultValue={settings.identity.short_bio}
                      className={cn(inputClasses, 'resize-y')}
                    />
                  </FormField>

                  <FormField
                    label="Formação"
                    htmlFor={field('identity.formation')}
                    hint="Ex.: graduação, pós, cursos relevantes. Vazio = não exibir."
                    className="sm:col-span-2"
                  >
                    <textarea
                      {...fieldAria(field('identity.formation'), { hint: true })}
                      name="identity.formation"
                      rows={4}
                      defaultValue={settings.identity.formation}
                      className={cn(inputClasses, 'resize-y')}
                    />
                  </FormField>

                  <FormField
                    label="Especializações"
                    htmlFor={field('identity.specializations')}
                    hint="Uma especialização por linha. Vazio = não exibir."
                    className="sm:col-span-2"
                  >
                    <textarea
                      {...fieldAria(field('identity.specializations'), { hint: true })}
                      name="identity.specializations"
                      rows={4}
                      defaultValue={settings.identity.specializations}
                      className={cn(inputClasses, 'resize-y')}
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <h2 className="font-display text-lg text-ink">Contato</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="WhatsApp"
                    htmlFor={field('contact.whatsapp')}
                    hint="Com código do país, só números (ex.: 5511999999999)"
                  >
                    <input
                      {...fieldAria(field('contact.whatsapp'), { hint: true })}
                      type="text"
                      name="contact.whatsapp"
                      defaultValue={settings.contact.whatsapp}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField label="Telefone" htmlFor={field('contact.phone')}>
                    <input
                      {...fieldAria(field('contact.phone'), {})}
                      type="text"
                      name="contact.phone"
                      defaultValue={settings.contact.phone}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField label="E-mail" htmlFor={field('contact.email')}>
                    <input
                      {...fieldAria(field('contact.email'), {})}
                      type="email"
                      name="contact.email"
                      defaultValue={settings.contact.email}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Instagram"
                    htmlFor={field('contact.instagram')}
                    hint="@usuario ou URL completa"
                  >
                    <input
                      {...fieldAria(field('contact.instagram'), { hint: true })}
                      type="text"
                      name="contact.instagram"
                      defaultValue={settings.contact.instagram}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Endereço"
                    htmlFor={field('contact.address_line')}
                    className="sm:col-span-2"
                  >
                    <input
                      {...fieldAria(field('contact.address_line'), {})}
                      type="text"
                      name="contact.address_line"
                      defaultValue={settings.contact.address_line}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField label="Cidade" htmlFor={field('contact.city')}>
                    <input
                      {...fieldAria(field('contact.city'), {})}
                      type="text"
                      name="contact.city"
                      defaultValue={settings.contact.city}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField label="UF" htmlFor={field('contact.state')}>
                    <input
                      {...fieldAria(field('contact.state'), {})}
                      type="text"
                      name="contact.state"
                      maxLength={2}
                      defaultValue={settings.contact.state}
                      className={cn(inputClasses, 'uppercase')}
                    />
                  </FormField>

                  <FormField
                    label="Modalidade de atendimento"
                    htmlFor={field('contact.service_area')}
                  >
                    <input
                      {...fieldAria(field('contact.service_area'), {})}
                      type="text"
                      name="contact.service_area"
                      defaultValue={settings.contact.service_area}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Horário de atendimento (texto)"
                    htmlFor={field('contact.office_hours_label')}
                  >
                    <input
                      {...fieldAria(field('contact.office_hours_label'), {})}
                      type="text"
                      name="contact.office_hours_label"
                      defaultValue={settings.contact.office_hours_label}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Link do mapa"
                    htmlFor={field('contact.map_url')}
                    hint="URL do Google Maps ou similar. Vazio = não exibir botão no Contato."
                    className="sm:col-span-2"
                  >
                    <input
                      {...fieldAria(field('contact.map_url'), { hint: true })}
                      type="url"
                      name="contact.map_url"
                      defaultValue={settings.contact.map_url}
                      className={inputClasses}
                      placeholder="https://maps.google.com/…"
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <h2 className="font-display text-lg text-ink">Agendamento</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <FormField label="Fuso horário" htmlFor={field('booking.timezone')} required>
                    <input
                      {...fieldAria(field('booking.timezone'), {})}
                      type="text"
                      name="booking.timezone"
                      defaultValue={settings.booking.timezone}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Versão do termo de consentimento"
                    htmlFor={field('booking.consent_version')}
                    hint="Altere ao mudar a política de privacidade"
                  >
                    <input
                      {...fieldAria(field('booking.consent_version'), { hint: true })}
                      type="text"
                      name="booking.consent_version"
                      defaultValue={settings.booking.consent_version}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Antecedência mínima (horas)"
                    htmlFor={field('booking.min_lead_hours')}
                    required
                  >
                    <input
                      {...fieldAria(field('booking.min_lead_hours'), {})}
                      type="number"
                      name="booking.min_lead_hours"
                      min={0}
                      max={720}
                      defaultValue={settings.booking.min_lead_hours}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Antecedência máxima (dias)"
                    htmlFor={field('booking.max_advance_days')}
                    required
                  >
                    <input
                      {...fieldAria(field('booking.max_advance_days'), {})}
                      type="number"
                      name="booking.max_advance_days"
                      min={1}
                      max={365}
                      defaultValue={settings.booking.max_advance_days}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Intervalo padrão entre horários (min)"
                    htmlFor={field('booking.default_slot_interval_minutes')}
                    required
                  >
                    <input
                      {...fieldAria(field('booking.default_slot_interval_minutes'), {})}
                      type="number"
                      name="booking.default_slot_interval_minutes"
                      min={5}
                      max={240}
                      step={5}
                      defaultValue={settings.booking.default_slot_interval_minutes}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <div className="space-y-3 sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-soft">
                      <input
                        type="checkbox"
                        name="booking.show_prices_publicly"
                        defaultChecked={settings.booking.show_prices_publicly}
                        className="mt-0.5 h-4 w-4 accent-petrol-700"
                      />
                      <span>
                        Exibir valores no site público
                        <span className="mt-0.5 block text-xs text-ink-faint">
                          Cada serviço também precisa estar marcado como &quot;exibir valor&quot;.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-soft">
                      <input
                        type="checkbox"
                        name="booking.auto_confirm"
                        defaultChecked={settings.booking.auto_confirm}
                        className="mt-0.5 h-4 w-4 accent-petrol-700"
                      />
                      <span>
                        Confirmar solicitações automaticamente
                        <span className="mt-0.5 block text-xs text-ink-faint">
                          Sem marcar, toda solicitação entra como &quot;aguardando confirmação&quot;.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="font-display text-lg text-ink">SEO</h2>
                <div className="mt-5 grid gap-4">
                  <FormField label="Nome do site" htmlFor={field('seo.site_name')} required>
                    <input
                      {...fieldAria(field('seo.site_name'), {})}
                      type="text"
                      name="seo.site_name"
                      defaultValue={settings.seo.site_name}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Título padrão"
                    htmlFor={field('seo.default_title')}
                    required
                    hint="Até 60 caracteres"
                  >
                    <input
                      {...fieldAria(field('seo.default_title'), {
                        hint: true,
                      })}
                      type="text"
                      name="seo.default_title"
                      maxLength={70}
                      defaultValue={settings.seo.default_title}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Descrição padrão"
                    htmlFor={field('seo.default_description')}
                    required
                    hint="Até 160 caracteres é o ideal"
                  >
                    <textarea
                      {...fieldAria(field('seo.default_description'), { hint: true })}
                      name="seo.default_description"
                      rows={3}
                      maxLength={320}
                      defaultValue={settings.seo.default_description}
                      className={cn(inputClasses, 'resize-y')}
                      required
                    />
                  </FormField>

                  <FormField
                    label="Palavras-chave"
                    htmlFor={field('seo.default_keywords')}
                    hint="Separadas por vírgula"
                  >
                    <input
                      {...fieldAria(field('seo.default_keywords'), { hint: true })}
                      type="text"
                      name="seo.default_keywords"
                      defaultValue={settings.seo.default_keywords}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Imagem Open Graph (URL)"
                    htmlFor={field('seo.default_og_image')}
                    hint="Usada no compartilhamento padrão. Preferir 1200×630."
                    className="sm:col-span-2"
                  >
                    <input
                      {...fieldAria(field('seo.default_og_image'), { hint: true })}
                      type="text"
                      name="seo.default_og_image"
                      defaultValue={settings.seo.default_og_image}
                      className={inputClasses}
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <h2 className="font-display text-lg text-ink">Módulos do site</h2>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Desligar um módulo esconde a seção correspondente no site público.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      name: 'features.enable_blog',
                      label: 'Blog',
                      checked: settings.features.enable_blog,
                    },
                    {
                      name: 'features.enable_store',
                      label: 'Loja (infobooks, materiais e landing pages)',
                      checked: settings.features.enable_store,
                    },
                    {
                      name: 'features.enable_pdf_online',
                      label: 'PDF Online (somente painel interno — não entra no site público)',
                      checked: settings.features.enable_pdf_online,
                    },
                    {
                      name: 'features.show_testimonials',
                      label: 'Seção de depoimentos (só aparece com depoimento real publicado)',
                      checked: settings.features.show_testimonials,
                    },
                    {
                      name: 'features.enable_online_payments',
                      label: 'Pagamento online (requer credenciais do Mercado Pago)',
                      checked: settings.features.enable_online_payments,
                    },
                  ].map((item) => (
                    <label
                      key={item.name}
                      className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-soft"
                    >
                      <input
                        type="checkbox"
                        name={item.name}
                        defaultChecked={item.checked}
                        className="h-4 w-4 accent-petrol-700"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </Card>
            </>
        </ActionForm>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-display text-base text-ink">Integrações</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Credenciais vivem apenas em variáveis de ambiente. O painel mostra somente se estão
              presentes — nunca os valores.
            </p>

            <ul className="mt-4 space-y-4">
              {integrations.map((integration) => (
                <li key={integration.id}>
                  <div className="flex items-start gap-2.5">
                    {integration.configured ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      />
                    ) : (
                      <XCircle
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          integration.required ? 'text-red-500' : 'text-ink-faint',
                        )}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{integration.label}</p>
                      <p className="mt-0.5 break-words font-mono text-[0.6875rem] text-ink-faint">
                        {integration.variables.join(', ')}
                      </p>
                      {!integration.configured ? (
                        <Badge tone={integration.required ? 'danger' : 'neutral'} className="mt-1.5">
                          {integration.required ? 'obrigatória' : 'opcional'}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-surface-muted">
            <h2 className="font-display text-base text-ink">Onde ficam as credenciais</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Em desenvolvimento: arquivo <code>.env.local</code> (nunca versionado). Em produção:
              painel de variáveis de ambiente do provedor de hospedagem. Consulte{' '}
              <code>.env.example</code> e o README para a lista completa.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
