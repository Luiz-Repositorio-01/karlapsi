import { Container, Section } from '@/components/ui';
import { PageHero } from '@/components/site/sections';
import { LegalPageMotion } from '@/components/site/LegalPageMotion';
import { DataSubjectRequestForm } from '@/components/site/DataSubjectRequestForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Política de privacidade',
    description:
      'Como os dados pessoais são coletados, usados, armazenados e protegidos, e como exercer seus direitos previstos na LGPD.',
    path: '/politica-de-privacidade',
  });
}

export default async function PoliticaPage() {
  const settings = await getSiteSettings();
  const { identity, contact, booking } = settings;
  const controllerContact = contact.email || contact.whatsapp || 'canal informado no site';

  return (
    <>
      <PageHero
        eyebrow="Privacidade"
        title="Política de privacidade"
        description={`Versão ${booking.consent_version}. Esta política descreve como os dados pessoais são tratados por ${identity.brand_name}.`}
        breadcrumb={[{ label: 'Política de privacidade' }]}
      />

      <Section tone="default">
        <Container>
          <LegalPageMotion
            content={
            <div className="article-body max-w-prose">
              <h2>1. Quem é o controlador dos dados</h2>
              <p>
                O tratamento dos dados pessoais coletados neste site é realizado por{' '}
                <strong>{identity.brand_name}</strong>, na condição de controladora, nos termos da
                Lei nº 13.709/2018 (LGPD). Para qualquer questão relativa a dados pessoais, o
                contato é: {controllerContact}.
              </p>

              <h2>2. Quais dados são coletados</h2>
              <p>Coletamos apenas o necessário para cada finalidade:</p>
              <ul>
                <li>
                  <strong>Agendamento:</strong> nome, e-mail, telefone, serviço escolhido, data e
                  horário desejados e, quando o atendimento é para um dependente, o nome dessa
                  pessoa e, opcionalmente, a data de nascimento.
                </li>
                <li>
                  <strong>Contato:</strong> nome, e-mail, telefone (opcional), assunto e mensagem.
                </li>
                <li>
                  <strong>Compra de materiais:</strong> nome, e-mail e telefone (opcional). Dados de
                  pagamento são coletados e processados diretamente pelo Mercado Pago —{' '}
                  <strong>nenhum dado de cartão passa por este site</strong>.
                </li>
                <li>
                  <strong>Registros técnicos:</strong> data e hora das interações, navegador
                  utilizado e um <em>hash</em> irreversível do endereço IP, usado apenas para
                  prevenir abuso e comprovar consentimento. O IP não é armazenado em texto claro.
                </li>
                <li>
                  <strong>Cadastro de atendimento:</strong> quando o atendimento se concretiza,
                  dados cadastrais e administrativos necessários ao acompanhamento e ao cumprimento
                  de obrigações legais e profissionais.
                </li>
              </ul>

              <h2>3. Para que os dados são usados</h2>
              <ul>
                <li>organizar e confirmar agendamentos e atendimentos;</li>
                <li>responder solicitações de contato;</li>
                <li>processar compras de materiais digitais e liberar o acesso;</li>
                <li>cumprir obrigações legais, regulatórias e profissionais aplicáveis;</li>
                <li>proteger a segurança do site e prevenir fraude e abuso.</li>
              </ul>
              <p>
                Os dados <strong>não são vendidos</strong> nem utilizados para publicidade de
                terceiros.
              </p>

              <h2>4. Bases legais</h2>
              <p>
                Dependendo da finalidade, o tratamento se fundamenta em: consentimento do titular
                (art. 7º, I), execução de contrato ou de procedimentos preliminares (art. 7º, V),
                cumprimento de obrigação legal ou regulatória (art. 7º, II), exercício regular de
                direitos (art. 7º, VI) e, no caso de dados de saúde, tutela da saúde por
                profissional de saúde (art. 11, II, &quot;f&quot;).
              </p>

              <h2>5. Registro do consentimento</h2>
              <p>
                Quando o consentimento é a base legal, o aceite é registrado com data, hora, versão
                do termo e <em>hash</em> do IP, permitindo comprovar quando e a que o titular
                consentiu. A versão atual desta política é {booking.consent_version}.
              </p>

              <h2>6. Compartilhamento</h2>
              <p>Os dados são compartilhados apenas com operadores essenciais à operação:</p>
              <ul>
                <li>
                  <strong>Supabase</strong> — hospedagem do banco de dados, autenticação e
                  armazenamento de arquivos;
                </li>
                <li>
                  <strong>Mercado Pago</strong> — processamento de pagamentos (quando houver
                  compra);
                </li>
                <li>
                  <strong>Provedor de e-mail transacional</strong> — envio de confirmações e avisos.
                </li>
              </ul>
              <p>
                Também pode haver compartilhamento por determinação legal ou judicial. Nenhum
                operador está autorizado a usar os dados para finalidade própria.
              </p>

              <h2>7. Segurança</h2>
              <ul>
                <li>acesso ao sistema restrito por autenticação e por papel (perfil de acesso);</li>
                <li>
                  isolamento de dados aplicado no próprio banco de dados (
                  <em>Row Level Security</em>), e não apenas na interface;
                </li>
                <li>tráfego criptografado (HTTPS) e cookies de sessão protegidos;</li>
                <li>documentos privados sem acesso público, entregues por link temporário;</li>
                <li>trilha de auditoria das ações administrativas relevantes;</li>
                <li>
                  exibição minimizada de dados sensíveis (por exemplo, CPF é apresentado mascarado
                  nas telas em que o número completo não é necessário).
                </li>
              </ul>

              <h2>8. Retenção</h2>
              <p>
                Os dados são mantidos pelo tempo necessário às finalidades acima e aos prazos legais
                aplicáveis, inclusive os prazos de guarda de documentação profissional. Encerrado o
                prazo, os dados são excluídos ou anonimizados.
              </p>

              <h2>9. Seus direitos</h2>
              <p>
                Você pode solicitar confirmação da existência de tratamento, acesso, correção,
                anonimização, portabilidade, informação sobre compartilhamento e revogação do
                consentimento. Use o formulário ao lado ou o contato informado. Poderá ser
                necessário confirmar sua identidade antes da execução do pedido.
              </p>

              <h2>10. Cookies</h2>
              <p>
                Este site usa apenas cookies necessários ao funcionamento — principalmente o cookie
                de sessão da área profissional. Não utilizamos cookies de publicidade nem de
                rastreamento de terceiros.
              </p>

              <h2>11. Menores de idade</h2>
              <p>
                Quando o atendimento envolve criança ou adolescente, o tratamento ocorre no melhor
                interesse do titular e depende de consentimento ou autorização do responsável legal.
              </p>

              <h2>12. Alterações desta política</h2>
              <p>
                Alterações relevantes serão publicadas nesta página com nova versão. Recomendamos
                consulta periódica.
              </p>
            </div>
            }
            aside={
            <aside className="space-y-4">
              <DataSubjectRequestForm />
              <p className="px-1 text-xs leading-relaxed text-ink-faint">
                Prefere e-mail? Envie sua solicitação para {controllerContact} indicando o direito
                que deseja exercer.
              </p>
            </aside>
            }
          />
        </Container>
      </Section>

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Política de privacidade', href: '/politica-de-privacidade' },
        ])}
      />
    </>
  );
}
