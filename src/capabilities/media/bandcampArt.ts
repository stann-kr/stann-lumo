/**
 * Artwork for Stann Lumo's Bandcamp releases, taken from each release page's og:image on 2026-11-11.
 * Bandcamp answers Cloudflare Workers with a bot check instead of the page, so the site cannot read og:image at request
 * time; the image host (f4.bcbits.com) does answer Workers. Add an entry with each new Bandcamp release, or upload a cover
 * in the admin, which takes precedence.
 */
export const BANDCAMP_ART: Readonly<Record<string, string>> = {
  'https://ameniiarecords.bandcamp.com/album/frame-dragging': 'https://f4.bcbits.com/img/a3040184544_5.jpg',
  'https://ameniiarecords.bandcamp.com/album/astral-prologue': 'https://f4.bcbits.com/img/a0890718297_5.jpg',
  'https://ameniiarecords.bandcamp.com/album/in-to-the-b': 'https://f4.bcbits.com/img/a3533710304_5.jpg',
  'https://ameniiarecords.bandcamp.com/album/pole-position': 'https://f4.bcbits.com/img/a1278742392_5.jpg',
};
