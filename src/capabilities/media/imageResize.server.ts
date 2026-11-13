import 'server-only';

import type { ImagesBinding } from '@/lib/db';
import { IMAGE_WIDTHS, type ImageWidth } from './media';

/** Animated GIFs and vectors would lose motion or sharpness; they are served as uploaded. */
const RESIZABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export function parseImageWidth(value: string | null): ImageWidth | null {
  const width = Number(value);
  return (IMAGE_WIDTHS as readonly number[]).includes(width) ? width as ImageWidth : null;
}

export function isResizableImageType(contentType: string | undefined): boolean {
  return RESIZABLE_TYPES.has(contentType ?? '');
}

/**
 * Scales an image down to `width` as WebP. Returns null when the binding is missing (Node dev), the type is not resizable,
 * or the transformation fails — including the Images free-plan monthly limit — so the caller serves the original instead.
 * One output format per width keeps the monthly unique-transformation count to sources × widths.
 */
export async function resizeImage(
  images: ImagesBinding | undefined,
  body: ReadableStream<Uint8Array>,
  contentType: string,
  width: ImageWidth,
): Promise<{ body: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!images || !isResizableImageType(contentType)) return null;
  try {
    const result = (await images.input(body).transform({ width, fit: 'scale-down' }).output({ format: 'image/webp', quality: 82 })).response();
    if (!result.ok || !result.body) return null;
    return { body: result.body, contentType: 'image/webp' };
  } catch {
    return null;
  }
}

/** Workers' default edge cache; absent under Node, where every request is produced afresh. */
function edgeCache(): Cache | null {
  const store = (globalThis as { caches?: CacheStorage & { default?: Cache } }).caches;
  return store?.default ?? null;
}

/**
 * Serves a resized image from the edge cache, or produces it once and stores it, so a width is transformed per data centre
 * rather than per visitor. A null answer from `produce` is not cached and lets the caller fall back to the original.
 * Entries outlive R2 objects, so callers confirm the object exists and put its version in `key` before asking.
 */
export async function cachedResize(key: string, produce: () => Promise<Response | null>): Promise<Response | null> {
  const cache = edgeCache();
  const hit = await cache?.match(key).catch(() => undefined);
  if (hit) return hit;
  const response = await produce();
  if (response && cache) await cache.put(key, response.clone()).catch(() => {});
  return response;
}
