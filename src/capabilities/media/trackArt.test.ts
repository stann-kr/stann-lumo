import { describe, expect, it, vi } from 'vitest';
import { trackArtSource, trackCoverUrl } from './trackArt';
import { fetchTrackArt } from './trackArt.server';

const image = (type = 'image/jpeg', status = 200) => new Response(new Uint8Array([1, 2, 3]), { status, headers: { 'content-type': type } });

describe('trackArtSource', () => {
  it('finds artwork sources for SoundCloud pages, Bandcamp releases and YouTube videos only', () => {
    expect(trackArtSource('https://www.youtube.com/live/3ruhGQjoels?si=x')).toEqual({ provider: 'youtube', videoId: '3ruhGQjoels' });
    expect(trackArtSource('https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025?si=a')).toEqual({ provider: 'soundcloud', url: 'https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025' });
    expect(trackArtSource('https://soundcloud.com/stannlumo')).toEqual({ provider: 'soundcloud', url: 'https://soundcloud.com/stannlumo' });
    expect(trackArtSource('https://ameniiarecords.bandcamp.com/album/frame-dragging?from=x')).toEqual({ provider: 'bandcamp', url: 'https://ameniiarecords.bandcamp.com/album/frame-dragging' });
    for (const link of ['https://ameniiarecords.bandcamp.com/', 'https://bandcamp.com/album/x', 'https://a.bandcamp.com.evil.example/album/x', 'http://a.bandcamp.com/album/x', 'http://soundcloud.com/a/b', 'https://evil.example/soundcloud.com/a', 'https://soundcloud.com/', 'nope', '', undefined]) {
      expect(trackArtSource(link)).toBeNull();
    }
  });

  it('prefers the uploaded cover, then platform art, then nothing', () => {
    expect(trackCoverUrl({ id: 't1', link: 'https://youtu.be/3ruhGQjoels', coverImageId: 'gallery/x' })).toBe('/api/media/gallery%2Fx?v=2&w=640');
    expect(trackCoverUrl({ id: 't 1', link: 'https://youtu.be/3ruhGQjoels' })).toBe('/api/track-art/t%201?w=640');
    expect(trackCoverUrl({ id: 't1', link: 'https://example.bandcamp.com/album/x' })).toBe('/api/track-art/t1?w=640');
    expect(trackCoverUrl({ id: 't1', link: 'https://example.com/x' })).toBeUndefined();
  });
});

describe('fetchTrackArt', () => {
  it('falls back from the maxres YouTube frame to hq', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(image('image/jpeg', 404))
      .mockResolvedValueOnce(image());
    const art = await fetchTrackArt({ provider: 'youtube', videoId: '3ruhGQjoels' }, fetcher);
    expect(art?.contentType).toBe('image/jpeg');
    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual([
      'https://i.ytimg.com/vi/3ruhGQjoels/maxresdefault.jpg', 'https://i.ytimg.com/vi/3ruhGQjoels/hqdefault.jpg',
    ]);
  });

  it('reads SoundCloud oEmbed and only follows artwork on sndcdn', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ thumbnail_url: 'https://i1.sndcdn.com/artworks-x-t500x500.jpg' }))
      .mockResolvedValueOnce(image('image/png'));
    expect((await fetchTrackArt({ provider: 'soundcloud', url: 'https://soundcloud.com/a/b' }, fetcher))?.contentType).toBe('image/png');
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('url')).toBe('https://soundcloud.com/a/b');

    const hostile = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ thumbnail_url: 'https://evil.example/x.jpg' }));
    expect(await fetchTrackArt({ provider: 'soundcloud', url: 'https://soundcloud.com/a/b' }, hostile)).toBeNull();
    expect(hostile).toHaveBeenCalledTimes(1);
  });

  it('reads only the head of a Bandcamp page for its bcbits og:image', async () => {
    const page = (html: string) => new Response(`<html><head>${html}</head><body>${'x'.repeat(200_000)}</body></html>`, { headers: { 'content-type': 'text/html' } });
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(page('<meta property="og:image" content="https://f4.bcbits.com/img/a1_5.jpg">'))
      .mockResolvedValueOnce(image());
    expect((await fetchTrackArt({ provider: 'bandcamp', url: 'https://a.bandcamp.com/album/x' }, fetcher))?.contentType).toBe('image/jpeg');
    expect(String(fetcher.mock.calls[1][0])).toBe('https://f4.bcbits.com/img/a1_5.jpg');

    const hostile = vi.fn<typeof fetch>().mockResolvedValueOnce(page('<meta property="og:image" content="https://evil.example/a.jpg">'));
    expect(await fetchTrackArt({ provider: 'bandcamp', url: 'https://a.bandcamp.com/album/x' }, hostile)).toBeNull();
    expect(hostile).toHaveBeenCalledTimes(1);
  });

  it('does not follow image redirects, using the only non-follow mode Workers accept', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://evil.example/x.jpg' } }));
    expect(await fetchTrackArt({ provider: 'youtube', videoId: '3ruhGQjoels' }, fetcher)).toBeNull();
    expect(fetcher.mock.calls.every(([, init]) => init?.redirect === 'manual')).toBe(true);
  });

  it('returns nothing for non-images and upstream failures', async () => {
    expect(await fetchTrackArt({ provider: 'youtube', videoId: '3ruhGQjoels' }, vi.fn<typeof fetch>().mockResolvedValue(image('text/html')))).toBeNull();
    expect(await fetchTrackArt({ provider: 'youtube', videoId: '3ruhGQjoels' }, vi.fn<typeof fetch>().mockRejectedValue(new Error('down')))).toBeNull();
  });
});
