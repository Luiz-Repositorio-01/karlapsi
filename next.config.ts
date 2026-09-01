import type { NextConfig } from 'next';

/**
 * A URL do Supabase é opcional em build. Quando presente, liberamos o host
 * no CSP (connect-src) e no otimizador de imagens (Storage público).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
let supabaseHost = '';
try {
  supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '';
} catch {
  supabaseHost = '';
}

const connectSrc = [
  "'self'",
  supabaseHost ? `https://${supabaseHost}` : '',
  supabaseHost ? `wss://${supabaseHost}` : '',
  'https://api.mercadopago.com',
]
  .filter(Boolean)
  .join(' ');

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js injeta scripts inline para hidratação/streaming do App Router.
  // O editor interno (admin) carrega mammoth/pdf.js/jspdf do jsDelivr.
  "script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://www.mercadopago.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  `connect-src ${connectSrc} https://cdn.jsdelivr.net https://api.openai.com`,
  "worker-src 'self' blob: https://cdn.jsdelivr.net",
  // Iframes: apenas conteúdo próprio (módulos legados) e checkout do Mercado Pago.
  "frame-src 'self' https://www.mercadopago.com.br https://www.mercadopago.com",
  "form-action 'self' https://www.mercadopago.com.br https://www.mercadopago.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Área administrativa nunca deve ser cacheada por intermediários.
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/legacy/pdf-online/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
  async rewrites() {
    // Mantém os links diretos dos módulos legados (arquivos em /public/legacy)
    // funcionando exatamente como antes da reconstrução do site.
    return [
      { source: '/infobooks/:slug/index.html', destination: '/legacy/infobooks/:slug/index.html' },
      { source: '/landing-pages/:slug/index.html', destination: '/legacy/landing-pages/:slug/index.html' },
      { source: '/landing-pages/:slug/assets/:path*', destination: '/legacy/landing-pages/:slug/assets/:path*' },
    ];
  },
  async redirects() {
    // URLs antigas do site estático continuam resolvendo para o novo conteúdo.
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/sobre.html', destination: '/sobre', permanent: true },
      { source: '/contato.html', destination: '/contato', permanent: true },
      { source: '/servicos.html', destination: '/servicos', permanent: true },
      { source: '/atendimento', destination: '/atendimentos', permanent: true },
      { source: '/agendar', destination: '/agendamento', permanent: true },
      { source: '/neuropsicologia.html', destination: '/neuropsicologia', permanent: true },
      { source: '/pdf', destination: '/infobooks', permanent: true },
      { source: '/pdf-online', destination: '/infobooks', permanent: true },
      { source: '/pdf-online/:path*', destination: '/infobooks', permanent: true },
      { source: '/landing-pages', destination: '/materiais', permanent: true },
      { source: '/landing-pages/:slug', destination: '/materiais', permanent: true },
      { source: '/ebooks', destination: '/infobooks', permanent: true },
      { source: '/produtos', destination: '/materiais', permanent: true },
      { source: '/privacidade', destination: '/politica-de-privacidade', permanent: true },
    ];
  },
};

export default nextConfig;
