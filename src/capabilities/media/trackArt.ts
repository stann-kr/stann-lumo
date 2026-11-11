import { getPublicImageUrl } from './media';
import { youtubeVideoId } from './mixEmbed';

/**
 * Cover art for a track. An uploaded cover wins; otherwise a SoundCloud or YouTube link supplies the platform's own
 * artwork through the same-origin /api/track-art route, so visitors never contact the platform before pressing play.
 * Bandcamp is not a source: it answers Cloudflare Workers with a bot check instead of the release page (verified
 * 2026-11-11 on oEmbed, feed, page and API paths), so a Bandcamp release needs an uploaded cover.
 */
export type TrackArtSource =
  | { provider: 'youtube'; videoId: string }
  | { provider: 'soundcloud'; url: string };

export function trackArtSource(link?: string | null): TrackArtSource | null {
  if (!link) return null;
  const videoId = youtubeVideoId(link);
  if (videoId) return { provider: 'youtube', videoId };
  let url: URL;
  try { url = new URL(link); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (url.hostname.replace(/^(www|m)\./, '') !== 'soundcloud.com') return null;
  const path = url.pathname.split('/').filter(Boolean);
  // A profile link still has artwork (the avatar); anything deeper than user/set/track is not a SoundCloud page.
  if (path.length < 1 || path.length > 3) return null;
  return { provider: 'soundcloud', url: `https://soundcloud.com/${path.join('/')}` };
}

export function trackCoverUrl(track: { id: string; link?: string; coverImageId?: string }): string | undefined {
  // Covers are shown at most a few hundred CSS pixels wide, so the grid width serves every place they appear.
  if (track.coverImageId) return getPublicImageUrl(track.coverImageId, 640);
  if (trackArtSource(track.link)) return `/api/track-art/${encodeURIComponent(track.id)}?w=640`;
  return undefined;
}
