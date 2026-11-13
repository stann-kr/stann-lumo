import { afterEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@/lib/db';
import { createSqliteD1 } from '@/test/sqliteD1';
import {
  fetchEventDetail,
  fetchPerformancesSnapshot,
  replacePerformancesAtRevision,
} from './eventsRepository.server';
import { performanceLocation, type Performance } from './events';

const manualPerformance: Performance = {
  id: 'manual-1',
  date: '2026-09-20',
  venue: 'Fixture Club',
  title: 'Manual event',
  status: 'Announced',
};

const raPerformance: Performance = {
  id: 'ra-42',
  date: '2026-09-21',
  venue: 'Fixture Club',
  title: 'RA event',
  raEventId: '42',
  status: 'Announced',
};

function insertPerformance(db: D1Database, performance: Performance) {
  return db.prepare(
    `INSERT INTO performances (id, date, venue, title, ra_event_id, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(
    performance.id,
    performance.date,
    performance.venue,
    performance.title,
    performance.raEventId ?? null,
    performance.status,
  ).run();
}

describe('performance revision replacement', () => {
  const databases: Array<{ close: () => void }> = [];

  afterEach(() => {
    databases.splice(0).forEach(({ close }) => close());
  });

  function database() {
    const fixture = createSqliteD1();
    databases.push(fixture);
    return fixture;
  }

  it('returns a coherent performance list and revision', async () => {
    const { db } = database();
    await insertPerformance(db, manualPerformance);

    await expect(fetchPerformancesSnapshot(db)).resolves.toMatchObject({
      items: [expect.objectContaining(manualPerformance)],
      revision: 1,
    });
  });

  it('records a deliberate RA deletion and returns the saved revision', async () => {
    const { db, sqlite } = database();
    const now = 1_789_000_000_000;
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(now);
    await insertPerformance(db, manualPerformance);
    await insertPerformance(db, raPerformance);
    const snapshot = await fetchPerformancesSnapshot(db);

    await expect(replacePerformancesAtRevision(db, [manualPerformance], snapshot.revision)).resolves.toMatchObject({
      kind: 'success',
      snapshot: {
        items: [expect.objectContaining(manualPerformance)],
        revision: 5,
      },
    });
    expect(sqlite.prepare(
      'SELECT ra_event_id, title FROM ra_event_exclusions WHERE ra_event_id = ?',
    ).get('42')).toEqual({ ra_event_id: '42', title: 'RA event' });
    expect(sqlite.prepare(
      'SELECT excluded_at FROM ra_event_exclusions WHERE ra_event_id = ?',
    ).get('42')).toEqual({ excluded_at: now });
    dateNow.mockRestore();
    expect(sqlite.prepare('SELECT edit_token FROM ra_sync_state WHERE id = 1').get()).toEqual({
      edit_token: null,
    });
  });

  it('gives the public event detail its RA country and only links the poster to an event that exists', async () => {
    const { db, sqlite } = database();
    sqlite.exec(`
      INSERT INTO performances (id, date, venue, title, status, location, ra_country_name, poster_image_id)
        VALUES ('ra-7', '2022-09-17', 'Faust', 'Night', 'Announced', 'All', 'South Korea', 'poster');
      INSERT INTO gallery_photos (id, filename, linked_event_id) VALUES ('poster', 'poster.jpg', 'ra-7');
    `);

    const detail = await fetchEventDetail(db, 'ra-7');
    expect(performanceLocation(detail!.event)).toBe('South Korea');
    expect(detail!.posterPhoto).toMatchObject({ id: 'poster', linkedEventId: 'ra-7' });

    sqlite.prepare("UPDATE gallery_photos SET linked_event_id = 'deleted-event' WHERE id = 'poster'").run();
    expect((await fetchEventDetail(db, 'ra-7'))!.posterPhoto?.linkedEventId).toBeUndefined();
  });

  it('rejects a stale admin snapshot without replacing a newly synced event', async () => {
    const { db, sqlite } = database();
    await insertPerformance(db, manualPerformance);
    const staleSnapshot = await fetchPerformancesSnapshot(db);
    await insertPerformance(db, raPerformance);

    await expect(
      replacePerformancesAtRevision(db, [manualPerformance], staleSnapshot.revision),
    ).resolves.toEqual({ kind: 'conflict' });
    await expect(fetchPerformancesSnapshot(db)).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining(manualPerformance),
        expect.objectContaining(raPerformance),
      ]),
      revision: 2,
    });
    expect(sqlite.prepare('SELECT * FROM ra_event_exclusions').all()).toEqual([]);
  });
});
