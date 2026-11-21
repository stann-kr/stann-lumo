import type { MetadataRoute } from 'next';
import {
  getSitemapArchiveIds, getSitemapContentUpdates, getSitemapEventIds, getSitemapTrackIds, type ContentUpdate,
} from '@/capabilities/content/publicContent.server';
import { SITE_URL } from '@/capabilities/site/publicMetadata';

export const dynamic = 'force-dynamic';

const PUBLIC_PAGES = ['/', '/music', '/events', '/archive', '/contact', '/link', '/press-kit'];

/** A failed read leaves out only its own part; the fixed pages are still worth listing. */
async function orNone<T>(read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch {
    return [];
  }
}

/** content_updates stores SQLite UTC text ('YYYY-MM-DD HH:MM:SS'). */
const toDate = (value: string) => new Date(`${value.replace(' ', 'T')}Z`);

/** Latest known change per page path. A page with no known change gets no <lastmod>, rather than a guessed one. */
function lastModifiedByPath(updates: ContentUpdate[]): Map<string, Date> {
  const latest = new Map<string, Date>();
  const touch = (path: string, date: Date) => {
    if (Number.isNaN(date.getTime())) return;
    const current = latest.get(path);
    if (!current || date > current) latest.set(path, date);
  };
  for (const { kind, id, updatedAt } of updates) {
    const date = toDate(updatedAt);
    // A track has one row per language ('<id>/<lang>') plus its shared media; its page shows all of them.
    const path = kind === 'event' ? `/events/${id}`
      : kind === 'photo' ? `/archive/${id}`
        : kind === 'track' ? `/music/${id.slice(0, id.lastIndexOf('/'))}`
          : kind === 'track_media' ? `/music/${id}` : null;
    if (!path) continue;
    touch(path, date);
    touch(path.slice(0, path.indexOf('/', 1)), date);
    touch('/', date);
  }
  return latest;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trackIds, eventIds, archiveIds, updates] = await Promise.all([
    orNone(getSitemapTrackIds), orNone(getSitemapEventIds), orNone(getSitemapArchiveIds), orNone(getSitemapContentUpdates),
  ]);
  const lastModified = lastModifiedByPath(updates);
  // Lookups use the raw id; the URL encodes it.
  const entry = (path: string, urlPath = path): MetadataRoute.Sitemap[number] => {
    const date = lastModified.get(path);
    return { url: new URL(urlPath, SITE_URL).toString(), ...(date && { lastModified: date }) };
  };
  const details = (base: string, ids: string[]) => ids.map((id) => entry(`${base}/${id}`, `${base}/${encodeURIComponent(id)}`));
  return [
    ...PUBLIC_PAGES.map((path) => entry(path)),
    ...details('/music', trackIds),
    ...details('/events', eventIds),
    ...details('/archive', archiveIds),
  ];
}
