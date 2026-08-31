import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  FileText,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  EmptyState,
  Pill,
  Section,
  SectionHeader,
} from '@/components/ui';
import { Reveal } from '@/components/ui/interactive';
import {
  CTASection,
  FaqSection,
  HighlightGrid,
  StepList,
} from '@/components/site/sections';
import { BlogCard, InfobookCard, LandingPageCard, ServiceCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  AUDIENCE_ITEMS,
  HOW_IT_WORKS_STEPS,
  PROCESS_HIGHLIGHTS,
} from '@/lib/content/defaults';
import {
  getFaqs,
  getInfobooks,
  getLandingPages,
  getPublishedPosts,
  getServices,
  getSitePage,
  getSiteSettings,
  getTestimonials,
} from '@/lib/data/public';
import { faqSchema, personSchema } from '@/lib/seo/jsonld';
import { whatsappLink } from '@/lib/utils/format';

// ISR: o conteúdo institucional é revalidado a cada 5 minutos.
export const revalidate = 300;

export default async function HomePage() {
  const [settings, services, posts, infobooks, landingPages, faqs, testimonials, neuroPage] =
    await Promise.all([
      getSiteSettings(),
      getServices(),
      getPublishedPosts(3),
      getInfobooks(),
      getLandingPages(),
      getFaqs(),
      getTestimonials(),
      getSitePage('neuropsicologia'),
    ]);

  const { identity, contact, features, booking } = settings;
  const featuredServices = services.filter((service) => service.is_featured).slice(0, 3);
  const homeServices = featuredServices.length > 0 ? featuredServices : services.slice(0, 3);

  const neuroSteps =
    neuroPage?.sections.find((section) => section.id === 'como-funciona')?.items ?? [];

  return (
    <>
      {/* ----------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden surface-warm" aria-labelledby="hero-title">
        <Container className="relative py-16 sm:py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Reveal>
                <Pill>
                  <Brain aria-hidden="true" className="h-3.5 w-3.5 text-petrol-600" />
                  {identity.positioning}
                </Pill>
              </Reveal>

              <Reveal delay={80}>
                <h1 id="hero-title" className="mt-6 text-display-xl">
                  {identity.headline}
                </h1>
              </Reveal>

              <Reveal delay={140}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
                  {identity.subheadline}
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <ButtonLink href="/agendamento" size="lg">
                    <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                    Agendar avaliação
                  </ButtonLink>
                  <ButtonLink href="/neuropsicologia" variant="secondary" size="lg">
                    Conhecer a Neuropsicologia
                  </ButtonLink>
                </div>
              </Reveal>

              <Reveal delay={260}>
                <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-soft">
                  <li className="flex items-center gap-2">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4 text-petrol-500" />
                    Horário reservado e confirmado
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText aria-hidden="true" className="h-4 w-4 text-petrol-500" />
                    Devolutiva com orientações
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles aria-hidden="true" className="h-4 w-4 text-petrol-500" />
                    {contact.service_area}
                  </li>
                </ul>
              </Reveal>
            </div>

            <Reveal delay={160} className="relative">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-surface-sunken shadow-lift ring-1 ring-white/60">
                {identity.photo_url ? (
                  <Image
                    src={identity.photo_url}
                    alt={`Retrato de ${identity.professional_name}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 420px"
                    className="object-cover"
                  />
                ) : (
                  /* Sem foto cadastrada: composição tipográfica em vez de imagem
                     genérica de banco de imagens. */
                  <div className="flex h-full flex-col justify-between bg-gradient-to-br from-petrol-700 to-petrol-900 p-8 text-petrol-50">
                    <Brain aria-hidden="true" className="h-9 w-9 text-petrol-300" />
                    <div>
                      <p className="font-display text-3xl leading-tight text-white">
                        {identity.professional_name}
                      </p>
                      <p className="mt-2 text-sm uppercase tracking-[0.18em] text-petrol-300">
                        {identity.positioning}
                      </p>
                      {identity.professional_registration_value ? (
                        <p className="mt-4 text-sm text-petrol-200">
                          {identity.professional_registration_label || 'Registro'}:{' '}
                          {identity.professional_registration_value}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------- POSICIONAMENTO */}
      <Section tone="default" ariaLabelledBy="posicionamento-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
            <SectionHeader
              id="posicionamento-title"
              eyebrow="Posicionamento"
              title="Um trabalho centrado na compreensão, não no rótulo"
            />
            <div className="article-body max-w-prose">
              <p>
                O foco deste consultório é a <strong>neuropsicologia</strong>: entender como cada
                pessoa presta atenção, memoriza, organiza tarefas, comunica e aprende — e o que
                isso significa na escola, no trabalho e na convivência.
              </p>
              <p>
                A avaliação é um processo com etapas definidas, instrumentos escolhidos caso a caso
                e uma devolutiva que a família consegue usar. Nada de promessa rápida: o que se
                entrega é informação organizada, ética e aplicável.
              </p>
              {identity.short_bio ? <p>{identity.short_bio}</p> : null}
              <p>
                <Link href="/sobre">Conhecer a proposta de trabalho</Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------- NEUROPSICOLOGIA (destaque) */}
      <Section tone="deep" id="neuropsicologia" ariaLabelledBy="neuro-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            <div>
              <SectionHeader
                id="neuro-title"
                tone="dark"
                eyebrow="Foco principal"
                title="Neuropsicologia em destaque"
                description={
                  neuroPage?.subtitle ??
                  'A área que estuda a relação entre funcionamento cerebral, cognição e comportamento.'
                }
              />

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/neuropsicologia" variant="onDark">
                  Entender a neuropsicologia
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href="/avaliacao-neuropsicologica"
                  className="bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/15"
                >
                  Ver a avaliação em detalhe
                </ButtonLink>
              </div>
            </div>

            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-petrol-300">
                Etapas da avaliação
              </p>
              <ol className="mt-5 space-y-3">
                {(neuroSteps.length > 0
                  ? neuroSteps
                  : [
                      { title: '1. Entrevista inicial', description: 'Demanda, histórico e objetivos.' },
                      { title: '2. Testagem', description: 'Sessões com instrumentos padronizados.' },
                      { title: '3. Análise', description: 'Interpretação integrada dos dados.' },
                      { title: '4. Devolutiva', description: 'Resultados e orientações práticas.' },
                    ]
                ).map((item, index) => (
                  <Reveal as="li" key={item.title} delay={index * 60}>
                    <div className="rounded-xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.09]">
                      <p className="font-display text-base text-white">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-petrol-100">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ SERVIÇOS */}
      <Section tone="default" id="servicos" ariaLabelledBy="servicos-title">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              id="servicos-title"
              eyebrow="Serviços"
              title="Como o atendimento acontece"
              description="Cada serviço tem duração definida e horário exclusivo na agenda."
            />
            <ButtonLink href="/servicos" variant="ghost">
              Ver todos os serviços
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ButtonLink>
          </div>

          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {homeServices.map((service, index) => (
              <Reveal as="li" key={service.id} delay={index * 60}>
                <ServiceCard service={service} showPrice={booking.show_prices_publicly} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* -------------------------------------------------------- COMO FUNCIONA */}
      <Section tone="muted" ariaLabelledBy="como-funciona-title">
        <Container>
          <SectionHeader
            id="como-funciona-title"
            eyebrow="Como funciona"
            title="Do primeiro contato à devolutiva"
            description="Quatro passos, sem surpresa em nenhum deles."
            align="center"
          />
          <div className="mt-12">
            <StepList steps={HOW_IT_WORKS_STEPS} />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ PARA QUEM */}
      <Section tone="default" ariaLabelledBy="para-quem-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
            <SectionHeader
              id="para-quem-title"
              eyebrow="Para quem é"
              title="Quem busca uma avaliação neuropsicológica"
            />
            <HighlightGrid items={AUDIENCE_ITEMS} columns={2} />
          </div>
        </Container>
      </Section>

      {/* -------------------------------------------------------- DIFERENCIAIS */}
      <Section tone="sunken" ariaLabelledBy="diferenciais-title">
        <Container>
          <SectionHeader
            id="diferenciais-title"
            eyebrow="Diferenciais"
            title="O que caracteriza o processo"
            description="Compromissos de método e de comunicação — não promessas de resultado."
            align="center"
          />
          <div className="mt-12">
            <HighlightGrid items={PROCESS_HIGHLIGHTS} />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------- CONTEÚDOS */}
      {features.enable_blog ? (
        <Section tone="default" ariaLabelledBy="conteudos-title">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="conteudos-title"
                eyebrow="Conteúdos"
                title="Artigos e materiais"
                description="Textos para entender o processo antes de decidir."
              />
              <ButtonLink href="/blog" variant="ghost">
                Ver o blog
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>

            {posts.length > 0 ? (
              <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <Reveal as="li" key={post.id} delay={index * 60}>
                    <BlogCard post={post} />
                  </Reveal>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-10"
                icon={<FileText aria-hidden="true" className="h-5 w-5" />}
                title="Os primeiros artigos estão sendo preparados"
                description="Assim que publicados no painel, eles aparecem aqui automaticamente."
                action={
                  <ButtonLink href="/neuropsicologia" variant="secondary" size="sm">
                    Ler sobre neuropsicologia
                  </ButtonLink>
                }
              />
            )}
          </Container>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------ INFOBOOKS */}
      {features.enable_store ? (
        <Section tone="muted" ariaLabelledBy="infobooks-title">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="infobooks-title"
                eyebrow="Infobooks"
                title="Materiais para aprofundar"
                description="Conteúdos organizados para famílias, educadores e profissionais."
              />
              <ButtonLink href="/infobooks" variant="ghost">
                Conhecer os Infobooks
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>

            {infobooks.length > 0 ? (
              <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {infobooks.slice(0, 4).map((infobook, index) => (
                  <Reveal as="li" key={infobook.id} delay={index * 60}>
                    <InfobookCard infobook={infobook} />
                  </Reveal>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-10"
                icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
                title="Nenhum infobook publicado ainda"
                description="Os materiais cadastrados no painel — inclusive os arquivos já existentes — aparecem nesta vitrine."
                action={
                  <ButtonLink href="/infobooks" variant="secondary" size="sm">
                    Ver a área de infobooks
                  </ButtonLink>
                }
              />
            )}
          </Container>
        </Section>
      ) : null}

      {/* ----------------------------------------------------------- PDF ONLINE */}
      {features.enable_pdf_online ? (
        <Section tone="default" ariaLabelledBy="pdf-online-title">
          <Container>
            <Reveal>
              <Card className="overflow-hidden bg-gradient-to-br from-petrol-50 via-surface to-sand-50 p-0">
                <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1.3fr_1fr]">
                  <div>
                    <Badge tone="sand">Leitura online</Badge>
                    <h2 id="pdf-online-title" className="mt-4 text-display-sm">
                      PDF Online
                    </h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
                      O material em PDF continua disponível para leitura direto no navegador, sem
                      download e sem instalação. O conteúdo original foi preservado integralmente e
                      agora ganhou uma área própria dentro do site.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <ButtonLink href="/pdf-online">
                        Abrir o PDF Online
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </ButtonLink>
                      <ButtonLink href="/materiais" variant="ghost">
                        Ver materiais
                      </ButtonLink>
                    </div>
                  </div>

                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white ring-1 ring-petrol-100">
                    <div className="flex h-full flex-col gap-2.5 p-6">
                      <div className="h-2.5 w-1/3 rounded-full bg-petrol-200" />
                      <div className="h-2 w-full rounded-full bg-petrol-100" />
                      <div className="h-2 w-11/12 rounded-full bg-petrol-100" />
                      <div className="h-2 w-10/12 rounded-full bg-petrol-100" />
                      <div className="mt-3 h-2.5 w-1/4 rounded-full bg-sand-300" />
                      <div className="h-2 w-full rounded-full bg-petrol-100" />
                      <div className="h-2 w-9/12 rounded-full bg-petrol-100" />
                      <div className="mt-auto flex items-center gap-2 text-xs text-ink-faint">
                        <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                        Documento preservado
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* --------------------------------------------------------- LANDING PAGES */}
      {features.enable_store && landingPages.length > 0 ? (
        <Section tone="muted" ariaLabelledBy="landing-title">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="landing-title"
                eyebrow="Produtos"
                title="Páginas dos materiais"
                description="As páginas comerciais já existentes, reunidas em uma vitrine."
              />
              <ButtonLink href="/landing-pages" variant="ghost">
                Ver todas
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {landingPages.slice(0, 3).map((page, index) => (
                <Reveal as="li" key={page.id} delay={index * 60}>
                  <LandingPageCard page={page} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* --------------------------------------------------------- DEPOIMENTOS */}
      {/* Renderizado apenas quando existem depoimentos reais cadastrados. */}
      {features.show_testimonials && testimonials.length > 0 ? (
        <Section tone="default" ariaLabelledBy="depoimentos-title">
          <Container>
            <SectionHeader
              id="depoimentos-title"
              eyebrow="Depoimentos"
              title="O que dizem sobre o processo"
              align="center"
            />
            <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Reveal as="li" key={testimonial.id} delay={index * 60}>
                  <Card className="h-full">
                    <Quote aria-hidden="true" className="h-6 w-6 text-sand-400" />
                    <blockquote className="mt-4 text-sm leading-relaxed text-ink-soft">
                      {testimonial.content}
                    </blockquote>
                    <figcaption className="mt-5 text-sm font-medium text-ink">
                      {testimonial.author_display_name}
                      {testimonial.author_context ? (
                        <span className="block text-xs font-normal text-ink-faint">
                          {testimonial.author_context}
                        </span>
                      ) : null}
                    </figcaption>
                  </Card>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* --------------------------------------------------------------- CTA */}
      <CTASection
        title="Pronto para dar o primeiro passo?"
        description="Escolha um horário livre na agenda e envie sua solicitação. Você recebe a confirmação com todas as orientações."
        whatsapp={contact.whatsapp}
        secondaryHref="/servicos"
        secondaryLabel="Ver serviços e duração"
      />

      {/* --------------------------------------------------------------- FAQ */}
      <FaqSection
        faqs={faqs}
        description="As dúvidas mais comuns sobre o processo, o agendamento e o tratamento de dados."
      />

      {/* ------------------------------------------------------------ CONTATO */}
      <Section tone="default" id="contato" ariaLabelledBy="contato-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
            <SectionHeader
              id="contato-title"
              eyebrow="Contato"
              title="Fale diretamente"
              description="Prefere conversar antes de agendar? Escolha o canal mais confortável."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {contact.whatsapp ? (
                <Card interactive className="flex flex-col">
                  <MessageCircle aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                  <p className="mt-4 font-display text-lg text-ink">WhatsApp</p>
                  <p className="mt-1.5 flex-1 text-sm text-ink-muted">
                    Respostas em horário comercial.
                  </p>
                  <ButtonLink
                    href={whatsappLink(contact.whatsapp, 'Olá! Vim pelo site e gostaria de informações.')}
                    external
                    variant="secondary"
                    size="sm"
                    className="mt-5 self-start"
                  >
                    Abrir conversa
                  </ButtonLink>
                </Card>
              ) : null}

              <Card interactive className="flex flex-col">
                <CalendarCheck aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                <p className="mt-4 font-display text-lg text-ink">Agendamento online</p>
                <p className="mt-1.5 flex-1 text-sm text-ink-muted">
                  Veja os horários realmente livres e envie sua solicitação.
                </p>
                <ButtonLink href="/agendamento" size="sm" className="mt-5 self-start">
                  Agendar atendimento
                </ButtonLink>
              </Card>

              <Card interactive className="flex flex-col sm:col-span-2">
                <FileText aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                <p className="mt-4 font-display text-lg text-ink">Formulário de contato</p>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Para dúvidas mais longas, encaminhamentos profissionais ou parcerias.
                </p>
                <ButtonLink href="/contato" variant="ghost" size="sm" className="mt-5 self-start">
                  Ir para o formulário
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </ButtonLink>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd data={faqSchema(faqs)} />
      <JsonLd data={personSchema(settings)} />
    </>
  );
}
