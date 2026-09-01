import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  ExternalLink,
  FileText,
  Laptop,
  MapPin,
  MessageCircle,
  Quote,
} from 'lucide-react';
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  EmptyState,
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
import { BlogCard, InfobookCard, ServiceCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  AUDIENCE_ITEMS,
  HOW_IT_WORKS_STEPS,
  MODALITY_ITEMS,
  PROCESS_HIGHLIGHTS,
} from '@/lib/content/defaults';
import {
  getFaqs,
  getInfobooks,
  getProducts,
  getPublishedPosts,
  getServices,
  getSitePage,
  getSiteSettings,
  getTestimonials,
} from '@/lib/data/public';
import { faqSchema, personSchema } from '@/lib/seo/jsonld';
import { whatsappLink } from '@/lib/utils/format';

export const revalidate = 300;

export default async function HomePage() {
  const [settings, services, posts, infobooks, products, faqs, testimonials, neuroPage] =
    await Promise.all([
      getSiteSettings(),
      getServices(),
      getPublishedPosts(3),
      getInfobooks(),
      getProducts(),
      getFaqs(),
      getTestimonials(),
      getSitePage('neuropsicologia'),
    ]);

  const { identity, contact, features, booking } = settings;
  const featuredServices = services.filter((service) => service.is_featured).slice(0, 3);
  const homeServices = featuredServices.length > 0 ? featuredServices : services.slice(0, 3);
  const hotmartProducts = products.filter((p) => p.external_url?.includes('hotmart.com'));

  const neuroSteps =
    neuroPage?.sections.find((section) => section.id === 'como-funciona')?.items ?? [];

  const displayName = identity.professional_name || identity.brand_name || 'Karla Dias';

  return (
    <>
      {/* ----------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden surface-warm" aria-labelledby="hero-title">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(30,67,59,0.07),transparent_55%),radial-gradient(ellipse_at_90%_20%,rgba(196,164,132,0.12),transparent_45%)]"
        />
        <Container className="relative py-16 sm:py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Reveal>
                <p className="font-display text-display-xl text-petrol-800">{displayName}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-petrol-600">
                  {identity.positioning}
                </p>
              </Reveal>

              <Reveal delay={80}>
                <h1
                  id="hero-title"
                  className="mt-6 max-w-xl text-display-sm text-ink-soft sm:text-display-md"
                >
                  {identity.headline}
                </h1>
              </Reveal>

              <Reveal delay={140}>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
                  {identity.short_bio
                    ? identity.short_bio.split('\n\n')[0]
                    : identity.subheadline}
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <ButtonLink href="/agendamento" size="lg">
                    <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                    Agendar atendimento
                  </ButtonLink>
                  <ButtonLink href="/sobre" variant="secondary" size="lg">
                    Conheça meu trabalho
                  </ButtonLink>
                </div>
              </Reveal>
            </div>

            <Reveal delay={160} className="relative">
              {/* Retrato: PENDENTE DE ARQUIVO — moldura tipográfica até foto real. */}
              <div className="photo-frame relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-surface-sunken shadow-lift ring-1 ring-white/60">
                {identity.photo_url ? (
                  <Image
                    src={identity.photo_url}
                    alt={`Retrato de ${displayName}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 420px"
                    className="object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="flex h-full flex-col justify-between bg-gradient-to-br from-petrol-700 via-petrol-800 to-petrol-950 p-8 text-petrol-50">
                    <Brain aria-hidden="true" className="h-9 w-9 text-petrol-300" />
                    <div>
                      <p className="font-display text-3xl leading-tight text-white">{displayName}</p>
                      <p className="mt-2 text-sm uppercase tracking-[0.18em] text-petrol-300">
                        {identity.positioning}
                      </p>
                      {identity.headline ? (
                        <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-petrol-200">
                          {identity.headline}
                        </p>
                      ) : null}
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

      {/* -------------------------------------------------- APRESENTAÇÃO */}
      <Section tone="default" ariaLabelledBy="apresentacao-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
            <SectionHeader
              id="apresentacao-title"
              eyebrow="Conheça"
              title={`Conheça ${displayName}`}
              description={identity.positioning}
            />
            <div className="article-body max-w-prose">
              <p>
                O foco deste consultório é a <strong>neuropsicologia</strong> e o cuidado com
                demandas relacionadas ao <strong>neurodesenvolvimento</strong>: entender como cada
                pessoa presta atenção, memoriza, organiza tarefas, comunica e aprende — e o que isso
                significa na escola, no trabalho e na convivência.
              </p>
              {identity.short_bio ? (
                identity.short_bio.split('\n\n').map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))
              ) : (
                <p>
                  A avaliação é um processo com etapas definidas, instrumentos escolhidos caso a caso
                  e uma devolutiva que a família consegue usar. Nada de promessa rápida: o que se
                  entrega é informação organizada, ética e aplicável.
                </p>
              )}
              <p>
                <Link href="/sobre">Conhecer a proposta de trabalho</Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------- NEUROPSICOLOGIA */}
      <Section tone="deep" id="neuropsicologia" ariaLabelledBy="neuro-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            <div>
              <SectionHeader
                id="neuro-title"
                tone="dark"
                eyebrow="Eixo principal"
                title="Neuropsicologia"
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

      {/* -------------------------------- NEURODESENVOLVIMENTO */}
      <Section tone="muted" ariaLabelledBy="neurodev-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
            <SectionHeader
              id="neurodev-title"
              eyebrow="Área de atuação"
              title="Transtornos do Neurodesenvolvimento"
              description="Conteúdo informativo — não substitui avaliação profissional."
            />
            <div className="article-body max-w-prose">
              <p>
                A avaliação neuropsicológica pode contribuir para compreender demandas relacionadas a
                atenção, aprendizagem, linguagem, funções executivas, comportamento e desenvolvimento
                socioemocional — sempre no contexto de uma investigação responsável.
              </p>
              <p>
                Temas como TDAH, TEA e dificuldades de aprendizagem entram nesta conversa clínica
                quando há indicação. O site não diagnostica o visitante e não transforma artigos em
                consultas.
              </p>
              <p>
                <Link href="/neuropsicologia">Saiba mais sobre neuropsicologia</Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ PARA QUEM */}
      <Section tone="default" ariaLabelledBy="para-quem-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
            <SectionHeader
              id="para-quem-title"
              eyebrow="Indicações"
              title="Para quem a avaliação pode ser indicada"
            />
            <HighlightGrid items={AUDIENCE_ITEMS} columns={2} />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------ ONLINE / PRESENCIAL */}
      <Section tone="sunken" ariaLabelledBy="modalidade-title">
        <Container>
          <SectionHeader
            id="modalidade-title"
            eyebrow="Atendimento"
            title="Online e presencial"
            description="O formato é definido na entrevista inicial, conforme o objetivo e a viabilidade."
            align="center"
          />
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {MODALITY_ITEMS.map((item, index) => (
              <Reveal as="li" key={item.title} delay={index * 80}>
                <Card className="h-full">
                  {item.title === 'Online' ? (
                    <Laptop aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                  ) : (
                    <MapPin aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                  )}
                  <h3 className="mt-4 font-display text-xl text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                  {item.title === 'Presencial' && contact.address_line ? (
                    <p className="mt-4 text-sm text-ink-soft">{contact.address_line}</p>
                  ) : null}
                </Card>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/atendimentos" variant="ghost">
              Ver detalhes dos atendimentos
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ButtonLink>
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

      {/* -------------------------------------------------------- DIFERENCIAIS */}
      <Section tone="default" ariaLabelledBy="diferenciais-title">
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

      {/* ------------------------------------------------------------- BLOG */}
      {features.enable_blog ? (
        <Section tone="muted" ariaLabelledBy="conteudos-title">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="conteudos-title"
                eyebrow="Conteúdos"
                title="Central de conteúdo"
                description="Artigos para entender o processo antes de decidir."
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
        <Section tone="default" ariaLabelledBy="infobooks-title">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="infobooks-title"
                eyebrow="Infobooks"
                title={`Conheça os Infobooks de ${displayName}`}
                description="Conteúdos desenvolvidos para ampliar o acesso à informação sobre psicologia, neuropsicologia e desenvolvimento."
              />
              <ButtonLink href="/infobooks" variant="ghost">
                Conhecer Infobooks
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
                title="Infobooks em preparação"
                description="Quando as capas e arquivos reais forem publicados no painel, eles aparecem nesta vitrine."
                action={
                  <ButtonLink href="/infobooks" variant="secondary" size="sm">
                    Ver a área de Infobooks
                  </ButtonLink>
                }
              />
            )}
          </Container>
        </Section>
      ) : null}

      {/* --------------------------------------------------------- HOTMART */}
      {features.enable_store && hotmartProducts.length > 0 ? (
        <Section tone="muted" ariaLabelledBy="produtos-title">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="produtos-title"
                eyebrow="Conteúdos e materiais"
                title="Produtos digitais"
                description="Acesso direto aos materiais disponíveis na Hotmart. Nome, preço e descrição completos são editáveis no painel."
              />
              <ButtonLink href="/materiais" variant="ghost">
                Ver materiais
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>

            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {hotmartProducts.map((product, index) => (
                <Reveal as="li" key={product.id} delay={index * 60}>
                  <Card className="flex h-full flex-col">
                    <Badge tone="sand">Hotmart</Badge>
                    <h3 className="mt-4 font-display text-xl text-ink">{product.name}</h3>
                    {product.summary ? (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                        {product.summary}
                      </p>
                    ) : (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                        Detalhes do produto na página de checkout da Hotmart.
                      </p>
                    )}
                    {product.external_url ? (
                      <ButtonLink
                        href={product.external_url}
                        external
                        size="sm"
                        className="mt-6 self-start"
                      >
                        Acessar na Hotmart
                        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      </ButtonLink>
                    ) : null}
                  </Card>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* --------------------------------------------------------- DEPOIMENTOS */}
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
        title="Agende seu atendimento"
        description="Escolha um horário livre na agenda ou fale pelo WhatsApp. Você recebe a confirmação com todas as orientações."
        primaryHref="/agendamento"
        primaryLabel="Agendar atendimento"
        whatsapp={contact.whatsapp}
        secondaryHref="/contato"
        secondaryLabel="Entrar em contato"
      />

      {/* --------------------------------------------------------------- FAQ */}
      <FaqSection
        faqs={faqs}
        description="Dúvidas sobre atendimento, neuropsicologia, agendamento e Infobooks."
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
