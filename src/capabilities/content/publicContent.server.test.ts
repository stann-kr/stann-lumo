import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database, D1PreparedStatement } from '@/lib/db';
import { getDB } from '@/lib/db';
import { assertPublicPayloadSafe } from '@/lib/security/publicPayload';
import { getArchiveDetail, getArchivePhotos, getArchivePage, getContactProjection, getEventDetail, getEventsProjection, getEventsPage, getHomeProjection, getLinkProjection, getMusicProjection, getPublicShellProjection, hasUpcomingDate } from './publicContent.server';
import { sortArchivePhotos } from '@/capabilities/media/archiveBrowsing';
import { performanceLocation, performanceToday } from '@/capabilities/events/events';
import { GET as archiveGET } from '@/app/api/archive/route';
import { GET as eventsGET } from '@/app/api/events/route';
import { createSqliteD1 } from '@/test/sqliteD1';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));

interface RecordedStatement extends D1PreparedStatement {
  readonly sql: string;
  readonly bindings: unknown[];
}

function createPublicDatabase() {
  const prepared: RecordedStatement[] = [];
  const database = {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      const statement = {
        sql,
        get bindings() { return bindings; },
        bind(...values: unknown[]) { bindings = values; return statement; },
        async all() {
          if (sql.includes('FROM artist_info')) return { results: [{ id: 'artist-1', key: 'Name', value: 'STANN LUMO' }], success: true, meta: {} };
          if (sql.includes('FROM page_meta')) return { results: [{ page: 'home', key: 'navTitle', value: 'ARCHIVE INDEX' }], success: true, meta: {} };
          if (sql.includes('FROM tracks')) return { results: [{ id: 'track', title: 'Track', type: 'Original', year: '2026' }], success: true, meta: {} };
          if (sql.includes('FROM home_sections')) return { results: [{ title: 'MUSIC', description: 'Releases', path: '/music', icon: 'ri-music-2-line' }], success: true, meta: {} };
          if (sql.includes('FROM link_platforms')) return { results: [{ platform: 'SoundCloud' }], success: true, meta: {} };
          if (sql.includes('FROM terminal_custom_fields')) return { results: [], success: true, meta: {} };
          if (sql.includes('FROM gallery_photos')) return { results: [], success: true, meta: {} };
          return { results: [], success: true, meta: {} };
        },
        async first() {
          if (sql.includes('FROM site_config')) return { terminal_url: 'https://terminal.example.test', terminal_description: 'Live surface', terminal_font_size: 'md', terminal_animation_speed: 'normal', terminal_prompt_text: '>', terminal_show_embed: 0, terminal_embed_height: '400px' };
          return null;
        },
      } as unknown as RecordedStatement;
      prepared.push(statement);
      return statement;
    },
  } as unknown as D1Database;
  return { database, prepared };
}

describe('public server content projections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends only bounded archive pages with the same order as detail navigation', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      for (let i = 0; i < 11; i++) {
        sqlite.prepare('INSERT INTO performances (id, date, venue, title) VALUES (?, ?, ?, ?)').run(`e${i}`, `2020.01.${String(i + 1).padStart(2, '0')}`, 'Venue', 'Event');
        sqlite.prepare('INSERT INTO gallery_photos (id, filename, linked_event_id) VALUES (?, ?, ?)').run(`p${i}`, `${i}.jpg`, `e${i}`);
      }
      const all = await getArchivePhotos();
      for (const sort of ['newest', 'oldest', 'random'] as const) {
        const ids: string[] = [];
        let offset: number | null = 0;
        while (offset !== null) {
          const result = await getArchivePage({ sort, seed: 42 }, offset);
          expect(result.items.length).toBeLessThanOrEqual(4);
          expect(result.total).toBe(11);
          expect(() => assertPublicPayloadSafe(result)).not.toThrow();
          ids.push(...result.items.map(item => item.id));
          offset = result.nextOffset;
        }
        expect(ids).toEqual(sortArchivePhotos(all, sort, 42).map(item => item.id));
      }
      expect(await getArchivePage({ sort: 'newest', seed: 1 }, 999)).toEqual({ items: [], total: 11, nextOffset: null });
      const response = await archiveGET(new Request('http://localhost/api/archive?offset=4'));
      expect(response.status).toBe(200);
      expect((await response.json()).data.items).toHaveLength(4);
    } finally { close(); }
  });

  it('loads event counts without embedding the full list and pages each schedule independently', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      for (let i = 1; i <= 7; i++) {
        for (const year of [2000, 2999]) sqlite.prepare('INSERT INTO performances (id, date, venue, title, lineup) VALUES (?, ?, ?, ?, ?)').run(`${year}-${i}`, `${year}.01.0${i}`, 'Venue', `Event ${i}`, 'Detailed lineup');
      }
      const projection = await getEventsProjection('en');
      expect(projection.schedule).toMatchObject({ upcoming: 7, past: 7 });
      expect(projection).not.toHaveProperty('performances');
      const first = await getEventsPage('upcoming', projection.schedule.today, 0);
      const next = await getEventsPage('upcoming', projection.schedule.today, first.nextOffset!);
      expect([...first.items, ...next.items].map(item => item.id)).toEqual(Array.from({ length: 7 }, (_, i) => `2999-${i + 1}`));
      expect(first.items[0]).not.toHaveProperty('lineup');
      expect((await getEventsPage('past', projection.schedule.today, 0)).items.map(item => item.id)).toEqual(['2000-7', '2000-6', '2000-5', '2000-4']);
      expect(next.nextOffset).toBeNull();
      expect(() => assertPublicPayloadSafe(first)).not.toThrow();
    } finally { close(); }
  });

  it('rejects invalid paging parameters before querying and reports unavailable data as an error', async () => {
    for (const offset of ['-1', 'NaN', '1.5', '9007199254740992']) {
      expect((await archiveGET(new Request(`http://localhost/api/archive?offset=${offset}`))).status).toBe(400);
      expect((await eventsGET(new Request(`http://localhost/api/events?section=past&today=2026-09-10&offset=${offset}`))).status).toBe(400);
    }
    expect((await eventsGET(new Request('http://localhost/api/events?section=all&today=bad&offset=0'))).status).toBe(400);
    expect(getDB).not.toHaveBeenCalled();
    vi.mocked(getDB).mockReturnValue(null);
    expect((await archiveGET(new Request('http://localhost/api/archive?offset=0'))).status).toBe(500);
    expect((await eventsGET(new Request('http://localhost/api/events?section=past&today=2026-09-10&offset=0'))).status).toBe(500);
  });

  it('loads a single requested locale projection and never queries administrator credentials', async () => {
    const { database, prepared } = createPublicDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    const projection = await getHomeProjection('ko');
    const shell = await getPublicShellProjection('ko');
    expect(shell).toEqual({ artistName: 'STANN LUMO' });

    expect(projection.artistInfo).toContainEqual(expect.objectContaining({ value: 'STANN LUMO' }));
    // Artist, About, Contact and Link copy now comes from code (siteContent.ts), not D1.
    expect(projection.previews.platforms).toEqual(['Instagram', 'SoundCloud']);
    expect(prepared.some((statement) => /artist_info|home_sections|link_platforms|site_config/.test(statement.sql))).toBe(false);
    expect(prepared.some((statement) => /ra_api_config|admin_password|token/i.test(statement.sql))).toBe(false);
    expect(prepared.filter((statement) => statement.sql.includes('lang = ?')).every((statement) => statement.bindings[0] === 'ko')).toBe(true);
    expect(() => assertPublicPayloadSafe(projection)).not.toThrow();
  });

  it('serves Contact and Link from code without touching the database', async () => {
    vi.mocked(getDB).mockReturnValue(null);
    const contact = await getContactProjection('en');
    const link = await getLinkProjection('ko');
    expect(contact.contactInfo).toEqual([{ label: 'Email', value: 'contact@stann.kr', icon: 'ri-mail-line' }]);
    expect(contact.eventsInfo.setDurations).toHaveLength(2);
    expect(link.linkPlatforms.map((item) => item.platform)).toEqual(['Instagram', 'SoundCloud']);
    expect(link.terminalInfo.url).toBe('https://terminal.stann.kr');
    expect((await getPublicShellProjection('en')).artistName).toBe('STANN LUMO');
    expect(getDB).not.toHaveBeenCalled();
    for (const projection of [contact, link]) expect(() => assertPublicPayloadSafe(projection)).not.toThrow();
  });

  it('lights the menu NEXT lamp only for a date still ahead that is not cancelled, and stays off when the read fails', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    const today = performanceToday().replaceAll('-', '.');
    const insert = sqlite.prepare('INSERT INTO performances (id, date, venue, title, status) VALUES (?, ?, ?, ?, ?)');
    try {
      insert.run('past', '2020.01.01', 'Venue', 'Past', 'Announced');
      expect(await hasUpcomingDate()).toBe(false);
      insert.run('cancelled', today, 'Venue', 'Cancelled', 'Cancelled');
      expect(await hasUpcomingDate()).toBe(false);
      insert.run('tonight', `${today} 23:00`, 'Venue', 'Tonight', 'Announced');
      expect(await hasUpcomingDate()).toBe(true);
    } finally {
      close();
    }

    vi.mocked(getDB).mockReturnValue(null);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await hasUpcomingDate()).toBe(false);
      expect(log).toHaveBeenCalledOnce();
    } finally {
      log.mockRestore();
    }
  });

  it('returns null for a missing archive id without exposing a client fetch fallback', async () => {
    const { database, prepared } = createPublicDatabase();
    vi.mocked(getDB).mockReturnValue(database);

    await expect(getArchiveDetail('missing-item')).resolves.toBeNull();
    expect(prepared.some((statement) => /ra_api_config|admin_password|token/i.test(statement.sql))).toBe(false);
  });

  it('fails into the public route error boundary when the public database is unavailable', async () => {
    vi.mocked(getDB).mockReturnValue(null);

    await expect(getMusicProjection('en')).rejects.toThrow('Public content is unavailable');
  });

  it('projects the linked event date without dropping unlinked archive media', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      sqlite.exec(`
        INSERT INTO performances (id, date, venue, title) VALUES ('event', '2021-04-10', 'Venue', 'Event');
        INSERT INTO gallery_photos (id, filename, linked_event_id) VALUES ('flyer', 'flyer.jpg', 'event');
        INSERT INTO gallery_photos (id, filename) VALUES ('photo', 'photo.jpg');
      `);
      const result = await getArchivePhotos();
      expect(result).toHaveLength(2);
      expect(result.find(photo => photo.id === 'flyer')).toMatchObject({ eventDate: '2021-04-10', linkedEventId: 'event' });
      expect(result.find(photo => photo.id === 'photo')).not.toHaveProperty('eventDate');
      expect(() => assertPublicPayloadSafe(result)).not.toThrow();
    } finally {
      close();
    }
  });
  it('drops an archive link to a deleted event everywhere the public site emits one', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      sqlite.exec(`
        INSERT INTO performances (id, date, venue, title, poster_image_id) VALUES ('kept', '2021-04-10', 'Venue', 'Kept', 'poster');
        INSERT INTO gallery_photos (id, filename, sort_order, linked_event_id) VALUES ('poster', 'poster.jpg', 0, 'kept');
        INSERT INTO gallery_photos (id, filename, sort_order, linked_event_id) VALUES ('orphan', 'orphan.jpg', 1, 'deleted');
      `);
      const orphanOf = (photos: { id: string }[]) => photos.find(photo => photo.id === 'orphan');
      const legacy = await (await archiveGET(new Request('http://localhost/api/archive'))).json();
      const emitted = [
        orphanOf(await getArchivePhotos()),
        orphanOf((await getArchivePage({ sort: 'newest', seed: 1 }, 0)).items),
        (await getArchiveDetail('orphan'))?.photo,
        orphanOf(legacy.data.photos),
      ];
      for (const photo of emitted) {
        expect(photo).toMatchObject({ id: 'orphan' });
        expect(photo).not.toHaveProperty('linkedEventId');
        expect(photo).not.toHaveProperty('eventDate');
      }
      await expect(getEventDetail('deleted')).resolves.toBeNull();
      // Links to events that still exist are untouched.
      expect((await getArchivePhotos()).find(photo => photo.id === 'poster')).toMatchObject({ linkedEventId: 'kept', eventDate: '2021-04-10' });
      expect((await getEventDetail('kept'))?.posterPhoto).toMatchObject({ id: 'poster', linkedEventId: 'kept' });
    } finally { close(); }
  });

  it('carries the RA country so an area-wide ("All") RA event keeps a visible place', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      sqlite.exec(`
        INSERT INTO performances (id, date, venue, title, location, ra_country_name) VALUES ('past-ra', '2022-09-17', 'Faust', 'Night', 'All', 'South Korea');
        INSERT INTO performances (id, date, venue, title, location, ra_country_name) VALUES ('next-ra', '2999-01-01', 'Faust', 'Future', 'All', 'South Korea');
      `);
      const today = performanceToday();
      const past = await getEventsPage('past', today, 0);
      const upcoming = await getEventsPage('upcoming', today, 0);
      const detail = await getEventDetail('past-ra');
      const home = await getHomeProjection('en');
      const shown = [past.items[0], upcoming.items[0], detail?.event, home.previews.events[0], home.previews.pastEvents[0]];
      for (const event of shown) expect(performanceLocation(event!)).toBe('South Korea');
      for (const payload of [past, upcoming, detail, home]) expect(() => assertPublicPayloadSafe(payload)).not.toThrow();
    } finally { close(); }
  });

  it('bounds home previews and uses the existing English fallback without leaking unused fields', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    try {
      for (let index = 0; index < 5; index++) {
        sqlite.prepare("INSERT INTO tracks (id, lang, title, type, duration, year, platform, sort_order) VALUES (?, 'en', ?, 'Original', '0:00', '2026', 'Bandcamp', ?)").run(`track-${index}`, `Track ${index}`, index);
        sqlite.prepare("INSERT INTO performances (id, title, date, venue) VALUES (?, ?, ?, 'Venue')").run(`event-${index}`, `Event ${index}`, index === 0 ? '2000-01-01' : `2999.09.0${index}`);
        sqlite.prepare("INSERT INTO gallery_photos (id, filename, caption, sort_order) VALUES (?, ?, ?, ?)").run(`photo-${index}`, `photo-${index}.jpg`, `Photo ${index}`, index);
      }
      const { previews } = await getHomeProjection('ko');
      expect(previews.tracks.map((track) => track.id)).toEqual(['track-0', 'track-1', 'track-2', 'track-3', 'track-4']);
      // v5 home: the next three dates, and the latest past dates for the empty-schedule state.
      expect(previews.events.map((event) => event.id)).toEqual(['event-1', 'event-2', 'event-3']);
      expect(previews.pastEvents.map((event) => event.id)).toEqual(['event-0']);
      expect(previews.photos.map((photo) => photo.id)).toEqual(['photo-0', 'photo-1', 'photo-2', 'photo-3']);
      expect(previews.tracks[0]).toEqual({ id: 'track-0', title: 'Track 0', type: 'Original', year: '2026', platform: 'Bandcamp', link: '', duration: '0:00' });
      // Mix media reaches the home card (cover, recording date, first track for the mobile mix plate); the full tracklist stays on /music.
      sqlite.prepare("INSERT INTO track_media (track_id, tracklist, recorded_on, cover_image_id) VALUES ('track-1', 'A\nB', '2026-10-31', 'cover-1')").run();
      const withMedia = await getHomeProjection('en');
      expect(withMedia.previews.tracks[1]).toEqual({ id: 'track-1', title: 'Track 1', type: 'Original', year: '2026', platform: 'Bandcamp', link: '', duration: '0:00', recordedOn: '2026-10-31', coverImageId: 'cover-1', firstTrack: 'A' });
      expect(previews.photos[0]).toEqual({ id: 'photo-0', caption: 'Photo 0', altText: '' });
      // Only names reach the home; URLs stay on the Link page.
      expect(previews.platforms).toEqual(['Instagram', 'SoundCloud']);
      expect(() => assertPublicPayloadSafe(previews)).not.toThrow();
    } finally { close(); }
  });

});
