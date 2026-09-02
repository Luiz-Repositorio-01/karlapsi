import { Container, Section } from '@/components/ui';
import { PageHero } from '@/components/site/sections';
import { LegalPageMotion } from '@/components/site/LegalPageMotion';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Termos de uso',
    description:
      'Regras de uso do site, do agendamento online e dos materiais digitais, incluindo pagamento, acesso e cancelamento.',
    path: '/termos',
  });
}

export default async function TermosPage() {
  const settings = await getSiteSettings();
  const { identity, contact, booking } = settings;

  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Termos de uso"
        description={`Condições aplicáveis ao uso do site de ${identity.brand_name}, ao agendamento online e à compra de materiais digitais.`}
        breadcrumb={[{ label: 'Termos de uso' }]}
      />

      <Section tone="default">
        <Container size="narrow">
          <LegalPageMotion
            content={
          <div className="article-body">
            <h2>1. Objeto</h2>
            <p>
              Este site apresenta a atuação profissional em {identity.positioning}, permite solicitar
              agendamento de atendimentos e disponibiliza materiais digitais informativos.
            </p>

            <h2>2. Caráter informativo do conteúdo</h2>
            <p>
              Os textos, artigos, infobooks e materiais têm finalidade informativa e educativa.{' '}
              <strong>
                Não constituem diagnóstico, prescrição, tratamento ou orientação individualizada
              </strong>{' '}
              e não substituem consulta profissional. Cada caso exige avaliação própria.
            </p>

            <h2>3. Agendamento online</h2>
            <ul>
              <li>
                O envio do formulário gera uma <strong>solicitação</strong>, com status
                &quot;aguardando confirmação&quot;. O atendimento só está confirmado após
                comunicação expressa.
              </li>
              <li>
                É exigida antecedência mínima de {booking.min_lead_hours} horas, e o agendamento é
                liberado para até {booking.max_advance_days} dias à frente.
              </li>
              <li>
                Um horário solicitado fica reservado, impedindo agendamento duplicado. Se a
                solicitação for recusada ou cancelada, o horário volta a ficar disponível.
              </li>
              <li>
                Remarcações e cancelamentos devem ser comunicados o quanto antes pelos canais
                oficiais.
              </li>
              <li>
                Informações incorretas ou incompletas podem impedir a confirmação do atendimento.
              </li>
            </ul>

            <h2>4. Valores</h2>
            <p>
              Os valores dos atendimentos são informados diretamente pela profissional. Quando um
              valor é exibido publicamente no site, ele corresponde ao que está cadastrado no momento
              da consulta e pode ser alterado a qualquer tempo, sem efeito retroativo sobre
              atendimentos já confirmados.
            </p>

            <h2>5. Materiais digitais e pagamento</h2>
            <ul>
              <li>
                O pagamento é processado pelo <strong>Mercado Pago</strong>. Nenhum dado de cartão é
                coletado ou armazenado por este site.
              </li>
              <li>
                O acesso ao material é liberado após a{' '}
                <strong>confirmação oficial do pagamento</strong> pelo processador — o simples
                retorno do navegador não caracteriza pagamento aprovado.
              </li>
              <li>
                Os materiais são de uso pessoal. É vedada a redistribuição, revenda, reprodução
                total ou parcial e o compartilhamento de acessos.
              </li>
            </ul>

            <h2>6. Direito de arrependimento</h2>
            <p>
              Nos termos do art. 49 do Código de Defesa do Consumidor, compras realizadas fora do
              estabelecimento comercial podem ser canceladas em até 7 (sete) dias corridos contados
              do recebimento. Para exercer esse direito, entre em contato pelos canais oficiais.
            </p>

            <h2>7. Propriedade intelectual</h2>
            <p>
              Textos, imagens, materiais, marca e identidade visual pertencem a{' '}
              {identity.brand_name} ou a seus respectivos titulares. O uso sem autorização é
              proibido.
            </p>

            <h2>8. Uso adequado do site</h2>
            <p>
              É proibido tentar obter acesso não autorizado, sobrecarregar a aplicação, realizar
              varreduras automatizadas, enviar conteúdo ilícito ou usar os formulários para envio de
              mensagens em massa. Medidas técnicas de proteção — incluindo limitação de requisições
              — estão em operação.
            </p>

            <h2>9. Área profissional</h2>
            <p>
              O acesso a <code>/admin</code> é restrito a usuários autorizados. Credenciais são
              pessoais e não devem ser compartilhadas. Ações administrativas relevantes são
              registradas em trilha de auditoria.
            </p>

            <h2>10. Disponibilidade</h2>
            <p>
              O site é oferecido &quot;no estado em que se encontra&quot;. Podem ocorrer interrupções
              por manutenção ou por falha de serviços de terceiros. Não há garantia de
              disponibilidade ininterrupta.
            </p>

            <h2>11. Privacidade</h2>
            <p>
              O tratamento de dados pessoais está descrito na{' '}
              <a href="/politica-de-privacidade">política de privacidade</a>, parte integrante destes
              termos.
            </p>

            <h2>12. Foro e legislação</h2>
            <p>
              Estes termos são regidos pela legislação brasileira. Eventuais controvérsias serão
              dirimidas no foro do domicílio do consumidor, quando aplicável.
            </p>

            <h2>13. Contato</h2>
            <p>
              Dúvidas sobre estes termos podem ser enviadas por{' '}
              <a href="/contato">nosso formulário de contato</a>
              {contact.email ? (
                <>
                  {' '}
                  ou para <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </>
              ) : null}
              .
            </p>
          </div>
            }
          />
        </Container>
      </Section>

      <JsonLd data={breadcrumbSchema([{ label: 'Termos de uso', href: '/termos' }])} />
    </>
  );
}
