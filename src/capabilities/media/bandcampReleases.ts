/**
 * Stann Lumo's Bandcamp releases, recorded from each release page (album og:image on 2026-11-11, bc-page-properties item id on
 * 2026-11-16). Bandcamp answers Cloudflare Workers with a bot check instead of the page, so the site cannot read either at
 * request time; the image host (f4.bcbits.com) and the embedded player (bandcamp.com/EmbeddedPlayer) do answer browsers
 * and Workers. Add an entry with each new Bandcamp release: without one the release keeps its outbound link and no player.
 * An uploaded cover in the admin takes precedence over `art`.
 */
export interface BandcampRelease { kind: 'album' | 'track'; id: number; art?: string }

export const BANDCAMP_RELEASES: Readonly<Record<string, BandcampRelease>> = {
  'https://ameniiarecords.bandcamp.com/album/frame-dragging': { kind: 'album', id: 2961344320, art: 'https://f4.bcbits.com/img/a3040184544_5.jpg' },
  'https://ameniiarecords.bandcamp.com/track/stann-lumo-orbital-static-ascend': { kind: 'track', id: 1388824656 },
  'https://ameniiarecords.bandcamp.com/track/conveyor-stann-lumo-remix': { kind: 'track', id: 54779920 },
  'https://ameniiarecords.bandcamp.com/album/astral-prologue': { kind: 'album', id: 1557644433, art: 'https://f4.bcbits.com/img/a0890718297_5.jpg' },
  'https://ameniiarecords.bandcamp.com/track/beyond-neptune': { kind: 'track', id: 405012664 },
  'https://ameniiarecords.bandcamp.com/album/in-to-the-b': { kind: 'album', id: 2386770127, art: 'https://f4.bcbits.com/img/a3533710304_5.jpg' },
  'https://ameniiarecords.bandcamp.com/track/unrest': { kind: 'track', id: 2091834588 },
  'https://ameniiarecords.bandcamp.com/track/behemoth': { kind: 'track', id: 3296465772 },
  'https://ameniiarecords.bandcamp.com/album/pole-position': { kind: 'album', id: 2036769616, art: 'https://f4.bcbits.com/img/a1278742392_5.jpg' },
  'https://ameniiarecords.bandcamp.com/track/stann-lumo-concorso': { kind: 'track', id: 3072620821 },
};

const BANDCAMP_HOST = /^[a-z0-9-]+\.bandcamp\.com$/;

/** The recorded release behind an https Bandcamp link, ignoring query, hash and a trailing slash. */
export function bandcampRelease(url: URL): BandcampRelease | null {
  if (url.protocol !== 'https:' || !BANDCAMP_HOST.test(url.hostname)) return null;
  return BANDCAMP_RELEASES[`https://${url.hostname}${url.pathname.replace(/\/$/, '')}`] ?? null;
}
