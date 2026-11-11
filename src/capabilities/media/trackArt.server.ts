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

/** Bandcamp has no oEmbed; its og:image sits in the first few KB of the page, so only that head is read. */
const BANDCAMP_HEAD_BYTES = 64 * 1024;
const OG_IMAGE = /<meta\s+property="og:image"\s+content="([^"]+)"/i;

async function bandcampArtUrl(pageUrl: string, fetcher: typeof fetch): Promise<string | null> {
  const response = await fetcher(pageUrl, { ...EDGE_CACHE, redirect: 'manual', signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  if (!response.ok || !response.body) return null;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let head = '';
  try {
    while (head.length < BANDCAMP_HEAD_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      head += decoder.decode(value, { stream: true });
      const match = OG_IMAGE.exec(head);
      if (match) return isAllowedArtUrl(match[1]) ? match[1] : null;
    }
    return null;
  } finally {
    await reader.cancel().catch(() => {});
  }
}

/** Fetches the platform artwork for a track link. Only SoundCloud oEmbed, the linked *.bandcamp.com page, *.sndcdn.com, *.bcbits.com and i.ytimg.com are contacted. */
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
    const artUrl = source.provider === 'bandcamp' ? await bandcampArtUrl(source.url, fetcher) : await soundcloudArtUrl(source.url, fetcher);
    return artUrl ? await fetchImage(artUrl, fetcher) : null;
  } catch {
    return null;
  }
}
