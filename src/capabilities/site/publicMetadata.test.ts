import { describe, expect, it } from 'vitest';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';

describe('createPublicMetadata', () => {
  it('provides a canonical URL and social metadata for the requested public route', () => {
    const metadata = createPublicMetadata({
      title: 'Night Signal',
      description: 'A STANN LUMO performance archive item.',
      path: '/events/night-signal',
    });

    expect(metadata.alternates).toEqual({ canonical: '/events/night-signal' });
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'STANN LUMO',
      title: 'Night Signal | STANN LUMO',
      url: 'https://lumo.stann.kr/events/night-signal',
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: 'Night Signal | STANN LUMO' });
  });

  it('falls back to the default share card when the route has no image of its own', () => {
    const metadata = createPublicMetadata({ title: 'Music', description: 'Mixes and releases', path: '/music' });

    expect(metadata.openGraph).toMatchObject({ images: [{ url: '/og.jpg', width: 1200, height: 630 }] });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', images: [{ url: '/og.jpg' }] });
  });

  it('does not repeat the site name for the home page share title', () => {
    const metadata = createPublicMetadata({ title: 'STANN LUMO', description: 'TECHNO / SEOUL', path: '/' });

    expect(metadata.title).toEqual({ absolute: 'STANN LUMO' });
    expect(metadata.openGraph).toMatchObject({ title: 'STANN LUMO' });
    expect(metadata.twitter).toMatchObject({ title: 'STANN LUMO' });
  });

  it('uses a large share card when the route has its own image', () => {
    const metadata = createPublicMetadata({
      title: 'nacht', description: '2026-09-25 · Faust', path: '/events/ra-1',
      image: { url: '/api/media/poster?v=2', alt: 'nacht poster' },
    });

    expect(metadata.openGraph).toMatchObject({ images: [{ url: '/api/media/poster?v=2', alt: 'nacht poster' }] });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', images: [{ url: '/api/media/poster?v=2', alt: 'nacht poster' }] });
  });
});

