import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSitemapEventIds } from '@/capabilities/content/publicContent.server';
import robots from './robots';
import sitemap from './sitemap';

const requestHeaders = vi.hoisted(() => ({ host: 'lumo.stann.kr' }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: requestHeaders.host }) }));
vi.mock('@/capabilities/content/publicContent.server', () => ({ getSitemapEventIds: vi.fn() }));

describe('robots.txt', () => {
  beforeEach(() => { requestHeaders.host = 'lumo.stann.kr'; });

  it('keeps the CMS and JSON APIs out of search but lets media and pages in', async () => {
    await expect(robots()).resolves.toEqual({
      rules: { userAgent: '*', allow: ['/', '/api/media/'], disallow: ['/admin', '/api/'] },
      sitemap: 'https://lumo.stann.kr/sitemap.xml',
    });
  });

  it('hides every preview host from search', async () => {
    requestHeaders.host = 'stann-lumo-dev.example.workers.dev';

    await expect(robots()).resolves.toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});

describe('sitemap.xml', () => {
  it('lists the public pages and every event page', async () => {
    vi.mocked(getSitemapEventIds).mockResolvedValue(['ra-2', 'ra 1']);

    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls).toContain('https://lumo.stann.kr/');
    expect(urls).toContain('https://lumo.stann.kr/archive');
    expect(urls.slice(-2)).toEqual(['https://lumo.stann.kr/events/ra-2', 'https://lumo.stann.kr/events/ra%201']);
  });

  it('still lists the fixed pages when the database is unavailable', async () => {
    vi.mocked(getSitemapEventIds).mockRejectedValue(new Error('test-only database failure'));

    await expect(sitemap()).resolves.toHaveLength(7);
  });
});
