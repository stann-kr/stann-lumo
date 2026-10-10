import type { MetadataRoute } from 'next';
import { getSitemapEventIds } from '@/capabilities/content/publicContent.server';
import { SITE_URL } from '@/capabilities/site/publicMetadata';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES = ['/', '/about', '/music', '/events', '/archive', '/contact', '/link'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let eventIds: string[] = [];
  try {
    eventIds = await getSitemapEventIds();
  } catch {
    // The fixed pages are still worth listing while the database is unavailable.
  }
  return [
    ...PUBLIC_PAGES.map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...eventIds.map((id) => ({ url: new URL(`/events/${encodeURIComponent(id)}`, SITE_URL).toString() })),
  ];
}
