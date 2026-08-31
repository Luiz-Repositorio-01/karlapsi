import { ExternalLink, FileText, Info } from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, Container, Section, SectionHeader } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getLegacyPdfEntry, listLegacyPdfFiles } from '@/lib/legacy';

// Revalidação curta: os arquivos legados podem ser publicados a qualquer
// momento e a página passa a exibi-los sem novo deploy.
export const revalidate = 60;

export async function generateMetadata() {
  return buildMetadata({
    title: 'PDF Online',
    description:
      'Leia o material em PDF diretamente no navegador, sem download e sem instalar nada. Conteúdo original preservado.',
    path: '/pdf-online',
  });
}

export default async function PdfOnlinePage() {
  const settings = await getSiteSettings();
  const legacyEntry = getLegacyPdfEntry();
  const pdfFiles = listLegacyPdfFiles();
  const isAvailable = Boolean(legacyEntry) || pdfFiles.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Materiais"
        title="PDF Online"
        description="Leitura direta no navegador, em qualquer dispositivo, sem download. O conteúdo original do material foi preservado integralmente."
        breadcrumb={[{ label: 'PDF Online' }]}
        actions={
          isAvailable ? (
            <ButtonLink href="#leitor">Abrir o leitor</ButtonLink>
          ) : (
            <ButtonLink href="/materiais">Ver outros materiais</ButtonLink>
          )
        }
      />

      <Section tone="default" id="leitor">
        <Container>
          {legacyEntry ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge tone="success">Conteúdo original preservado</Badge>
                  <span className="text-sm text-ink-muted">
                    Exibido exatamente como no material publicado.
                  </span>
                </div>
                <ButtonLink href={legacyEntry} external variant="secondary" size="sm">
                  Abrir em nova aba
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>

              {/* O módulo legado roda isolado dentro do iframe (mesma origem),
                  sem sofrer nenhuma alteração de conteúdo ou estilo. */}
              <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100">
                <iframe
                  src={legacyEntry}
                  title="PDF Online — material completo"
                  className="h-[75vh] min-h-[520px] w-full"
                  loading="lazy"
                />
              </div>
            </>
          ) : pdfFiles.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {pdfFiles.map((file) => (
                <li key={file}>
                  <Card interactive className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                      <span className="text-sm font-medium text-ink">
                        {decodeURIComponent(file.split('/').pop() ?? file)}
                      </span>
                    </div>
                    <ButtonLink href={file} external size="sm" variant="secondary">
                      Ler online
                    </ButtonLink>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Alert tone="info" title="Material ainda não publicado neste ambiente">
              <p>
                Esta área está pronta e integrada ao site. Para exibir o material, copie os arquivos
                originais do PDF Online para <code>public/legacy/pdf-online/</code> — a página passa
                a mostrá-los automaticamente, sem nenhuma alteração de código.
              </p>
              <p className="mt-2">
                As URLs antigas do módulo (<code>/pdf-online/index.html</code> e seus assets)
                continuam mapeadas e funcionando.
              </p>
            </Alert>
          )}
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeader
            eyebrow="Sobre esta área"
            title="Por que ler online"
            description="Menos fricção para quem só quer consultar o conteúdo."
          />

          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                title: 'Sem download',
                description: 'Abre direto no navegador, inclusive no celular.',
              },
              {
                title: 'Sempre atualizado',
                description: 'A versão publicada é a que aparece — sem arquivo desatualizado.',
              },
              {
                title: 'Conteúdo intacto',
                description: 'O material original não foi reescrito nem resumido.',
              },
            ].map((item) => (
              <li key={item.title}>
                <Card className="h-full">
                  <p className="font-display text-lg text-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                </Card>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-start gap-2 text-sm text-ink-faint">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            O conteúdo tem caráter informativo e não substitui avaliação individualizada.
          </p>
        </Container>
      </Section>

      <CTASection
        title="Quer discutir o conteúdo no seu caso?"
        description="A leitura ajuda a entender o processo; a avaliação responde à sua situação específica."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/infobooks"
        secondaryLabel="Ver infobooks"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'PDF Online', href: '/pdf-online' }])} />
    </>
  );
}
