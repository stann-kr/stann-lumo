import type { MetadataRoute } from 'next';
import { getSitemapArchiveIds, getSitemapEventIds } from '@/capabilities/content/publicContent.server';
import { SITE_URL } from '@/capabilities/site/publicMetadata';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES = ['/', '/music', '/events', '/archive', '/contact', '/link', '/press-kit'];

/** A failed read leaves out only its own detail pages; the fixed pages are still worth listing. */
async function idsOrNone(read: () => Promise<string[]>): Promise<string[]> {
  try {
    return await read();
  } catch {
    return [];
  }
}

function detailUrls(base: string, ids: string[]): MetadataRoute.Sitemap {
  return ids.map((id) => ({ url: new URL(`${base}/${encodeURIComponent(id)}`, SITE_URL).toString() }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventIds, archiveIds] = await Promise.all([idsOrNone(getSitemapEventIds), idsOrNone(getSitemapArchiveIds)]);
  return [
    ...PUBLIC_PAGES.map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...detailUrls('/events', eventIds),
    ...detailUrls('/archive', archiveIds),
  ];
}
