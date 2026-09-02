import { z } from 'zod';
import { can } from '@/lib/auth/rbac';
import { getApiSession } from '@/lib/auth/session';
import { generateBlogCoverImage } from '@/lib/blog/generate-cover';
import { excerptFromMarkdown } from '@/lib/content/markdown';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  errorResponse,
  rateLimitResponse,
  readJson,
  successResponse,
  validationError,
} from '@/lib/utils/request';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const blogCoverRequestSchema = z.object({
  title: z.string().trim().min(3, 'Informe o título do artigo').max(200),
  content: z.string().trim().min(20, 'O conteúdo está muito curto para gerar uma capa').max(80_000),
  excerpt: z.string().trim().max(400).optional(),
  slug: z.string().trim().max(120).optional(),
  variation: z.string().uuid('Identificador de variação inválido'),
});

/** POST /api/blog/cover — gera capa editorial via Pollinations (gratuito) e salva no Storage. */
export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session || !can(session.profile.role, 'content:manage')) {
    return errorResponse('Você não tem permissão para gerar capas.', 403, 'FORBIDDEN');
  }

  const limit = rateLimit({
    key: `blog-cover:${session.id}`,
    limit: 20,
    windowSeconds: 3600,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  let payload: unknown;
  try {
    payload = await readJson(request, 96_000);
  } catch {
    return errorResponse('Requisição inválida.', 400, 'INVALID_PAYLOAD');
  }

  const parsed = blogCoverRequestSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const { title, content, excerpt, slug, variation } = parsed.data;

  try {
    const cover = await generateBlogCoverImage({
      title,
      content,
      excerpt: excerpt || excerptFromMarkdown(content, 320),
      slug,
      variation,
    });

    return successResponse({
      coverUrl: cover.coverUrl,
      coverAlt: cover.coverAlt,
      message: 'Capa gerada com sucesso. Salve o artigo para publicar.',
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'COVER_ERROR';

    if (code === 'STORAGE_NOT_CONFIGURED') {
      return errorResponse(
        'O armazenamento não está configurado. Verifique SUPABASE_SERVICE_ROLE_KEY.',
        503,
        code,
      );
    }

    if (code === 'COVER_GENERATION_FAILED' || code === 'COVER_INVALID_RESPONSE') {
      return errorResponse(
        'O serviço de imagens não respondeu. Aguarde alguns segundos e tente novamente.',
        502,
        code,
      );
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return errorResponse(
        'A geração demorou demais. Tente novamente — cada clique cria uma capa nova.',
        504,
        'COVER_TIMEOUT',
      );
    }

    return errorResponse(
      'Não foi possível gerar a capa agora. Tente novamente em instantes.',
      500,
      code,
    );
  }
}
