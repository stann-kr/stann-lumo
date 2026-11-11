import 'server-only';

import type { TrackArtSource } from './trackArt';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_ART_BYTES = 4 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 4000;
/** Lets the Cloudflare edge keep upstream answers; ignored outside Workers. */
const EDGE_CACHE = { cf: { cacheTtl: 86_400, cacheEverything: true } } as RequestInit;

export interface TrackArt { body: ArrayBuffer; contentType: string }

function isAllowedArtUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname.endsWith('.sndcdn.com') || url.hostname.endsWith('.bcbits.com') || url.hostname === 'i.ytimg.com');
  } catch { return false; }
}

// Workers reject redirect: 'error'; manual keeps 3xx responses, which fail the ok check below.
async function fetchImage(url: string, fetcher: typeof fetch): Promise<TrackArt | null> {
  if (!isAllowedArtUrl(url)) return null;
  const response = await fetcher(url, { ...EDGE_CACHE, redirect: 'manual', signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!response.ok || !IMAGE_TYPES.has(contentType)) return null;
  if (Number(response.headers.get('content-length') ?? 0) > MAX_ART_BYTES) return null;
  const body = await response.arrayBuffer();
  return body.byteLength > 0 && body.byteLength <= MAX_ART_BYTES ? { body, contentType } : null;
}

async function soundcloudArtUrl(pageUrl: string, fetcher: typeof fetch): Promise<string | null> {
  const endpoint = `https://soundcloud.com/oembed?${new URLSearchParams({ format: 'json', url: pageUrl })}`;
  const response = await fetcher(endpoint, { ...EDGE_CACHE, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null) as { thumbnail_url?: unknown } | null;
  return isAllowedArtUrl(data?.thumbnail_url) ? data.thumbnail_url : null;
}

/** Fetches the platform artwork for a track link. Only SoundCloud oEmbed, *.sndcdn.com, *.bcbits.com and i.ytimg.com are contacted. */
export async function fetchTrackArt(source: TrackArtSource, fetcher: typeof fetch = fetch): Promise<TrackArt | null> {
  try {
    if (source.provider === 'youtube') {
      // maxres has no letterbox bars but is missing on some videos (404); hq always exists.
      for (const size of ['maxresdefault', 'hqdefault']) {
        const art = await fetchImage(`https://i.ytimg.com/vi/${source.videoId}/${size}.jpg`, fetcher);
        if (art) return art;
      }
      return null;
    }
    if (source.provider === 'bandcamp') return await fetchImage(source.artUrl, fetcher);
    const artUrl = await soundcloudArtUrl(source.url, fetcher);
    return artUrl ? await fetchImage(artUrl, fetcher) : null;
  } catch {
    return null;
  }
}
