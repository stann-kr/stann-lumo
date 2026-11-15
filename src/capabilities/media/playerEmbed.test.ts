import { describe, expect, it } from 'vitest';
import { playerEmbed } from './playerEmbed';

describe('playerEmbed', () => {
  it('maps real SoundCloud and YouTube mix links to privacy-friendly embeds', () => {
    const soundcloud = playerEmbed('https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025?si=abc');
    expect(soundcloud).toMatchObject({ provider: 'soundcloud', shape: 'screen' });
    expect(new URL(soundcloud!.src).searchParams.get('url')).toBe('https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025');
    expect(playerEmbed('https://www.youtube.com/live/cVK15qBeSHU?si=IjTSXK06iSacyKXH')).toEqual({ provider: 'youtube', shape: 'screen', src: 'https://www.youtube-nocookie.com/embed/cVK15qBeSHU?autoplay=1&rel=0' });
    expect(playerEmbed('https://youtu.be/3ruhGQjoels')?.src).toContain('/embed/3ruhGQjoels');
    expect(playerEmbed('https://www.youtube.com/watch?v=QPMX9Y4XHDY')?.src).toContain('/embed/QPMX9Y4XHDY');
  });

  it('plays recorded Bandcamp albums and tracks in the Bandcamp player', () => {
    expect(playerEmbed('https://ameniiarecords.bandcamp.com/album/frame-dragging/')).toEqual({
      provider: 'bandcamp', shape: 'strip',
      src: 'https://bandcamp.com/EmbeddedPlayer/album=2961344320/size=large/bgcol=000000/linkcol=e03c31/tracklist=false/artwork=small/transparent=true/',
    });
    expect(playerEmbed('https://ameniiarecords.bandcamp.com/track/beyond-neptune?from=x')?.src).toContain('/track=405012664/');
  });

  it('keeps everything else as an outbound link', () => {
    for (const link of ['https://ameniiarecords.bandcamp.com/album/unrecorded', 'http://ameniiarecords.bandcamp.com/album/frame-dragging',
      'https://soundcloud.com/stannlumo', 'http://soundcloud.com/a/b', 'https://www.youtube.com/live/short',
      'https://evil.example/youtube.com/live/cVK15qBeSHU', 'not a url', '', undefined, null]) {
      expect(playerEmbed(link)).toBeNull();
    }
  });
});
