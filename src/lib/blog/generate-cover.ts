import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseAdminConfigured } from '@/lib/env';
import {
  buildBlogCoverPrompt,
  buildPollinationsImageUrl,
  createCoverSeed,
  type CoverPromptInput,
} from '@/lib/blog/cover-prompt';

const POLLINATIONS_TIMEOUT_MS = 90_000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface GeneratedCover {
  coverUrl: string;
  coverAlt: string;
  storagePath: string;
}

export async function generateBlogCoverImage(
  input: CoverPromptInput & { slug?: string },
): Promise<GeneratedCover> {
  const prompt = buildBlogCoverPrompt(input);
  const seed = createCoverSeed(input.variation);
  const imageUrl = buildPollinationsImageUrl(prompt, seed);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POLLINATIONS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error('COVER_GENERATION_FAILED');
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw new Error('COVER_INVALID_RESPONSE');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('COVER_INVALID_SIZE');
  }

  const extension = contentType.includes('png') ? 'png' : 'jpeg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
  const slugPart = (input.slug?.trim() || 'rascunho').replace(/[^a-z0-9-]/gi, '-').slice(0, 80);
  const storagePath = `blog/covers/${slugPart}/${input.variation}.${extension}`;

  if (!isSupabaseAdminConfigured()) {
    throw new Error('STORAGE_NOT_CONFIGURED');
  }

  const admin = createClient(env.supabase.url!, env.supabase.serviceRoleKey!, {
    auth: { persistSession: false },
  });

  const { error: uploadError } = await admin.storage.from('public-assets').upload(storagePath, buffer, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: true,
  });

  if (uploadError) {
    throw new Error('COVER_UPLOAD_FAILED');
  }

  const { data: publicUrlData } = admin.storage.from('public-assets').getPublicUrl(storagePath);

  return {
    coverUrl: publicUrlData.publicUrl,
    coverAlt: `Capa ilustrativa do artigo: ${input.title.trim()}`,
    storagePath,
  };
}
