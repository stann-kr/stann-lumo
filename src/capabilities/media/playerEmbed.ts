import { bandcampRelease } from './bandcampReleases';

/**
 * Click-to-load players for music hosted on SoundCloud, YouTube or Bandcamp. Nothing third-party loads until the
 * visitor presses play; unknown hosts, and Bandcamp releases missing from bandcampReleases.ts, keep the plain outbound
 * link. `shape` sizes the player: YouTube needs a visible video and SoundCloud's visual player fills the same 16:9
 * screen, while Bandcamp's player is a fixed-height strip.
 */
export type PlayerProvider = 'soundcloud' | 'youtube' | 'bandcamp';
export interface PlayerEmbed { provider: PlayerProvider; src: string; shape: 'screen' | 'strip' }

const YOUTUBE_ID = /^[\w-]{11}$/;
const ACCENT = 'e03c31';

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  if (host === 'youtu.be') return url.pathname.split('/')[1] || null;
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
  if (url.pathname === '/watch') return url.searchParams.get('v');
  const [, kind, id] = url.pathname.split('/');
  return ['live', 'embed', 'shorts'].includes(kind) ? id || null : null;
}

/** The 11-character video id of a YouTube watch, live, embed, shorts or youtu.be link. */
export function youtubeVideoId(link: string): string | null {
  let url: URL;
  try { url = new URL(link); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  const id = youtubeId(url);
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function playerEmbed(link?: string | null): PlayerEmbed | null {
  if (!link) return null;
  let url: URL;
  try { url = new URL(link); } catch { return null; }
  if (url.protocol !== 'https:') return null;

  const id = youtubeId(url);
  if (id && YOUTUBE_ID.test(id)) {
    return { provider: 'youtube', shape: 'screen', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
  }
  if (url.hostname.replace(/^(www|m)\./, '') === 'soundcloud.com' && url.pathname.split('/').filter(Boolean).length >= 2) {
    const track = `https://soundcloud.com${url.pathname}`;
    const params = new URLSearchParams({ url: track, auto_play: 'true', color: `#${ACCENT}`, hide_related: 'true', show_comments: 'false', show_reposts: 'false', show_teaser: 'false', visual: 'true' });
    return { provider: 'soundcloud', shape: 'screen', src: `https://w.soundcloud.com/player/?${params}` };
  }
  const release = bandcampRelease(url);
  if (release) {
    // Bandcamp's player has no autoplay; the visitor presses its own play key.
    const options = [`${release.kind}=${release.id}`, 'size=large', 'bgcol=000000', `linkcol=${ACCENT}`, 'tracklist=false', 'artwork=small', 'transparent=true'];
    return { provider: 'bandcamp', shape: 'strip', src: `https://bandcamp.com/EmbeddedPlayer/${options.join('/')}/` };
  }
  return null;
}
