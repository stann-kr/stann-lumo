import { describe, expect, it } from 'vitest';
import { STORE_LINKS, trackStoreLinks } from './storeLinks';

describe('trackStoreLinks', () => {
  it('finds recorded Beatport and Spotify pages for a Bandcamp release link', () => {
    expect(trackStoreLinks('https://ameniiarecords.bandcamp.com/album/frame-dragging/?from=x#t')).toEqual([
      { platform: 'Beatport', url: 'https://www.beatport.com/release/frame-dragging/5694193' },
      { platform: 'Spotify', url: 'https://open.spotify.com/album/5aZFxs4Wyy9oXcxidBxszt' },
    ]);
    for (const link of ['https://ameniiarecords.bandcamp.com/track/unrest', 'http://ameniiarecords.bandcamp.com/album/frame-dragging', 'https://soundcloud.com/stannlumo', 'nope', '', undefined, null]) {
      expect(trackStoreLinks(link)).toEqual([]);
    }
  });

  it('only records https store pages', () => {
    for (const links of Object.values(STORE_LINKS)) {
      for (const { url } of links) expect(url).toMatch(/^https:\/\/(www\.beatport\.com\/(release|track)|open\.spotify\.com\/(album|track))\/[\w-]+(\/\d+)?$/);
    }
  });
});
