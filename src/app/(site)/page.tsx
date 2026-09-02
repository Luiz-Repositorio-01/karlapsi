import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
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
import {
  CTASection,
  FaqSection,
  HighlightGrid,
  StepList,
} from '@/components/site/sections';
import { BlogCard, ServiceCard } from '@/components/site/cards';
import { InfobookCardMotion } from '@/components/site/InfobookCardMotion';
import { HomeHero } from '@/components/site/motion';
import { MotionBlock } from '@/components/site/MotionBlock';
import { NeuroAmbient } from '@/components/site/NeuroAmbient';
import { StaggerList } from '@/components/motion';
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
  const infobookCheckoutUrls = new Set(
    infobooks.map((item) => item.public_file_url).filter((url): url is string => Boolean(url)),
  );
  const hotmartProducts = products.filter(
    (product) =>
      Boolean(product.external_url?.includes('hotmart.com')) &&
      !infobookCheckoutUrls.has(product.external_url ?? ''),
  );

  const neuroSteps =
    neuroPage?.sections.find((section) => section.id === 'como-funciona')?.items ?? [];
  const evaluationSteps =
    neuroSteps.length > 0
      ? neuroSteps
      : [
          { title: '1. Entrevista inicial', description: 'Demanda, histórico e objetivos.' },
          { title: '2. Planejamento', description: 'Escolha dos instrumentos e do número de sessões.' },
          { title: '3. Sessões de testagem', description: 'Aplicação de testes e escalas padronizados.' },
          { title: '4. Análise integrada', description: 'Interpretação dos dados com a história clínica.' },
          { title: '5. Devolutiva', description: 'Encontro para apresentar os achados em linguagem clara.' },
          { title: '6. Documento e orientações', description: 'Entrega do documento e orientações práticas.' },
        ];

  const displayName = identity.professional_name || identity.brand_name || 'Karla Dias';

  return (
    <>
      <HomeHero
        displayName={displayName}
        positioning={identity.positioning}
        headline={identity.headline}
        shortBio={identity.short_bio}
        subheadline={identity.subheadline}
        photoUrl={identity.photo_url}
        registrationLabel={identity.professional_registration_label}
        registrationValue={identity.professional_registration_value}
      />

      {/* -------------------------------------------------- APRESENTAÇÃO */}
      <Section tone="default" ariaLabelledBy="apresentacao-title">
        <Container>
          <MotionBlock>
            <SectionHeader
              id="apresentacao-title"
              eyebrow="Conheça"
              title={`Conheça ${displayName}`}
              description={identity.positioning}
            />
          </MotionBlock>
          <MotionBlock delay={120} className="article-body mt-8 max-w-3xl">
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
              <Link href="/sobre" className="link-premium">
                Conhecer a proposta de trabalho
              </Link>
            </p>
          </MotionBlock>
        </Container>
      </Section>

      {/* --------------------------------------------- NEUROPSICOLOGIA */}
      <Section tone="deep" id="neuropsicologia" ariaLabelledBy="neuro-title" className="relative overflow-hidden">
        <NeuroAmbient />
        <Container className="relative">
          <MotionBlock variant="blur-up">
            <p className="eyebrow text-petrol-200">Eixo principal</p>
            <h2 id="neuro-title" className="mt-3 max-w-3xl text-display-md text-white">
              Neuropsicologia
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-petrol-100">
            {neuroPage?.subtitle ??
              'A área que estuda a relação entre funcionamento cerebral, cognição e comportamento. A avaliação descreve como a pessoa pensa, aprende e se organiza — e entrega isso em linguagem que a família consegue usar.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/neuropsicologia" variant="onDark">
              Entender a neuropsicologia
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/avaliacao-neuropsicologica" variant="outlineOnDark">
              Ver a avaliação em detalhe
            </ButtonLink>
          </div>
          </MotionBlock>

          <MotionBlock delay={160}>
          <h3 className="mt-12 font-display text-xl text-white">Etapas da avaliação</h3>
          <StaggerList className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={90}>
            {evaluationSteps.map((item, index) => {
              const title = item.title.replace(/^\d+\.\s*/, '');
              const step = String(index + 1).padStart(2, '0');
              return (
                <li key={item.title}>
                  <article className="flex h-full gap-4 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/12">
                    <span
                      className="font-display text-2xl leading-none text-sand-300"
                      aria-hidden="true"
                    >
                      {step}
                    </span>
                    <div>
                      <h4 className="font-display text-base text-white">{title}</h4>
                      {item.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-petrol-100">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </li>
              );
            })}
          </StaggerList>
          </MotionBlock>
        </Container>
      </Section>

      {/* -------------------------------- NEURODESENVOLVIMENTO */}
      <Section tone="muted" ariaLabelledBy="neurodev-title">
        <Container>
          <MotionBlock>
            <SectionHeader
              id="neurodev-title"
              eyebrow="Área de atuação"
              title="Transtornos do Neurodesenvolvimento"
              description="Conteúdo informativo — não substitui avaliação profissional."
            />
          </MotionBlock>
          <MotionBlock delay={120} className="article-body mt-8 max-w-3xl">
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
          </MotionBlock>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ PARA QUEM */}
      <Section tone="default" ariaLabelledBy="para-quem-title">
        <Container>
          <MotionBlock>
            <SectionHeader
              id="para-quem-title"
              eyebrow="Indicações"
              title="Para quem a avaliação pode ser indicada"
            />
          </MotionBlock>
          <div className="mt-10">
            <HighlightGrid items={AUDIENCE_ITEMS} columns={2} />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------ ONLINE / PRESENCIAL */}
      <Section tone="sunken" ariaLabelledBy="modalidade-title">
        <Container>
          <MotionBlock>
            <SectionHeader
              id="modalidade-title"
              eyebrow="Atendimento"
              title="Online e presencial"
              description="O formato é definido na entrevista inicial, conforme o objetivo e a viabilidade."
              align="center"
            />
          </MotionBlock>
          <StaggerList className="mt-12 grid gap-5 md:grid-cols-2" stagger={100}>
            {MODALITY_ITEMS.map((item) => (
              <li key={item.title}>
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
              </li>
            ))}
          </StaggerList>
          <MotionBlock delay={160} className="mt-8 flex justify-center">
            <ButtonLink href="/atendimentos" variant="ghost">
              Ver detalhes dos atendimentos
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ButtonLink>
          </MotionBlock>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ SERVIÇOS */}
      <Section tone="default" id="servicos" ariaLabelledBy="servicos-title">
        <Container>
          <MotionBlock>
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
          </MotionBlock>

          <StaggerList className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={100}>
            {homeServices.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} showPrice={booking.show_prices_publicly} />
              </li>
            ))}
          </StaggerList>
        </Container>
      </Section>

      {/* -------------------------------------------------------- COMO FUNCIONA */}
      <Section tone="muted" ariaLabelledBy="como-funciona-title">
        <Container>
          <MotionBlock>
            <SectionHeader
              id="como-funciona-title"
              eyebrow="Como funciona"
              title="Do primeiro contato à devolutiva"
              description="Quatro passos, sem surpresa em nenhum deles."
              align="center"
            />
          </MotionBlock>
          <div className="mt-12">
            <StepList steps={HOW_IT_WORKS_STEPS} />
          </div>
        </Container>
      </Section>

      {/* -------------------------------------------------------- DIFERENCIAIS */}
      <Section tone="default" ariaLabelledBy="diferenciais-title">
        <Container>
          <MotionBlock>
            <SectionHeader
              id="diferenciais-title"
              eyebrow="Diferenciais"
              title="O que caracteriza o processo"
              description="Compromissos de método e de comunicação — não promessas de resultado."
              align="center"
            />
          </MotionBlock>
          <div className="mt-12">
            <HighlightGrid items={PROCESS_HIGHLIGHTS} />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------ INFOBOOKS */}
      {features.enable_store ? (
        <Section tone="warm" ariaLabelledBy="infobooks-title">
          <Container>
            <MotionBlock>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="infobooks-title"
                eyebrow="Infobooks"
                title={`Infobooks de ${displayName}`}
                description="Materiais para ampliar o acesso à informação sobre psicologia, neuropsicologia e desenvolvimento — com preço visível e compra direta."
              />
              <ButtonLink href="/infobooks" variant="secondary">
                Ver todos os Infobooks
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
            </MotionBlock>

            {infobooks.length > 0 ? (
              <StaggerList className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={110}>
                {infobooks.slice(0, 3).map((infobook, index) => (
                  <li key={infobook.id}>
                    <InfobookCardMotion infobook={infobook} featured={index === 0 && infobooks.length > 1} />
                  </li>
                ))}
              </StaggerList>
            ) : (
              <EmptyState
                className="mt-10"
                icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
                title="Infobooks em breve"
                description="Novos materiais digitais serão publicados nesta vitrine em breve."
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

      {/* ------------------------------------------------------------- BLOG */}
      {features.enable_blog ? (
        <Section tone="muted" ariaLabelledBy="conteudos-title">
          <Container>
            <MotionBlock>
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
            </MotionBlock>

            {posts.length > 0 ? (
              <StaggerList className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={90}>
                {posts.map((post) => (
                  <li key={post.id}>
                    <BlogCard post={post} authorName={identity.professional_name} />
                  </li>
                ))}
              </StaggerList>
            ) : (
              <EmptyState
                className="mt-10"
                icon={<FileText aria-hidden="true" className="h-5 w-5" />}
                title="Os primeiros artigos estão sendo preparados"
                description="Novos textos serão publicados em breve."
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

      {/* --------------------------------------------------------- HOTMART */}
      {features.enable_store && hotmartProducts.length > 0 ? (
        <Section tone="muted" ariaLabelledBy="produtos-title">
          <Container>
            <MotionBlock>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader
                id="produtos-title"
                eyebrow="Conteúdos e materiais"
                title="Produtos digitais"
                description="Acesso direto aos materiais disponíveis na Hotmart."
              />
              <ButtonLink href="/materiais" variant="ghost">
                Ver materiais
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
            </MotionBlock>

            <StaggerList className="mt-10 grid gap-5 md:grid-cols-2" stagger={90}>
              {hotmartProducts.map((product) => (
                <li key={product.id}>
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
                </li>
              ))}
            </StaggerList>
          </Container>
        </Section>
      ) : null}

      {/* --------------------------------------------------------- DEPOIMENTOS */}
      {features.show_testimonials && testimonials.length > 0 ? (
        <Section tone="default" ariaLabelledBy="depoimentos-title">
          <Container>
            <MotionBlock>
              <SectionHeader
                id="depoimentos-title"
                eyebrow="Depoimentos"
                title="O que dizem sobre o processo"
                align="center"
              />
            </MotionBlock>
            <StaggerList className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={90}>
              {testimonials.map((testimonial) => (
                <li key={testimonial.id}>
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
                </li>
              ))}
            </StaggerList>
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
          <MotionBlock>
            <SectionHeader
              id="contato-title"
              eyebrow="Contato"
              title="Fale diretamente"
              description="Prefere conversar antes de agendar? Escolha o canal mais confortável."
            />
          </MotionBlock>

          <StaggerList className="mt-10 grid gap-4 sm:grid-cols-2" stagger={80}>
              {contact.whatsapp ? (
                <li>
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
                </li>
              ) : null}

              <li>
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
              </li>

              <li className="sm:col-span-2">
              <Card interactive className="flex flex-col">
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
              </li>
          </StaggerList>
        </Container>
      </Section>

      <JsonLd data={faqSchema(faqs)} />
      <JsonLd data={personSchema(settings)} />
    </>
  );
}
