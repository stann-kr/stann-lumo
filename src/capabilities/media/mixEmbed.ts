/**
 * Click-to-load embeds for mixes hosted on SoundCloud or YouTube. Nothing third-party loads until the visitor
 * presses play; unknown hosts keep the plain outbound link.
 */
export interface MixEmbed { provider: 'soundcloud' | 'youtube'; src: string }

const YOUTUBE_ID = /^[\w-]{11}$/;

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

export function mixEmbed(link: string): MixEmbed | null {
  let url: URL;
  try { url = new URL(link); } catch { return null; }
  if (url.protocol !== 'https:') return null;

  const id = youtubeId(url);
  if (id && YOUTUBE_ID.test(id)) {
    return { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
  }
  if (url.hostname.replace(/^(www|m)\./, '') === 'soundcloud.com' && url.pathname.split('/').filter(Boolean).length >= 2) {
    const track = `https://soundcloud.com${url.pathname}`;
    const params = new URLSearchParams({ url: track, auto_play: 'true', color: '#ff0033', hide_related: 'true', show_comments: 'false', show_reposts: 'false', show_teaser: 'false', visual: 'false' });
    return { provider: 'soundcloud', src: `https://w.soundcloud.com/player/?${params}` };
  }
  return null;
}
