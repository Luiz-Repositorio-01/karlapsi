import { env } from '@/lib/env';
import type { BlogPostWithRelations, Faq, Service, SiteSettings } from '@/lib/types';

/**
 * Dados estruturados (JSON-LD).
 *
 * Princípio: nenhum dado estruturado falso. Campos que exigem informação real
 * (registro profissional, endereço, telefone, avaliações) só entram no schema
 * quando estão preenchidos nas configurações. Não emitimos `aggregateRating`
 * nem `review` — não há dados reais para isso.
 */

function absoluteUrl(path: string): string {
  return new URL(path, env.siteUrl).toString();
}

export function organizationSchema(settings: SiteSettings) {
  const { identity, contact } = settings;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': absoluteUrl('/#organizacao'),
    name: identity.brand_name,
    url: env.siteUrl,
    description: settings.seo.default_description,
    medicalSpecialty: 'Psychiatric',
    knowsAbout: ['Neuropsicologia', 'Avaliação neuropsicológica', 'Funções cognitivas'],
  };

  if (contact.phone) schema.telephone = contact.phone;
  if (contact.email) schema.email = contact.email;
  if (identity.photo_url) schema.image = identity.photo_url;

  if (contact.address_line || contact.city) {
    schema.address = {
      '@type': 'PostalAddress',
      addressCountry: 'BR',
      ...(contact.address_line ? { streetAddress: contact.address_line } : {}),
      ...(contact.city ? { addressLocality: contact.city } : {}),
      ...(contact.state ? { addressRegion: contact.state } : {}),
    };
  }

  const sameAs = [
    contact.instagram
      ? contact.instagram.startsWith('http')
        ? contact.instagram
        : `https://instagram.com/${contact.instagram.replace(/^@/, '')}`
      : null,
  ].filter(Boolean);
  if (sameAs.length > 0) schema.sameAs = sameAs;

  return schema;
}

/**
 * Person schema apenas quando existe informação real da profissional.
 * Sem registro/bio configurados, retorna null (não inventa credenciais).
 */
export function personSchema(settings: SiteSettings) {
  const { identity } = settings;
  const hasRealData = Boolean(identity.short_bio || identity.professional_registration_value);
  if (!hasRealData) return null;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl('/sobre#profissional'),
    name: identity.professional_name,
    jobTitle: identity.positioning,
    url: absoluteUrl('/sobre'),
    worksFor: { '@id': absoluteUrl('/#organizacao') },
  };

  if (identity.short_bio) schema.description = identity.short_bio;
  if (identity.photo_url) schema.image = identity.photo_url;
  if (identity.professional_registration_value) {
    schema.identifier = {
      '@type': 'PropertyValue',
      name: identity.professional_registration_label || 'Registro profissional',
      value: identity.professional_registration_value,
    };
  }

  return schema;
}

export function websiteSchema(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#site'),
    url: env.siteUrl,
    name: settings.seo.site_name,
    inLanguage: 'pt-BR',
    publisher: { '@id': absoluteUrl('/#organizacao') },
  };
}

export function serviceSchema(service: Service, settings: SiteSettings) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    url: absoluteUrl(`/servicos/${service.slug}`),
    serviceType: service.name,
    provider: { '@id': absoluteUrl('/#organizacao') },
    areaServed: { '@type': 'Country', name: 'Brasil' },
  };

  if (service.summary) schema.description = service.summary;

  // Preço só entra no schema se a profissional autorizou a exibição pública.
  if (service.show_price_publicly && service.price_cents !== null) {
    schema.offers = {
      '@type': 'Offer',
      price: (service.price_cents / 100).toFixed(2),
      priceCurrency: service.currency || 'BRL',
      availability: 'https://schema.org/InStock',
    };
  }

  if (settings.identity.professional_name) {
    schema.brand = { '@type': 'Brand', name: settings.identity.brand_name };
  }

  return schema;
}

export function articleSchema(post: BlogPostWithRelations, settings: SiteSettings) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    inLanguage: 'pt-BR',
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    publisher: { '@id': absoluteUrl('/#organizacao') },
    author: {
      '@type': 'Person',
      name: post.author?.full_name || settings.identity.professional_name,
    },
  };

  if (post.cover_url) schema.image = post.cover_url;
  if (post.tags.length > 0) schema.keywords = post.tags.join(', ');

  return schema;
}

export function faqSchema(faqs: Faq[]) {
  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function breadcrumbSchema(items: { label: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: env.siteUrl },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        item: absoluteUrl(item.href),
      })),
    ],
  };
}
