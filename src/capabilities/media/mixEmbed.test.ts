import { describe, expect, it } from 'vitest';
import { mixEmbed } from './mixEmbed';

describe('mixEmbed', () => {
  it('maps real SoundCloud and YouTube mix links to privacy-friendly embeds', () => {
    const soundcloud = mixEmbed('https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025?si=abc');
    expect(soundcloud?.provider).toBe('soundcloud');
    expect(new URL(soundcloud!.src).searchParams.get('url')).toBe('https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025');
    expect(mixEmbed('https://www.youtube.com/live/cVK15qBeSHU?si=IjTSXK06iSacyKXH')).toEqual({ provider: 'youtube', src: 'https://www.youtube-nocookie.com/embed/cVK15qBeSHU?autoplay=1&rel=0' });
    expect(mixEmbed('https://youtu.be/3ruhGQjoels')?.src).toContain('/embed/3ruhGQjoels');
    expect(mixEmbed('https://www.youtube.com/watch?v=QPMX9Y4XHDY')?.src).toContain('/embed/QPMX9Y4XHDY');
  });

  it('keeps everything else as an outbound link', () => {
    for (const link of ['https://ameniiarecords.bandcamp.com/album/frame-dragging', 'https://soundcloud.com/stannlumo', 'http://soundcloud.com/a/b',
      'https://www.youtube.com/live/short', 'https://evil.example/youtube.com/live/cVK15qBeSHU', 'not a url', '']) {
      expect(mixEmbed(link)).toBeNull();
    }
  });
});
