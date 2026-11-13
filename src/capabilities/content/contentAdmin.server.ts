import 'server-only';

import type { D1Database } from '@/lib/db';
import type {
  ContentLocale,
  PageMeta,
  Track,
} from './content';
import { normalizeTrackMediaInput, trackMediaFields, TRACK_MEDIA_COLUMNS, TRACK_MEDIA_JOIN, type TrackMediaColumns } from './trackMedia';

type TrackRow = Track & TrackMediaColumns;

interface PageMetaRow {
  page: string;
  key: string;
  value: string;
}

export async function fetchTracks(db: D1Database, lang: ContentLocale): Promise<Track[]> {
  const result = await db.prepare(
    `SELECT t.*, ${TRACK_MEDIA_COLUMNS} FROM tracks t ${TRACK_MEDIA_JOIN} WHERE t.lang = ? ORDER BY t.sort_order`,
  ).bind(lang).all<TrackRow>();

  return result.results.map((row) => ({
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

/** Thrown when a track carries mix text that cannot be stored (tracklist too long, malformed date). */
export class TrackInputError extends Error {
  constructor() {
    super('Invalid track media input');
    this.name = 'TrackInputError';
  }
}

/**
 * Replaces one language's track list and stores each track's language-neutral mix text.
 * Mix text is shared by every language, so a field the request leaves out keeps its stored value
 * (a new track starts empty); an empty string clears it.
 * Cover images are kept; rows for ids that no longer exist in any language are removed and their
 * cover media ids are returned so the caller can delete the stored objects.
 */
export async function replaceTracks(
  db: D1Database,
  lang: ContentLocale,
  items: Track[],
): Promise<{ removedCoverIds: string[] }> {
  const media = items.map((track) => normalizeTrackMediaInput(track));
  if (media.some((entry) => entry === null)) throw new TrackInputError();
  const ids = JSON.stringify(items.map((track) => track.id));

  const orphanCovers = await db.prepare(
    `SELECT cover_image_id FROM track_media
     WHERE cover_image_id IS NOT NULL
       AND track_id NOT IN (SELECT value FROM json_each(?))
       AND track_id NOT IN (SELECT id FROM tracks WHERE lang != ?)`,
  ).bind(ids, lang).all<{ cover_image_id: string }>();

  await db.batch([
    db.prepare('DELETE FROM tracks WHERE lang = ?').bind(lang),
    ...items.map((track, index) => db.prepare(
      'INSERT INTO tracks (id, lang, title, type, duration, year, platform, link, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      track.id,
      lang,
      track.title,
      track.type,
      track.duration,
      track.year,
      track.platform,
      track.link,
      index,
    )),
    ...items.map((track, index) => db.prepare(
      `INSERT INTO track_media (track_id, tracklist, recorded_on, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(track_id) DO UPDATE SET tracklist = COALESCE(?, tracklist), recorded_on = COALESCE(?, recorded_on),
         updated_at = excluded.updated_at`,
    ).bind(
      track.id,
      media[index]!.tracklist,
      media[index]!.recordedOn,
      typeof track.tracklist === 'string' ? media[index]!.tracklist : null,
      typeof track.recordedOn === 'string' ? media[index]!.recordedOn : null,
    )),
    db.prepare('DELETE FROM track_media WHERE track_id NOT IN (SELECT id FROM tracks)'),
  ]);

  return { removedCoverIds: orphanCovers.results.map((row) => row.cover_image_id) };
}

function buildPageMeta(rows: PageMetaRow[]): PageMeta {
  const metadata: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!metadata[row.page]) metadata[row.page] = {};
    metadata[row.page][row.key] = row.value;
  }

  return {
    home: { navTitle: metadata.home?.navTitle ?? '' },
    music: { title: metadata.music?.title ?? '', subtitle: metadata.music?.subtitle ?? '' },
    events: {
      title: metadata.events?.title ?? '',
      subtitle: metadata.events?.subtitle ?? '',
      upcomingTitle: metadata.events?.upcomingTitle ?? '',
      pastTitle: metadata.events?.pastTitle ?? '',
    },
    contact: {
      title: metadata.contact?.title ?? '',
      subtitle: metadata.contact?.subtitle ?? '',
      guestbookTitle: metadata.contact?.guestbookTitle ?? '',
      directTitle: metadata.contact?.directTitle ?? '',
      bookingTitle: metadata.contact?.bookingTitle ?? '',
    },
    link: {
      title: metadata.link?.title ?? '',
      subtitle: metadata.link?.subtitle ?? '',
      terminalTitle: metadata.link?.terminalTitle ?? '',
    },
  };
}

function flattenPageMeta(pageMeta: PageMeta) {
  const metadataEntries: Array<[string, Record<string, string>]> = [
    ['home', pageMeta.home as unknown as Record<string, string>],
    ['music', pageMeta.music as unknown as Record<string, string>],
    ['events', pageMeta.events as unknown as Record<string, string>],
    ['contact', pageMeta.contact as unknown as Record<string, string>],
    ['link', pageMeta.link as unknown as Record<string, string>],
  ];

  return metadataEntries.flatMap(([page, values]) => Object.entries(values).map(([key, value]) => ({
    page,
    key,
    value,
  })));
}

export async function fetchPageMeta(db: D1Database, lang: ContentLocale): Promise<PageMeta> {
  const result = await db.prepare(
    'SELECT * FROM page_meta WHERE lang = ?',
  ).bind(lang).all<PageMetaRow>();
  return buildPageMeta(result.results);
}

export async function replacePageMeta(
  db: D1Database,
  lang: ContentLocale,
  pageMeta: PageMeta,
): Promise<void> {
  const rows = flattenPageMeta(pageMeta);
  await db.batch([
    db.prepare('DELETE FROM page_meta WHERE lang = ?').bind(lang),
    ...rows.map((row) => db.prepare(
      'INSERT INTO page_meta (page, lang, key, value) VALUES (?, ?, ?, ?)',
    ).bind(row.page, lang, row.key, row.value)),
  ]);
}
