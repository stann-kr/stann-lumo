import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';
import { getDB, type D1Database } from '@/lib/db';
import { assertPublicPayloadSafe } from '@/lib/security/publicPayload';
import type {
  ArtistInfoItem,
  ContactItem,
  DynamicSection,
  HomePreviews,
  HomeEventPreview,
  LinkPlatform,
  PageMeta,
  Track,
} from './content';
import type { EventsInfo, Performance } from '@/capabilities/events/events';
import type { GalleryPhoto } from '@/capabilities/media/media';
import { sortArchivePhotos, type ArchiveBrowseState } from '@/capabilities/media/archiveBrowsing';
import { performanceToday } from '@/capabilities/events/events';
import { PUBLIC_BATCH_SIZE, type PublicPage } from './publicPagination';
import type { TerminalInfo } from '@/capabilities/terminal/terminalConfig';
import { SITE_ABOUT_SECTIONS, SITE_ARTIST_INFO, SITE_BOOKING_INFO, SITE_CONTACT_INFO, SITE_CONTACT_META, SITE_LINK_META, SITE_LINK_PLATFORMS, SITE_TERMINAL_INFO } from './siteContent';
import { SITE_NAME } from '@/constants/site';
import { trackMediaFields, TRACK_MEDIA_COLUMNS, TRACK_MEDIA_JOIN, type TrackMediaColumns } from './trackMedia';

export type PublicLocale = 'en' | 'ko';

const LANGUAGE_COOKIE = 'stann_lumo_language';

export async function getRequestLocale(): Promise<PublicLocale> {
  const cookieStore = await cookies();
  return cookieStore.get(LANGUAGE_COOKIE)?.value === 'ko' ? 'ko' : 'en';
}

interface PageMetaRow {
  page: string;
  key: string;
  value: string;
}

interface TrackRow extends TrackMediaColumns {
  id: string;
  title: string;
  type: string;
  duration: string;
  year: string;
  platform: string;
  link: string;
}

interface PerformanceRow {
  id: string;
  date: string;
  venue: string;
  location: string | null;
  time: string | null;
  title: string;
  lineup: string | null;
  ra_event_link: string | null;
  ra_event_id: string | null;
  poster_image_id: string | null;
  status: string;
}

interface GalleryPhotoRow {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  caption: string;
  sort_order: number;
  created_at: string;
  media_type: string;
  focal_x: number | null;
  focal_y: number | null;
  video_youtube_id: string | null;
  video_thumbnail_url: string | null;
  linked_event_id: string | null;
  event_date?: string | null;
}

function getPublicDB(): D1Database {
  const db = getDB();
  if (!db) throw new Error('Public content is unavailable');
  return db;
}

async function rows<T>(db: D1Database, sql: string, ...params: unknown[]): Promise<T[]> {
  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const result = await statement.all<T>();
  return result.results;
}

async function localizedRows<T>(db: D1Database, sql: string, locale: PublicLocale): Promise<T[]> {
  const primary = await rows<T>(db, sql, locale);
  if (locale === 'ko' && primary.length === 0) return rows<T>(db, sql, 'en');
  return primary;
}

async function localizedMetaRows(db: D1Database, locale: PublicLocale): Promise<PageMetaRow[]> {
  const primary = await rows<PageMetaRow>(db, 'SELECT page, key, value FROM page_meta WHERE lang = ?', locale);
  if (locale === 'ko' && primary.length === 0) {
    return rows<PageMetaRow>(db, 'SELECT page, key, value FROM page_meta WHERE lang = ?', 'en');
  }
  return primary;
}

function mapTracks(rowsToMap: TrackRow[]): Track[] {
  return rowsToMap.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    duration: row.duration,
    year: row.year,
    platform: row.platform,
    link: row.link,
    ...trackMediaFields(row),
  }));
}

function mapPerformances(rowsToMap: PerformanceRow[]): Performance[] {
  return rowsToMap.map((row) => ({
    id: row.id,
    date: row.date,
    venue: row.venue,
    ...(row.location !== null && { location: row.location }),
    ...(row.time !== null && { time: row.time }),
    title: row.title,
    ...(row.lineup !== null && { lineup: row.lineup }),
    ...(row.ra_event_link !== null && { raEventLink: row.ra_event_link }),
    ...(row.ra_event_id !== null && { raEventId: row.ra_event_id }),
    ...(row.poster_image_id !== null && { posterImageId: row.poster_image_id }),
    status: row.status as Performance['status'],
  }));
}

function mapGalleryPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    altText: row.alt_text,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    mediaType: row.media_type as GalleryPhoto['mediaType'],
    focalX: row.focal_x ?? 50,
    focalY: row.focal_y ?? 50,
    ...(row.video_youtube_id !== null && { videoYoutubeId: row.video_youtube_id }),
    ...(row.video_thumbnail_url !== null && { videoThumbnailUrl: row.video_thumbnail_url }),
    ...(row.linked_event_id !== null && { linkedEventId: row.linked_event_id }),
    ...(row.event_date != null && { eventDate: row.event_date }),
  };
}

function buildPageMeta(rowsToMap: PageMetaRow[]): PageMeta {
  const values = new Map(rowsToMap.map((row) => [`${row.page}:${row.key}`, row.value]));
  return {
    home: { navTitle: values.get('home:navTitle') ?? '' },
    music: {
      title: values.get('music:title') ?? '',
      subtitle: values.get('music:subtitle') ?? '',
    },
    events: {
      title: values.get('events:title') ?? '',
      subtitle: values.get('events:subtitle') ?? '',
      upcomingTitle: values.get('events:upcomingTitle') ?? '',
      pastTitle: values.get('events:pastTitle') ?? '',
    },
    contact: {
      title: values.get('contact:title') ?? '',
      subtitle: values.get('contact:subtitle') ?? '',
      guestbookTitle: values.get('contact:guestbookTitle') ?? '',
      directTitle: values.get('contact:directTitle') ?? '',
      bookingTitle: values.get('contact:bookingTitle') ?? '',
    },
    link: {
      title: values.get('link:title') ?? '',
      subtitle: values.get('link:subtitle') ?? '',
      terminalTitle: values.get('link:terminalTitle') ?? '',
    },
  };
}

export interface PublicShellProjection {
  artistName: string;
}

export const getPublicShellProjection = cache(async (locale: PublicLocale): Promise<PublicShellProjection> => {
  void locale;
  const projection = { artistName: SITE_ARTIST_INFO.find((item) => item.key === 'Name')?.value ?? SITE_NAME };
  assertPublicPayloadSafe(projection);
  return projection;
});

interface HomePerformanceRow {
  id: string; title: string; date: string; venue: string; status: string; poster_image_id: string | null;
  time: string | null; location: string | null; ra_event_link: string | null; ra_has_tickets: number | string | null;
}

const HOME_EVENT_COLUMNS = 'id, title, date, venue, status, poster_image_id, time, location, ra_event_link, ra_has_tickets';

function mapHomeEvent(row: HomePerformanceRow): HomeEventPreview {
  return {
    id: row.id, title: row.title, date: row.date, venue: row.venue, status: row.status as Performance['status'],
    ...(row.poster_image_id && { posterImageId: row.poster_image_id }),
    ...(row.time && { time: row.time }),
    ...(row.location && { location: row.location }),
    ...(row.ra_event_link && { raEventLink: row.ra_event_link }),
    raHasTickets: Number(row.ra_has_tickets) === 1,
  };
}

export interface HomeProjection {
  previews: HomePreviews;
  artistInfo: ArtistInfoItem[];
}

export const getHomeProjection = cache(async (locale: PublicLocale): Promise<HomeProjection> => {
  const db = getPublicDB();

  const today = performanceToday();
  const [trackRows, eventRows, pastRows, photoRows] = await Promise.all([
    localizedRows<TrackRow>(db, `SELECT t.id, t.title, t.type, t.year, t.platform, t.link, t.duration, m.recorded_on AS recorded_on, m.cover_image_id AS cover_image_id
      FROM tracks t ${TRACK_MEDIA_JOIN} WHERE t.lang = ? ORDER BY t.sort_order LIMIT 8`, locale),
    rows<HomePerformanceRow>(db, `SELECT ${HOME_EVENT_COLUMNS} FROM performances WHERE status != 'Cancelled' AND SUBSTR(REPLACE(date, '.', '-'), 1, 10) >= ? ORDER BY REPLACE(date, '.', '-') ASC, sort_order LIMIT 3`, today),
    rows<HomePerformanceRow>(db, `SELECT ${HOME_EVENT_COLUMNS} FROM performances WHERE SUBSTR(REPLACE(date, '.', '-'), 1, 10) < ? ORDER BY REPLACE(date, '.', '-') DESC, sort_order LIMIT 3`, today),
    rows<GalleryPhotoRow>(db, "SELECT id, caption, alt_text FROM gallery_photos WHERE media_type = 'image' ORDER BY sort_order ASC, created_at DESC LIMIT 4"),
  ]);
  const projection = {
    artistInfo: SITE_ARTIST_INFO,
    previews: {
      tracks: trackRows.map(({ id, title, type, year, platform, link, duration, recorded_on, cover_image_id }) => ({
        id, title, type, year, platform, link, duration: duration ?? '', ...trackMediaFields({ recorded_on, cover_image_id }),
      })),
      events: eventRows.map(mapHomeEvent),
      pastEvents: pastRows.map(mapHomeEvent),
      photos: photoRows.map(({ id, caption, alt_text }) => ({ id, caption, altText: alt_text })),
      platforms: SITE_LINK_PLATFORMS.slice(0, 4).map(({ platform }) => platform),
    },
  };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface AboutProjection {
  artistInfo: ArtistInfoItem[];
  aboutSections: DynamicSection[];
}

export const getAboutProjection = cache(async (locale: PublicLocale): Promise<AboutProjection> => {
  void locale;
  const projection = { artistInfo: SITE_ARTIST_INFO, aboutSections: SITE_ABOUT_SECTIONS };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface MusicProjection {
  pageMeta: Pick<PageMeta, 'music'>;
  tracks: Track[];
}

export const getMusicProjection = cache(async (locale: PublicLocale): Promise<MusicProjection> => {
  const db = getPublicDB();
  const [metaRows, trackRows] = await Promise.all([
    localizedMetaRows(db, locale),
    localizedRows<TrackRow>(db, `SELECT t.id, t.title, t.type, t.duration, t.year, t.platform, t.link, ${TRACK_MEDIA_COLUMNS}
      FROM tracks t ${TRACK_MEDIA_JOIN} WHERE t.lang = ? ORDER BY t.sort_order`, locale),
  ]);
  const projection = { pageMeta: { music: buildPageMeta(metaRows).music }, tracks: mapTracks(trackRows) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface EventsProjection {
  pageMeta: Pick<PageMeta, 'events'>;
  schedule: { today: string; upcoming: number; past: number };
}

export const getEventsProjection = cache(async (locale: PublicLocale): Promise<EventsProjection> => {
  const db = getPublicDB();
  const today = performanceToday();
  const [metaRows, counts] = await Promise.all([
    localizedMetaRows(db, locale),
    db.prepare(`SELECT COUNT(CASE WHEN SUBSTR(REPLACE(date, '.', '-'), 1, 10) >= ? THEN 1 END) AS upcoming,
      COUNT(CASE WHEN SUBSTR(REPLACE(date, '.', '-'), 1, 10) < ? THEN 1 END) AS past FROM performances`).bind(today, today).first<{ upcoming: number; past: number }>(),
  ]);
  const projection = { pageMeta: { events: buildPageMeta(metaRows).events }, schedule: { today, upcoming: counts?.upcoming ?? 0, past: counts?.past ?? 0 } };
  assertPublicPayloadSafe(projection);
  return projection;
});

export async function getEventsPage(section: 'upcoming' | 'past', today: string, offset: number): Promise<PublicPage<Performance>> {
  const db = getPublicDB();
  const condition = `SUBSTR(REPLACE(date, '.', '-'), 1, 10) ${section === 'upcoming' ? '>=' : '<'} ?`;
  const [count, records] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS total FROM performances WHERE ${condition}`).bind(today).first<{ total: number }>(),
    rows<PerformanceRow>(db, `SELECT id, date, venue, location, time, title, status, poster_image_id,
      NULL AS lineup, NULL AS ra_event_link, NULL AS ra_event_id FROM performances WHERE ${condition}
      ORDER BY SUBSTR(REPLACE(date, '.', '-'), 1, 10) ${section === 'upcoming' ? 'ASC' : 'DESC'}, sort_order, id LIMIT ? OFFSET ?`, today, PUBLIC_BATCH_SIZE, offset),
  ]);
  const total = count?.total ?? 0;
  const items = mapPerformances(records);
  const page = { items, total, nextOffset: offset + items.length < total ? offset + items.length : null };
  assertPublicPayloadSafe(page);
  return page;
}

export interface ContactProjection {
  pageMeta: Pick<PageMeta, 'contact'>;
  contactInfo: ContactItem[];
  eventsInfo: EventsInfo;
}

export const getContactProjection = cache(async (locale: PublicLocale): Promise<ContactProjection> => {
  void locale;
  const projection = { pageMeta: { contact: SITE_CONTACT_META }, contactInfo: SITE_CONTACT_INFO, eventsInfo: SITE_BOOKING_INFO };
  assertPublicPayloadSafe(projection);
  return projection;
});

export interface LinkProjection {
  pageMeta: Pick<PageMeta, 'link'>;
  linkPlatforms: LinkPlatform[];
  terminalInfo: TerminalInfo;
}

export const getLinkProjection = cache(async (locale: PublicLocale): Promise<LinkProjection> => {
  void locale;
  const projection = { pageMeta: { link: SITE_LINK_META }, linkPlatforms: SITE_LINK_PLATFORMS, terminalInfo: SITE_TERMINAL_INFO };
  assertPublicPayloadSafe(projection);
  return projection;
});

export const getArchivePhotos = cache(async (): Promise<GalleryPhoto[]> => {
  const db = getPublicDB();
  const photoRows = await rows<GalleryPhotoRow>(db,
    `SELECT g.*, p.date AS event_date FROM gallery_photos g
     LEFT JOIN performances p ON p.id = g.linked_event_id
     ORDER BY g.sort_order ASC, g.created_at DESC, g.id`);
  const photos = photoRows.map(mapGalleryPhoto);
  assertPublicPayloadSafe(photos);
  return photos;
});

export const getArchiveCount = cache(async (): Promise<number> => {
  const count = await getPublicDB().prepare('SELECT COUNT(*) AS total FROM gallery_photos').first<{ total: number }>();
  return count?.total ?? 0;
});

export async function getArchivePage(browse: Pick<ArchiveBrowseState, 'sort' | 'seed'>, offset: number, limit = PUBLIC_BATCH_SIZE): Promise<PublicPage<GalleryPhoto>> {
  const db = getPublicDB();
  // Only ordering keys are read for the seeded shuffle; full records are fetched for this batch alone.
  const index = await rows<Pick<GalleryPhoto, 'id' | 'sortOrder' | 'createdAt' | 'eventDate'>>(db,
    `SELECT g.id, g.sort_order AS sortOrder, g.created_at AS createdAt, p.date AS eventDate FROM gallery_photos g
     LEFT JOIN performances p ON p.id = g.linked_event_id ORDER BY g.sort_order ASC, g.created_at DESC, g.id`);
  const selected = sortArchivePhotos(index, browse.sort, browse.seed).slice(offset, offset + limit);
  const records = selected.length ? await rows<GalleryPhotoRow>(db,
    `SELECT g.*, p.date AS event_date FROM gallery_photos g LEFT JOIN performances p ON p.id = g.linked_event_id
     WHERE g.id IN (${selected.map(() => '?').join(',')})`, ...selected.map(item => item.id)) : [];
  const byId = new Map(records.map(row => [row.id, mapGalleryPhoto(row)]));
  const items = selected.flatMap(item => { const photo = byId.get(item.id); return photo ? [photo] : []; });
  const nextOffset = offset + selected.length;
  const page = { items, total: index.length, nextOffset: nextOffset < index.length ? nextOffset : null };
  assertPublicPayloadSafe(page);
  return page;
}

export async function getSitemapEventIds(): Promise<string[]> {
  const records = await rows<{ id: string }>(getPublicDB(),
    "SELECT id FROM performances ORDER BY SUBSTR(REPLACE(date, '.', '-'), 1, 10) DESC, id");
  return records.map(({ id }) => id);
}

export const getEventDetail = cache(async (id: string): Promise<{ event: Performance; posterPhoto?: GalleryPhoto } | null> => {
  const db = getPublicDB();
  const eventRow = await db.prepare('SELECT * FROM performances WHERE id = ?').bind(id).first<PerformanceRow>();
  if (!eventRow) return null;
  const event = mapPerformances([eventRow])[0];
  const posterPhoto = eventRow.poster_image_id
    ? await db.prepare('SELECT * FROM gallery_photos WHERE id = ?').bind(eventRow.poster_image_id).first<GalleryPhotoRow>()
    : null;
  const projection = { event, ...(posterPhoto && { posterPhoto: mapGalleryPhoto(posterPhoto) }) };
  assertPublicPayloadSafe(projection);
  return projection;
});

export const getArchiveDetail = cache(async (id: string): Promise<{ photo: GalleryPhoto; previous: GalleryPhoto | null; next: GalleryPhoto | null } | null> => {
  const photos = await getArchivePhotos();
  const index = photos.findIndex((photo) => photo.id === id);
  if (index === -1) return null;
  const projection = {
    photo: photos[index],
    previous: photos[index - 1] ?? null,
    next: photos[index + 1] ?? null,
  };
  assertPublicPayloadSafe(projection);
  return projection;
});

/** The outbound link of a public track, used only to look up its platform artwork. */
export async function getTrackLink(id: string): Promise<string | null> {
  const row = await getPublicDB().prepare('SELECT link FROM tracks WHERE id = ? LIMIT 1').bind(id).first<{ link: string | null }>();
  return row?.link ?? null;
}
