import type {
  BookingSettings,
  ContactSettings,
  Faq,
  FeatureSettings,
  IdentitySettings,
  Infobook,
  SeoSettings,
  Service,
  SitePage,
  SiteSettings,
} from '@/lib/types';

/**
 * CONTEÚDO PADRÃO (fallback)
 *
 * Marca: Karla Dias.
 * Domínio/Instagram: karlaneuropsi.com.br / @karlaneuropsi (identificadores).
 * Sem CRP, formação, preços, depoimentos ou bio inventados.
 */

export const DEFAULT_IDENTITY: IdentitySettings = {
  brand_name: 'Karla Dias',
  professional_name: 'Karla Dias',
  positioning: 'Psicóloga e Neuropsicóloga',
  headline: 'Especialista em Transtornos do Neurodesenvolvimento',
  subheadline:
    'Avaliação neuropsicológica com ciência, escuta e clareza — um processo estruturado para compreender como a pessoa aprende, se organiza e se relaciona, com devolutiva compreensível e orientações práticas.',
  professional_registration_label: '',
  professional_registration_value: '',
  short_bio: '',
  formation: '',
  specializations: '',
  photo_url: '/images/karla-dias.jpg',
  logo_url: '/images/logo-kd.jpg',
};

export const DEFAULT_CONTACT: ContactSettings = {
  whatsapp: '5511988830377',
  phone: '',
  email: '',
  instagram: '@karlaneuropsi',
  address_line: '',
  city: '',
  state: '',
  service_area: 'Atendimento presencial e online',
  office_hours_label: '',
  map_url: '',
};

export const DEFAULT_BOOKING: BookingSettings = {
  timezone: 'America/Sao_Paulo',
  min_lead_hours: 12,
  max_advance_days: 90,
  default_slot_interval_minutes: 60,
  auto_confirm: false,
  show_prices_publicly: false,
  require_consent: true,
  consent_version: '1.0',
};

export const DEFAULT_SEO: SeoSettings = {
  site_name: 'Karla Dias',
  default_title: 'Karla Dias | Psicóloga e Neuropsicóloga',
  default_description:
    'Karla Dias — Psicóloga e Neuropsicóloga. Especialista em Transtornos do Neurodesenvolvimento. Avaliação neuropsicológica, atendimento online e presencial.',
  default_keywords:
    'Karla Dias, neuropsicologia, psicóloga, avaliação neuropsicológica, transtornos do neurodesenvolvimento, aprendizagem, funções executivas',
  default_og_image: '/images/karla-dias.jpg',
};

export const DEFAULT_FEATURES: FeatureSettings = {
  show_testimonials: true,
  enable_online_payments: false,
  enable_pdf_online: false,
  enable_blog: true,
  enable_store: true,
};

export const DEFAULT_SETTINGS: SiteSettings = {
  identity: DEFAULT_IDENTITY,
  contact: DEFAULT_CONTACT,
  booking: DEFAULT_BOOKING,
  seo: DEFAULT_SEO,
  features: DEFAULT_FEATURES,
};

/** Serviços exibidos enquanto o cadastro do painel não estiver preenchido. */
export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'default-avaliacao-neuropsicologica',
    name: 'Avaliação neuropsicológica',
    slug: 'avaliacao-neuropsicologica',
    summary:
      'Investigação estruturada das funções cognitivas, com entrevista inicial, sessões de testagem, análise dos resultados e devolutiva com orientações.',
    description:
      'A avaliação acontece em etapas: entrevista inicial para entender a demanda, sessões de testagem com instrumentos adequados à idade e ao objetivo, análise integrada dos resultados e encontro de devolutiva. O produto final é um documento com a descrição do desempenho observado e orientações práticas.',
    duration_minutes: 60,
    price_cents: null,
    currency: 'BRL',
    show_price_publicly: false,
    allows_online_booking: true,
    requires_payment: false,
    is_active: true,
    is_featured: true,
    image_url: null,
    preparation_notes:
      'Traga documentos escolares, relatórios anteriores e exames que já tenham sido realizados, se existirem.',
    sort_order: 1,
  },
  {
    id: 'default-entrevista-inicial',
    name: 'Entrevista inicial',
    slug: 'entrevista-inicial',
    summary:
      'Primeiro encontro para entender a demanda, alinhar objetivos e explicar como funciona o processo, sem compromisso de continuidade.',
    description:
      'Conversa inicial em que a queixa é ouvida com cuidado, o histórico é levantado e as possibilidades de acompanhamento são apresentadas com clareza — incluindo etapas, prazos e o que a avaliação pode ou não responder.',
    duration_minutes: 50,
    price_cents: null,
    currency: 'BRL',
    show_price_publicly: false,
    allows_online_booking: true,
    requires_payment: false,
    is_active: true,
    is_featured: true,
    image_url: null,
    preparation_notes: null,
    sort_order: 2,
  },
  {
    id: 'default-devolutiva',
    name: 'Devolutiva e orientação',
    slug: 'devolutiva-e-orientacao',
    summary:
      'Encontro para apresentação dos resultados, esclarecimento de dúvidas e orientações para família, escola ou trabalho.',
    description:
      'A devolutiva traduz os resultados em linguagem acessível, indica pontos de força e de apoio e organiza recomendações práticas para o cotidiano.',
    duration_minutes: 50,
    price_cents: null,
    currency: 'BRL',
    show_price_publicly: false,
    allows_online_booking: true,
    requires_payment: false,
    is_active: true,
    is_featured: false,
    image_url: null,
    preparation_notes: null,
    sort_order: 3,
  },
];

/** Infobooks reais (títulos, textos, capas e links das landings originais). */
export const DEFAULT_INFOBOOKS: Infobook[] = [
  {
    id: 'default-infobook-autismo',
    title: 'Desenvolvimento Infantil e Autismo',
    slug: 'autismo',
    description:
      'Guia completo para compreender o desenvolvimento infantil além do diagnóstico.',
    category: 'Desenvolvimento infantil',
    cover_url: '/images/infobooks/autismo.jpg',
    product_id: null,
    is_free: false,
    price_cents: 3790,
    file_path: null,
    public_file_url: 'https://go.hotmart.com/U105876781J',
    preview_url: null,
    legacy_path: 'legacy/infobooks/autismo/index.html',
    pages: null,
    status: 'published',
    sort_order: 1,
    seo_title: 'Desenvolvimento Infantil e Autismo',
    seo_description:
      'Guia completo para pais que querem entender o desenvolvimento infantil além do diagnóstico.',
  },
  {
    id: 'default-infobook-cuidar',
    title: 'Cuidar, Ensinar e Acompanhar',
    slug: 'cuidar',
    description: 'Um programa parental baseado na ciência e na prática clínica.',
    category: 'Programa parental',
    cover_url: '/images/infobooks/cuidar.jpg',
    product_id: null,
    is_free: false,
    price_cents: 3400,
    file_path: null,
    public_file_url: 'https://go.hotmart.com/S105848508C',
    preview_url: null,
    legacy_path: 'legacy/infobooks/cuidar/index.html',
    pages: null,
    status: 'published',
    sort_order: 2,
    seo_title: 'Cuidar, Ensinar e Acompanhar',
    seo_description:
      'Programa parental baseado na ciência e na prática clínica, para fortalecer vínculos e a comunicação emocional.',
  },
];

export const DEFAULT_FAQS: Faq[] = [
  {
    id: 'faq-1',
    question: 'O que é uma avaliação neuropsicológica?',
    answer:
      'É um processo de investigação que usa entrevistas, escalas e testes padronizados para descrever como funcionam atenção, memória, linguagem, raciocínio, funções executivas e outros domínios cognitivos, sempre considerando a história de vida e o contexto da pessoa.',
    category: 'neuropsicologia',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'faq-2',
    question: 'Quantos encontros são necessários?',
    answer:
      'Varia conforme o objetivo, a idade e a demanda. O número de sessões é combinado na entrevista inicial, depois de entender o caso — nunca antes.',
    category: 'neuropsicologia',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'faq-3',
    question: 'A avaliação dá um diagnóstico?',
    answer:
      'A avaliação neuropsicológica descreve o funcionamento cognitivo e contribui com dados objetivos para o raciocínio diagnóstico, frequentemente em conjunto com outros profissionais. O fechamento de um diagnóstico depende de avaliação clínica integrada.',
    category: 'neuropsicologia',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'faq-4',
    question: 'Como funciona o agendamento?',
    answer:
      'Pelo site você escolhe o serviço, vê os horários realmente livres e envia a solicitação. Ela chega com o status "aguardando confirmação" e você recebe a confirmação depois da checagem da agenda.',
    category: 'agendamento',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'faq-5',
    question: 'O atendimento pode ser online?',
    answer:
      'Parte do processo pode acontecer online, dependendo do objetivo e dos instrumentos necessários. Essa definição é feita na entrevista inicial.',
    category: 'atendimento',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'faq-6',
    question: 'Há atendimento presencial?',
    answer:
      'Sim. Sessões de testagem e encontros que exigem material físico ou observação direta podem ser presenciais. O formato é combinado na entrevista inicial conforme o objetivo.',
    category: 'atendimento',
    sort_order: 6,
    is_active: true,
  },
  {
    id: 'faq-7',
    question: 'O que são os Infobooks?',
    answer:
      'São materiais digitais desenvolvidos para ampliar o acesso à informação sobre psicologia, neuropsicologia e desenvolvimento. Cada Infobook tem capa, descrição e acesso próprios quando publicados no site.',
    category: 'infobooks',
    sort_order: 7,
    is_active: true,
  },
  {
    id: 'faq-8',
    question: 'Como meus dados são tratados?',
    answer:
      'Os dados são usados apenas para o atendimento e para o cumprimento de obrigações legais, com acesso restrito e registro de consentimento. Você pode solicitar acesso, correção ou exclusão a qualquer momento na página de Política de Privacidade.',
    category: 'privacidade',
    sort_order: 8,
    is_active: true,
  },
];

/** Páginas institucionais. Substituídas por `site_pages` quando existirem. */
export const DEFAULT_SITE_PAGES: Record<string, SitePage> = {
  sobre: {
    slug: 'sobre',
    title: 'Sobre Karla Dias',
    subtitle: 'Psicóloga e Neuropsicóloga. Especialista em Transtornos do Neurodesenvolvimento.',
    sections: [
      {
        id: 'apresentacao',
        heading: 'Apresentação',
        body: 'Este espaço é dedicado à neuropsicologia: à investigação cuidadosa do funcionamento cognitivo e à tradução desses achados em orientações úteis para a vida cotidiana. A biografia profissional completa é publicada somente quando preenchida no painel administrativo — para que cada informação divulgada seja exatamente a que a profissional deseja comunicar.',
      },
      {
        id: 'como-trabalho',
        heading: 'Como o trabalho é conduzido',
        items: [
          {
            title: 'Escuta antes de qualquer instrumento',
            description:
              'A queixa é compreendida no contexto de vida da pessoa antes da escolha de qualquer teste.',
          },
          {
            title: 'Instrumentos adequados ao objetivo',
            description:
              'A seleção considera idade, escolaridade, demanda e o que precisa ser respondido.',
          },
          {
            title: 'Devolutiva compreensível',
            description:
              'Resultados são apresentados em linguagem clara, com recomendações aplicáveis.',
          },
          {
            title: 'Trabalho integrado',
            description:
              'Quando necessário, articulação com escola, família e outros profissionais envolvidos.',
          },
        ],
      },
      {
        id: 'compromissos',
        heading: 'Compromissos',
        items: [
          { title: 'Sigilo', description: 'Informações do atendimento são confidenciais.' },
          {
            title: 'Transparência',
            description: 'Etapas, prazos e alcance do processo combinados desde o início.',
          },
          {
            title: 'Sem promessa de resultado',
            description:
              'A avaliação descreve o funcionamento cognitivo; não vende garantias nem soluções rápidas.',
          },
        ],
      },
    ],
    seo_title: 'Sobre Karla Dias | Psicóloga e Neuropsicóloga',
    seo_description:
      'Conheça Karla Dias, Psicóloga e Neuropsicóloga. Especialista em Transtornos do Neurodesenvolvimento.',
    is_published: true,
  },

  neuropsicologia: {
    slug: 'neuropsicologia',
    title: 'Neuropsicologia',
    subtitle:
      'A área que estuda a relação entre o funcionamento do cérebro e o comportamento, a cognição e a aprendizagem.',
    sections: [
      {
        id: 'o-que-e',
        heading: 'O que é neuropsicologia',
        body: 'A neuropsicologia investiga como processos cognitivos — atenção, memória, linguagem, percepção, raciocínio e funções executivas — sustentam o comportamento e a aprendizagem. Na prática clínica, ela usa entrevistas, observação e instrumentos padronizados para descrever esse funcionamento de forma objetiva, comparando o desempenho com referências adequadas à idade e à escolaridade. Os conteúdos deste site são informativos e não substituem avaliação profissional individualizada.',
      },
      {
        id: 'para-quem',
        heading: 'Para quem é indicada',
        items: [
          {
            title: 'Crianças e adolescentes',
            description:
              'Dificuldades de aprendizagem, queixas de atenção, organização escolar, questões de desenvolvimento.',
          },
          {
            title: 'Adultos',
            description:
              'Queixas de memória, atenção e organização, impacto cognitivo de condições de saúde, decisões sobre estudo e trabalho.',
          },
          {
            title: 'Pessoas idosas',
            description:
              'Acompanhamento do funcionamento cognitivo ao longo do tempo e apoio ao planejamento de cuidados.',
          },
          {
            title: 'Encaminhamentos profissionais',
            description:
              'Casos em que médicos, psicólogos, fonoaudiólogos ou escolas precisam de dados cognitivos objetivos.',
          },
        ],
      },
      {
        id: 'neurodesenvolvimento',
        heading: 'Transtornos do neurodesenvolvimento',
        body: 'A avaliação neuropsicológica pode contribuir para compreender demandas relacionadas a atenção, aprendizagem, linguagem, funções executivas e desenvolvimento socioemocional — sempre no contexto de uma investigação responsável, sem diagnosticar o visitante pelo conteúdo do site e sem substituir acompanhamento clínico individualizado.',
      },
      {
        id: 'como-funciona',
        heading: 'Como funciona uma avaliação',
        items: [
          {
            title: '1. Entrevista inicial',
            description:
              'Levantamento da demanda, da história de desenvolvimento, de saúde e de escolaridade, e definição de objetivos.',
          },
          {
            title: '2. Planejamento',
            description:
              'Escolha dos instrumentos e definição do número aproximado de sessões, conforme o objetivo combinado.',
          },
          {
            title: '3. Sessões de testagem',
            description:
              'Aplicação de testes e escalas em encontros organizados para preservar o desempenho e o conforto da pessoa.',
          },
          {
            title: '4. Análise integrada',
            description:
              'Correção, interpretação e integração dos dados com as informações da entrevista e de outras fontes.',
          },
          {
            title: '5. Devolutiva',
            description:
              'Encontro para apresentar os achados em linguagem acessível e discutir recomendações.',
          },
          {
            title: '6. Documento e orientações',
            description:
              'Entrega do documento e, quando autorizado, articulação com escola e demais profissionais.',
          },
        ],
      },
      {
        id: 'objetivos',
        heading: 'Objetivos do processo',
        items: [
          {
            title: 'Descrever o funcionamento cognitivo',
            description: 'Mapear pontos de força e pontos que precisam de apoio.',
          },
          {
            title: 'Apoiar o raciocínio diagnóstico',
            description: 'Fornecer dados objetivos à equipe de saúde que acompanha o caso.',
          },
          {
            title: 'Orientar intervenções',
            description: 'Direcionar estratégias de estudo, trabalho, reabilitação e adaptações.',
          },
          {
            title: 'Reduzir incerteza',
            description:
              'Substituir suposições por informação organizada, compreensível e utilizável.',
          },
        ],
      },
      {
        id: 'beneficios',
        heading: 'O que muda depois',
        body: 'Com um retrato claro do funcionamento cognitivo, decisões deixam de ser tentativa e erro: a escola sabe onde adaptar, a família entende o que observa em casa, a pessoa reconhece suas estratégias e a equipe de saúde ganha dados para conduzir o cuidado. A avaliação não promete resolver tudo — ela organiza o caminho.',
      },
    ],
    seo_title: 'Neuropsicologia | Karla Dias — o que é, para quem é e como funciona',
    seo_description:
      'Entenda o que é neuropsicologia, quem se beneficia da avaliação neuropsicológica e como o processo é conduzido.',
    is_published: true,
  },

  atendimentos: {
    slug: 'atendimentos',
    title: 'Atendimentos',
    subtitle: 'Online e presencial — formatos, etapas e o que esperar de cada encontro.',
    sections: [
      {
        id: 'formatos',
        heading: 'Atendimento online e presencial',
        items: [
          {
            title: 'Online',
            description:
              'Comodidade e privacidade para entrevistas, devolutivas, orientações e instrumentos com aplicação remota validada. Requer ambiente silencioso, conexão estável e dispositivo adequado.',
          },
          {
            title: 'Presencial',
            description:
              'Indicado especialmente para sessões de testagem que exigem material físico e observação direta. A localização é informada quando configurada no painel — nunca inventada no site.',
          },
          {
            title: 'Híbrido',
            description:
              'Combinação definida na entrevista inicial, conforme objetivo e viabilidade técnica.',
          },
        ],
      },
      {
        id: 'o-que-esperar',
        heading: 'O que esperar',
        items: [
          {
            title: 'Horário reservado',
            description: 'Cada encontro tem duração definida e horário exclusivo na agenda.',
          },
          {
            title: 'Combinações claras',
            description: 'Valores, formas de pagamento e política de remarcação combinados antes do início.',
          },
          {
            title: 'Registro organizado',
            description:
              'Documentação mantida com sigilo e acesso restrito, conforme a legislação aplicável.',
          },
        ],
      },
    ],
    seo_title: 'Atendimentos online e presencial | Karla Dias',
    seo_description:
      'Formatos de atendimento online e presencial, etapas do processo e o que esperar de cada encontro.',
    is_published: true,
  },

  'avaliacao-neuropsicologica': {
    slug: 'avaliacao-neuropsicologica',
    title: 'Avaliação neuropsicológica',
    subtitle: 'Um processo em etapas, com começo, meio e devolutiva.',
    sections: [
      {
        id: 'indicacoes',
        heading: 'Quando a avaliação é indicada',
        items: [
          {
            title: 'Dificuldade escolar persistente',
            description: 'Quando o esforço não se converte em aprendizagem e a causa não está clara.',
          },
          {
            title: 'Queixas de atenção e organização',
            description:
              'Distração, esquecimentos, dificuldade de planejar e concluir tarefas no dia a dia.',
          },
          {
            title: 'Mudança percebida no funcionamento',
            description:
              'Alteração de memória, linguagem ou raciocínio que preocupa a pessoa ou a família.',
          },
          {
            title: 'Pedido de outro profissional',
            description: 'Necessidade de dados cognitivos objetivos para conduzir um tratamento.',
          },
        ],
      },
      {
        id: 'etapas',
        heading: 'Etapas',
        items: [
          { title: 'Entrevista inicial', description: 'Demanda, histórico e objetivos.' },
          { title: 'Testagem', description: 'Sessões com instrumentos padronizados.' },
          { title: 'Análise', description: 'Correção, interpretação e integração dos dados.' },
          { title: 'Devolutiva', description: 'Resultados e recomendações em linguagem clara.' },
          { title: 'Documento', description: 'Entrega do relatório com o que foi observado.' },
        ],
      },
      {
        id: 'limites',
        heading: 'O que a avaliação não faz',
        body: 'A avaliação neuropsicológica não substitui consulta médica, não garante resultado terapêutico e não fecha diagnóstico isoladamente. Ela descreve funcionamento cognitivo com método e contribui, junto de outras avaliações, para decisões de cuidado.',
      },
    ],
    seo_title: 'Avaliação neuropsicológica | Karla Dias',
    seo_description:
      'Quando a avaliação neuropsicológica é indicada, como é conduzida por etapas e o que ela pode ou não responder.',
    is_published: true,
  },
};

/** Diferenciais do processo (não são credenciais nem promessas). */
export const PROCESS_HIGHLIGHTS = [
  {
    title: 'Atendimento individualizado',
    description:
      'Cada processo considera a história, a idade e o objetivo — sem pacote fixo de testes.',
  },
  {
    title: 'Escuta antes do instrumento',
    description: 'A queixa é compreendida no contexto de vida antes da escolha de qualquer escala.',
  },
  {
    title: 'Devolutiva compreensível',
    description:
      'Resultados apresentados em linguagem acessível para família, escola e a própria pessoa.',
  },
  {
    title: 'Orientações aplicáveis',
    description: 'Recomendações pensadas para o cotidiano de casa, da escola e do trabalho.',
  },
  {
    title: 'Agenda organizada',
    description:
      'Horário reservado com exclusividade, confirmação registrada e histórico de cada encontro.',
  },
  {
    title: 'Dados tratados com cuidado',
    description: 'Acesso restrito, registro de consentimento e respeito à LGPD.',
  },
];

export const AUDIENCE_ITEMS = [
  {
    title: 'Famílias com dúvidas sobre aprendizagem',
    description:
      'Quando a escola sinaliza dificuldade e a família quer entender o que está acontecendo.',
  },
  {
    title: 'Adultos com queixas cognitivas',
    description: 'Atenção, memória e organização afetando estudo, trabalho ou rotina.',
  },
  {
    title: 'Profissionais que precisam de dados',
    description: 'Médicos, psicólogos e educadores que solicitam avaliação cognitiva objetiva.',
  },
  {
    title: 'Pessoas em acompanhamento',
    description: 'Quem precisa monitorar o funcionamento cognitivo ao longo do tempo.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Solicite um horário',
    description:
      'Escolha o serviço e um horário realmente livre na agenda. A solicitação entra como "aguardando confirmação".',
  },
  {
    step: '02',
    title: 'Confirmação',
    description:
      'A agenda é checada e você recebe a confirmação com data, horário, duração e orientações de preparo.',
  },
  {
    step: '03',
    title: 'Entrevista inicial',
    description:
      'O primeiro encontro define objetivos, etapas e o formato do processo — sem compromisso de continuidade.',
  },
  {
    step: '04',
    title: 'Processo e devolutiva',
    description:
      'Sessões conduzidas conforme o plano combinado, com devolutiva clara e orientações práticas ao final.',
  },
];

export const MODALITY_ITEMS = [
  {
    title: 'Online',
    description:
      'Comodidade, privacidade e alcance remoto para entrevistas, devolutivas e orientações — com requisitos técnicos combinados previamente.',
  },
  {
    title: 'Presencial',
    description:
      'Experiência em ambiente adequado para testagem com material físico e observação direta. Endereço exibido somente quando configurado.',
  },
];
