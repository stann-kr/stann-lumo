import 'server-only';

import type { D1Database } from '@/lib/db';
import type {
  ArtistInfoItem,
  ContactItem,
  ContentLocale,
  DynamicSection,
  DynamicSectionType,
  HomeSection,
  LinkPlatform,
  PageMeta,
  PhilosophyItem,
  Track,
} from './content';
import { normalizeTrackMediaInput, trackMediaFields, TRACK_MEDIA_COLUMNS, TRACK_MEDIA_JOIN, type TrackMediaColumns } from './trackMedia';

interface ArtistInfoRow {
  id: string;
  key: string;
  value: string;
}

interface HomeSectionRow {
  title: string;
  description: string;
  path: string;
  icon: string;
}

type TrackRow = Track & TrackMediaColumns;

type LinkPlatformRow = LinkPlatform;

interface ContactInfoRow {
  label: string;
  value: string;
  icon: string;
}

interface AboutSectionRow {
  id: string;
  title: string;
  type: string;
  section_order: number;
}

interface AboutSectionParagraphRow {
  section_id: string;
  content: string;
  item_order: number;
}

interface AboutSectionPhilosophyItemRow {
  id: string;
  section_id: string;
  quote: string;
  description: string | null;
  item_order: number;
}

interface PageMetaRow {
  page: string;
  key: string;
  value: string;
}

export async function fetchArtistInfo(db: D1Database, lang: ContentLocale): Promise<ArtistInfoItem[]> {
  const result = await db.prepare(
    'SELECT * FROM artist_info WHERE lang = ? ORDER BY sort_order',
  ).bind(lang).all<ArtistInfoRow>();

  return result.results.map((row) => ({ id: row.id, key: row.key, value: row.value }));
}

export async function replaceArtistInfo(
  db: D1Database,
  lang: ContentLocale,
  items: ArtistInfoItem[],
): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM artist_info WHERE lang = ?').bind(lang),
    ...items.map((item, index) => db.prepare(
      'INSERT INTO artist_info (id, lang, key, value, sort_order) VALUES (?, ?, ?, ?, ?)',
    ).bind(item.id, lang, item.key, item.value, index)),
  ]);
}

export async function fetchHomeSections(db: D1Database, lang: ContentLocale): Promise<HomeSection[]> {
  const result = await db.prepare(
    'SELECT * FROM home_sections WHERE lang = ? ORDER BY sort_order',
  ).bind(lang).all<HomeSectionRow>();

  return result.results.map((row) => ({
    title: row.title,
    description: row.description,
    path: row.path,
    icon: row.icon,
  }));
}

export async function replaceHomeSections(
  db: D1Database,
  lang: ContentLocale,
  items: (HomeSection & { id?: string })[],
): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM home_sections WHERE lang = ?').bind(lang),
    ...items.map((item, index) => db.prepare(
      'INSERT INTO home_sections (id, lang, title, description, path, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(item.id ?? String(index + 1), lang, item.title, item.description, item.path, item.icon, index)),
  ]);
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
       ON CONFLICT(track_id) DO UPDATE SET tracklist = excluded.tracklist, recorded_on = excluded.recorded_on, updated_at = excluded.updated_at`,
    ).bind(track.id, media[index]!.tracklist, media[index]!.recordedOn)),
    db.prepare('DELETE FROM track_media WHERE track_id NOT IN (SELECT id FROM tracks)'),
  ]);

  return { removedCoverIds: orphanCovers.results.map((row) => row.cover_image_id) };
}

export async function fetchLinkPlatforms(
  db: D1Database,
  lang: ContentLocale,
): Promise<LinkPlatform[]> {
  const result = await db.prepare(
    'SELECT * FROM link_platforms WHERE lang = ? ORDER BY sort_order',
  ).bind(lang).all<LinkPlatformRow>();

  return result.results.map((row) => ({
    id: row.id,
    platform: row.platform,
    url: row.url,
    icon: row.icon,
    description: row.description,
  }));
}

export async function replaceLinkPlatforms(
  db: D1Database,
  lang: ContentLocale,
  items: LinkPlatform[],
): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM link_platforms WHERE lang = ?').bind(lang),
    ...items.map((item, index) => db.prepare(
      'INSERT INTO link_platforms (id, lang, platform, url, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(item.id, lang, item.platform, item.url, item.icon, item.description, index)),
  ]);
}

export async function fetchContactInfo(db: D1Database, lang: ContentLocale): Promise<ContactItem[]> {
  const result = await db.prepare(
    'SELECT * FROM contact_info WHERE lang = ? ORDER BY sort_order',
  ).bind(lang).all<ContactInfoRow>();

  return result.results.map((row) => ({ label: row.label, value: row.value, icon: row.icon }));
}

export async function replaceContactInfo(
  db: D1Database,
  lang: ContentLocale,
  items: (ContactItem & { id?: string })[],
): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM contact_info WHERE lang = ?').bind(lang),
    ...items.map((item, index) => db.prepare(
      'INSERT INTO contact_info (id, lang, label, value, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(item.id ?? String(index + 1), lang, item.label, item.value, item.icon, index)),
  ]);
}

function buildAboutSections(
  sections: AboutSectionRow[],
  paragraphs: AboutSectionParagraphRow[],
  philosophyItems: AboutSectionPhilosophyItemRow[],
): DynamicSection[] {
  return sections.map((section) => {
    const base = {
      id: section.id,
      title: section.title,
      type: section.type as DynamicSectionType,
      order: section.section_order,
    };

    if (section.type === 'philosophy-items') {
      const items: PhilosophyItem[] = philosophyItems
        .filter((row) => row.section_id === section.id)
        .sort((left, right) => left.item_order - right.item_order)
        .map((row) => ({ id: row.id, quote: row.quote, description: row.description ?? '' }));
      return { ...base, items };
    }

    const sectionParagraphs = paragraphs
      .filter((row) => row.section_id === section.id)
      .sort((left, right) => left.item_order - right.item_order)
      .map((row) => row.content);
    return { ...base, paragraphs: sectionParagraphs };
  });
}

export async function fetchAboutSections(
  db: D1Database,
  lang: ContentLocale,
): Promise<DynamicSection[]> {
  const [sectionsResult, paragraphsResult, philosophyResult] = await db.batch([
    db.prepare('SELECT * FROM about_sections WHERE lang = ? ORDER BY section_order').bind(lang),
    db.prepare('SELECT * FROM about_section_paragraphs WHERE lang = ? ORDER BY item_order').bind(lang),
    db.prepare('SELECT * FROM about_section_philosophy_items WHERE lang = ? ORDER BY item_order').bind(lang),
  ]);

  return buildAboutSections(
    sectionsResult.results as AboutSectionRow[],
    paragraphsResult.results as AboutSectionParagraphRow[],
    philosophyResult.results as AboutSectionPhilosophyItemRow[],
  );
}

export async function replaceAboutSections(
  db: D1Database,
  lang: ContentLocale,
  sections: DynamicSection[],
): Promise<void> {
  const insertSections = sections.map((section, index) => db.prepare(
    'INSERT INTO about_sections (id, lang, title, type, section_order) VALUES (?, ?, ?, ?, ?)',
  ).bind(section.id, lang, section.title, section.type, index));

  const insertParagraphs = sections.flatMap((section) => section.type === 'paragraphs'
    ? (section.paragraphs ?? []).map((paragraph, index) => db.prepare(
      'INSERT INTO about_section_paragraphs (id, section_id, lang, content, item_order) VALUES (?, ?, ?, ?, ?)',
    ).bind(`${section.id}-p-${index}`, section.id, lang, paragraph, index))
    : []);

  const insertPhilosophy = sections.flatMap((section) => section.type === 'philosophy-items'
    ? (section.items ?? []).map((item, index) => db.prepare(
      'INSERT INTO about_section_philosophy_items (id, section_id, lang, quote, description, item_order) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(item.id, section.id, lang, item.quote, item.description ?? '', index))
    : []);

  await db.batch([
    db.prepare('DELETE FROM about_sections WHERE lang = ?').bind(lang),
    db.prepare('DELETE FROM about_section_paragraphs WHERE lang = ?').bind(lang),
    db.prepare('DELETE FROM about_section_philosophy_items WHERE lang = ?').bind(lang),
    ...insertSections,
    ...insertParagraphs,
    ...insertPhilosophy,
  ]);
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
