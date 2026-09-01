import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Download, FileText, ShoppingBag } from 'lucide-react';
import { Badge, ButtonLink, Card } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, formatDate, formatDuration } from '@/lib/utils/format';
import type { BlogPostWithRelations, Infobook, LandingPage, Product, Service } from '@/lib/types';

export function ServiceCard({
  service,
  showPrice,
  className,
}: {
  service: Service;
  showPrice: boolean;
  className?: string;
}) {
  const priceVisible = showPrice && service.show_price_publicly && service.price_cents !== null;

  return (
    <Card interactive className={cn('flex h-full flex-col', className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl text-ink">{service.name}</h3>
        {service.is_featured ? <Badge tone="sand">Destaque</Badge> : null}
      </div>

      {service.summary ? (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{service.summary}</p>
      ) : null}

      <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-ink-soft">
          <Clock aria-hidden="true" className="h-4 w-4 text-petrol-500" />
          <dt className="sr-only">Duração</dt>
          <dd>{formatDuration(service.duration_minutes)}</dd>
        </div>
        {priceVisible ? (
          <div className="text-ink-soft">
            <dt className="sr-only">Valor</dt>
            <dd className="font-medium text-ink">{formatCurrency(service.price_cents)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {service.allows_online_booking ? (
          <ButtonLink
            href={`/agendamento?servico=${service.slug}`}
            size="sm"
            aria-label={`Agendar ${service.name}`}
          >
            Agendar
          </ButtonLink>
        ) : null}
        <ButtonLink href={`/servicos/${service.slug}`} variant="ghost" size="sm">
          Detalhes
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </ButtonLink>
      </div>
    </Card>
  );
}

export function BlogCard({
  post,
  className,
  featured = false,
}: {
  post: BlogPostWithRelations;
  className?: string;
  featured?: boolean;
}) {
  return (
    <Card
      as="article"
      interactive
      className={cn('flex h-full flex-col overflow-hidden p-0', className)}
    >
      <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
        <div
          className={cn(
            'relative w-full overflow-hidden bg-surface-sunken',
            featured ? 'aspect-[16/9]' : 'aspect-[3/2]',
          )}
        >
          {post.cover_url ? (
            <Image
              src={post.cover_url}
              alt={post.cover_alt ?? post.title}
              fill
              sizes={featured ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 768px) 100vw, 33vw'}
              className="object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-petrol-50 to-sand-100">
              <FileText aria-hidden="true" className="h-8 w-8 text-petrol-300" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            {post.category ? (
              <span className="font-medium text-petrol-600">{post.category.name}</span>
            ) : null}
            {post.published_at ? (
              <>
                {post.category ? <span aria-hidden="true">·</span> : null}
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              </>
            ) : null}
            {post.reading_minutes ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.reading_minutes} min de leitura</span>
              </>
            ) : null}
          </div>

          <h3
            className={cn(
              'mt-3 font-display text-ink transition-colors group-hover:text-petrol-700',
              featured ? 'text-display-sm' : 'text-lg',
            )}
          >
            {post.title}
          </h3>

          {post.excerpt ? (
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>
          ) : null}

          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-petrol-700">
            Ler artigo
            <ArrowRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </Card>
  );
}

export function InfobookCard({ infobook }: { infobook: Infobook }) {
  const isFree = infobook.is_free;
  const price = infobook.price_cents;

  return (
    <Card as="article" interactive className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-sunken">
        {infobook.cover_url ? (
          <Image
            src={infobook.cover_url}
            alt={`Capa do infobook ${infobook.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sand-100 to-petrol-50">
            <BookOpen aria-hidden="true" className="h-9 w-9 text-petrol-300" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone={isFree ? 'success' : 'sand'}>{isFree ? 'Gratuito' : 'Material pago'}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {infobook.category ? (
          <p className="text-xs font-medium text-petrol-600">{infobook.category}</p>
        ) : null}
        <h3 className="mt-1.5 font-display text-lg text-ink">{infobook.title}</h3>
        {infobook.description ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
            {infobook.description}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink">
            {isFree ? 'Acesso liberado' : formatCurrency(price)}
          </span>
          {infobook.pages ? (
            <span className="text-xs text-ink-faint">{infobook.pages} páginas</span>
          ) : null}
        </div>

        <div className="mt-4">
          <ButtonLink href={`/infobooks/${infobook.slug}`} size="sm" className="w-full">
            {isFree ? (
              <>
                <Download aria-hidden="true" className="h-4 w-4" />
                Baixar
              </>
            ) : (
              <>
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                Comprar
              </>
            )}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card as="article" interactive className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken">
        {product.cover_url ? (
          <Image
            src={product.cover_url}
            alt={`Imagem do material ${product.name}`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-petrol-50 to-sand-100">
            <ShoppingBag aria-hidden="true" className="h-8 w-8 text-petrol-300" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg text-ink">{product.name}</h3>
        {product.summary ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{product.summary}</p>
        ) : null}

        {product.benefits.length > 0 ? (
          <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
            {product.benefits.slice(0, 3).map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-petrol-400" />
                {benefit}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-xl text-ink">
            {product.is_free ? 'Gratuito' : formatCurrency(product.price_cents)}
          </span>
          {product.compare_at_cents && product.compare_at_cents > product.price_cents ? (
            <span className="text-sm text-ink-faint line-through">
              {formatCurrency(product.compare_at_cents)}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <ButtonLink href={`/materiais/${product.slug}`} size="sm" className="w-full">
            {product.is_free ? 'Acessar' : 'Ver material'}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

export function LandingPageCard({ page }: { page: LandingPage }) {
  return (
    <Card as="article" interactive className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-sunken">
        {page.cover_url ? (
          <Image
            src={page.cover_url}
            alt={`Capa de ${page.name}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-clay-400/25 to-petrol-50">
            <FileText aria-hidden="true" className="h-8 w-8 text-petrol-400" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg text-ink">{page.name}</h3>
        {page.headline ? (
          <p className="mt-1 text-sm font-medium text-petrol-700">{page.headline}</p>
        ) : null}
        {page.description ? (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{page.description}</p>
        ) : null}

        {page.audience ? (
          <p className="mt-4 text-xs text-ink-faint">
            <span className="font-medium text-ink-soft">Para quem é:</span> {page.audience}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3">
          {page.price_cents !== null ? (
            <span className="font-display text-lg text-ink">{formatCurrency(page.price_cents)}</span>
          ) : (
            <span className="text-sm text-ink-muted">Acesso livre</span>
          )}
          <ButtonLink href={`/landing-pages/${page.slug}`} size="sm">
            {page.cta_label || 'Acessar'}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
