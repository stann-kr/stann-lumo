/**
 * Beatport and Spotify pages for Stann Lumo's Bandcamp releases, checked on each store on 2026-11-16. A release shown on
 * the site keeps its Bandcamp link as the main one; these are listed beside it. EPs link to the release, compilation
 * tracks to the track. Add an entry with each new Bandcamp release that is also on a store.
 * "Unrest" (Chondrite) is on Bandcamp only.
 */
export interface StoreLink { platform: 'Beatport' | 'Spotify'; url: string }

const store = (beatport: string, spotify: string): StoreLink[] => [
  { platform: 'Beatport', url: `https://www.beatport.com/${beatport}` },
  { platform: 'Spotify', url: `https://open.spotify.com/${spotify}` },
];

export const STORE_LINKS: Readonly<Record<string, readonly StoreLink[]>> = {
  'https://ameniiarecords.bandcamp.com/album/frame-dragging': store('release/frame-dragging/5694193', 'album/5aZFxs4Wyy9oXcxidBxszt'),
  'https://ameniiarecords.bandcamp.com/album/astral-prologue': store('release/astral-prologue/4423962', 'album/6YUNwZdIL8xsH7sE9JIh5y'),
  'https://ameniiarecords.bandcamp.com/album/in-to-the-b': store('release/in-to-the-b/4050279', 'album/2chEpNSEcLwmcFgwiSgOB2'),
  'https://ameniiarecords.bandcamp.com/album/pole-position': store('release/pole-position/3257229', 'album/17UYyXE82pj0biM6NlytFg'),
  'https://ameniiarecords.bandcamp.com/track/stann-lumo-orbital-static-ascend': store('track/orbital-static-ascend/21994510', 'track/6p0FZIDpWjUWO2hB4GGCiw'),
  'https://ameniiarecords.bandcamp.com/track/conveyor-stann-lumo-remix': store('track/conveyor/18947672', 'track/2TYOcWMo3RTrpQFpZMV6Aq'),
  'https://ameniiarecords.bandcamp.com/track/beyond-neptune': store('track/beyond-neptune/18162766', 'track/6MontgjN9TpezqOal2VBFq'),
  'https://ameniiarecords.bandcamp.com/track/behemoth': store('track/behemoth/16136806', 'track/1NMeSGSLOmKoXK6jwAy00L'),
  'https://ameniiarecords.bandcamp.com/track/stann-lumo-concorso': store('track/concorso/13657739', 'track/28OX2TnOKKkTyLlVUgvVbp'),
};

/** Store pages recorded for a release link, matched without query, hash or trailing slash. */
export function trackStoreLinks(link?: string | null): readonly StoreLink[] {
  if (!link) return [];
  let url: URL;
  try { url = new URL(link); } catch { return []; }
  if (url.protocol !== 'https:') return [];
  return STORE_LINKS[`https://${url.hostname}${url.pathname.replace(/\/$/, '')}`] ?? [];
}
