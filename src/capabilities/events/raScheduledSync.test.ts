import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { D1Database } from '@/lib/db';
import { createSqliteD1 } from '@/test/sqliteD1';
import {
  parseRaEventsXml,
  syncRaEvents,
} from './raScheduledSync';
import { RA_SYNC_ANCHOR, RA_SYNC_CRON, RA_SYNC_INTERVAL_MS } from './raSync';
import { getRaSyncStatus } from './raSyncState';

const mocks = vi.hoisted(() => ({
  getRaApiConfigSecret: vi.fn(),
  fetchRaEventsXmlFromSource: vi.fn(),
}));

vi.mock('./raApiConfigSource', () => ({
  getRaApiConfigSecret: mocks.getRaApiConfigSecret,
}));
vi.mock('./raEventsSource', () => ({
  fetchRaEventsXmlFromSource: mocks.fetchRaEventsXmlFromSource,
}));

const secretConfig = {
  userId: 'user-fixture',
  apiKey: 'test-only-secret-never-return',
  djId: 'dj-fixture',
  option: '2' as const,
  year: '2026',
};

const eventXml = `<events>
  <event>
    <id>42</id><venueid>7</venueid><title>Night Shift</title>
    <eventdate>2026-09-20T00:00:00</eventdate><countryname>South Korea</countryname>
    <areaname>Seoul</areaname><areaId>13</areaId><venue>Fixture Club</venue>
    <address>Test-ro</address><lineup><![CDATA[<artist id="1">Lumo</artist>, Guest&nbsp;Name]]></lineup>
    <time>23:30 - 06:00</time><cost>20,000 KRW</cost><promoter>Fixture</promoter>
    <eventlink>https://ra.example/events/42</eventlink><venuelink>https://ra.example/clubs/7</venuelink>
    <hastickets>1</hastickets><hasbarcode>0</hasbarcode><promoterId>9</promoterId>
  </event>
  <event><id>42</id><title>Duplicate</title><eventdate>2026-09-20</eventdate><venue>Other</venue></event>
</events>`;

function insertPerformance(
  db: D1Database,
  { id, raEventId, posterImageId }: { id: string; raEventId?: string; posterImageId?: string },
) {
  return db.prepare(
    `INSERT INTO performances (id, date, venue, title, ra_event_id, poster_image_id, status)
     VALUES (?, '2026-09-20', 'Fixture Club', 'Existing event', ?, ?, 'Announced')`,
  ).bind(id, raEventId ?? null, posterImageId ?? null).run();
}

describe('scheduled RA sync', () => {
  const databases: Array<{ close: () => void }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRaApiConfigSecret.mockResolvedValue(secretConfig);
    mocks.fetchRaEventsXmlFromSource.mockResolvedValue({ kind: 'success', xml: eventXml });
  });

  afterEach(() => {
    databases.splice(0).forEach(({ close }) => close());
  });

  function database() {
    const fixture = createSqliteD1();
    databases.push(fixture);
    return fixture;
  }

  it('uses the daily cron tick only for the weekly Sunday 04:15 KST slots', async () => {
    const { db } = database();

    expect(RA_SYNC_CRON).toBe('15 19 * * *');
    expect(RA_SYNC_INTERVAL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    const anchorKst = new Date(RA_SYNC_ANCHOR + 9 * 60 * 60 * 1000);
    expect([anchorKst.getUTCDay(), anchorKst.getUTCHours(), anchorKst.getUTCMinutes()]).toEqual([0, 4, 15]);

    await expect(syncRaEvents(db, {
      mode: 'scheduled', now: RA_SYNC_ANCHOR - 24 * 60 * 60 * 1000,
    })).resolves.toEqual({ kind: 'not-due' });
    await expect(syncRaEvents(db, { mode: 'scheduled', now: RA_SYNC_ANCHOR })).resolves.toMatchObject({
      kind: 'success', fetched: 1, inserted: 1,
    });
    await expect(syncRaEvents(db, {
      mode: 'scheduled', now: RA_SYNC_ANCHOR + 24 * 60 * 60 * 1000,
    })).resolves.toEqual({ kind: 'not-due' });
    await expect(syncRaEvents(db, {
      mode: 'scheduled', now: RA_SYNC_ANCHOR + RA_SYNC_INTERVAL_MS,
    })).resolves.toMatchObject({ kind: 'success', fetched: 1, inserted: 0 });

    expect(mocks.fetchRaEventsXmlFromSource).toHaveBeenCalledTimes(2);
  });

  it('stores successful sync status and its next scheduled time', async () => {
    const { db, sqlite } = database();

    await expect(syncRaEvents(db, { mode: 'scheduled', now: RA_SYNC_ANCHOR })).resolves.toEqual({
      kind: 'success', fetched: 1, inserted: 1, skippedExcluded: 0,
    });

    await expect(getRaSyncStatus(db, RA_SYNC_ANCHOR)).resolves.toMatchObject({
      lastStatus: 'success',
      lastStartedAt: RA_SYNC_ANCHOR,
      lastCompletedAt: expect.any(Number),
      lastSuccessAt: expect.any(Number),
      lastErrorCode: null,
      fetched: 1,
      inserted: 1,
      skippedExcluded: 0,
      nextScheduledAt: RA_SYNC_ANCHOR + RA_SYNC_INTERVAL_MS,
      nextRetryAt: null,
    });
    expect(sqlite.prepare(
      'SELECT date, venue, location, time, title, lineup, ra_event_id, ra_lineup_raw FROM performances',
    ).get()).toEqual({
      date: '2026-09-20',
      venue: 'Fixture Club',
      location: 'Seoul',
      time: '23:30',
      title: 'Night Shift',
      lineup: 'Lumo, Guest Name',
      ra_event_id: '42',
      ra_lineup_raw: '<artist id="1">Lumo</artist>, Guest&nbsp;Name',
    });
    expect(sqlite.prepare('SELECT performances_revision FROM ra_sync_state WHERE id = 1').get())
      .toEqual({ performances_revision: 1 });
  });

  it('does not duplicate an existing RA event under another local id or replace its poster', async () => {
    const { db, sqlite } = database();
    await insertPerformance(db, { id: 'manual-ra-42', raEventId: '42', posterImageId: 'poster-kept' });

    await expect(syncRaEvents(db, { mode: 'scheduled', now: RA_SYNC_ANCHOR })).resolves.toEqual({
      kind: 'success', fetched: 1, inserted: 0, skippedExcluded: 0,
    });

    expect(sqlite.prepare(
      'SELECT id, ra_event_id, poster_image_id FROM performances ORDER BY id',
    ).all()).toEqual([{
      id: 'manual-ra-42', ra_event_id: '42', poster_image_id: 'poster-kept',
    }]);
  });

  it('does not re-import an explicitly excluded RA event', async () => {
    const { db, sqlite } = database();
    sqlite.prepare(
      `INSERT INTO ra_event_exclusions (ra_event_id, title, excluded_at) VALUES ('42', 'Removed event', ?)`,
    ).run(RA_SYNC_ANCHOR - 1);

    await expect(syncRaEvents(db, { mode: 'scheduled', now: RA_SYNC_ANCHOR })).resolves.toEqual({
      kind: 'success', fetched: 1, inserted: 0, skippedExcluded: 1,
    });
    expect(sqlite.prepare('SELECT * FROM performances').all()).toEqual([]);
  });

  it('keeps existing rows on failure and schedules at most three daily attempts with a safe error code', async () => {
    const { db, sqlite } = database();
    await insertPerformance(db, { id: 'manual-1' });
    mocks.fetchRaEventsXmlFromSource.mockResolvedValue({ kind: 'upstream-error', status: 503 });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const now = RA_SYNC_ANCHOR + (attempt - 1) * 24 * 60 * 60 * 1000;
      await expect(syncRaEvents(db, { mode: 'scheduled', now })).resolves.toEqual({
        kind: 'failed', errorCode: 'UPSTREAM_HTTP',
      });
      await expect(getRaSyncStatus(db, now)).resolves.toMatchObject({
        lastStatus: 'failed',
        lastErrorCode: 'UPSTREAM_HTTP',
        nextRetryAt: attempt < 3 ? now + 24 * 60 * 60 * 1000 : null,
      });
    }

    await expect(syncRaEvents(db, {
      mode: 'scheduled', now: RA_SYNC_ANCHOR + 3 * 24 * 60 * 60 * 1000,
    })).resolves.toEqual({ kind: 'not-due' });
    expect(mocks.fetchRaEventsXmlFromSource).toHaveBeenCalledTimes(3);
    expect(sqlite.prepare('SELECT id FROM performances').all()).toEqual([{ id: 'manual-1' }]);
    expect(JSON.stringify(sqlite.prepare('SELECT last_error_code FROM ra_sync_state').get()))
      .not.toContain(secretConfig.apiKey);
  });

  it('returns busy for an overlapping lease and for a manual request inside the cooldown', async () => {
    const { db } = database();
    let finishUpstream: ((value: { kind: 'success'; xml: string }) => void) | undefined;
    mocks.fetchRaEventsXmlFromSource.mockImplementationOnce(() => new Promise((resolve) => {
      finishUpstream = resolve;
    }));

    const first = syncRaEvents(db, { now: RA_SYNC_ANCHOR });
    await vi.waitFor(() => expect(mocks.fetchRaEventsXmlFromSource).toHaveBeenCalledOnce());
    await expect(syncRaEvents(db, { now: RA_SYNC_ANCHOR + 60_000 })).resolves.toEqual({ kind: 'busy' });
    finishUpstream?.({ kind: 'success', xml: eventXml });
    await expect(first).resolves.toMatchObject({ kind: 'success' });
    await expect(syncRaEvents(db, { now: RA_SYNC_ANCHOR + 1 })).resolves.toEqual({ kind: 'busy' });
  });

  it('records a missing RA configuration without contacting the upstream service', async () => {
    const { db } = database();
    mocks.getRaApiConfigSecret.mockResolvedValue(null);

    await expect(syncRaEvents(db, { mode: 'scheduled', now: RA_SYNC_ANCHOR })).resolves.toEqual({
      kind: 'not-configured',
    });
    await expect(getRaSyncStatus(db, RA_SYNC_ANCHOR)).resolves.toMatchObject({
      lastStatus: 'not-configured',
      lastErrorCode: 'NOT_CONFIGURED',
    });
    expect(mocks.fetchRaEventsXmlFromSource).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'a top-level error envelope',
      xml: '<error>upstream unavailable</error>',
      result: { kind: 'failed', errorCode: 'INVALID_RESPONSE' },
      status: 'failed',
      errorCode: 'INVALID_RESPONSE',
    },
    {
      label: 'an error envelope inside events',
      xml: '<events><error>upstream unavailable</error></events>',
      result: { kind: 'failed', errorCode: 'INVALID_RESPONSE' },
      status: 'failed',
      errorCode: 'INVALID_RESPONSE',
    },
    {
      label: 'a valid empty events response',
      xml: '<events/>',
      result: { kind: 'success', fetched: 0, inserted: 0, skippedExcluded: 0 },
      status: 'success',
      errorCode: null,
    },
  ])('treats $label without dropping existing rows', async ({ xml, result, status, errorCode }) => {
    const { db, sqlite } = database();
    await insertPerformance(db, { id: 'manual-1' });
    mocks.fetchRaEventsXmlFromSource.mockResolvedValue({ kind: 'success', xml });

    await expect(syncRaEvents(db, { mode: 'scheduled', now: RA_SYNC_ANCHOR })).resolves.toEqual(result);
    await expect(getRaSyncStatus(db, RA_SYNC_ANCHOR)).resolves.toMatchObject({
      lastStatus: status,
      lastErrorCode: errorCode,
    });
    expect(sqlite.prepare('SELECT id FROM performances').all()).toEqual([{ id: 'manual-1' }]);
  });

  it('recovers an expired scheduled lease on its next daily retry', async () => {
    const { db, sqlite } = database();
    await insertPerformance(db, { id: 'manual-1' });
    sqlite.prepare(`UPDATE ra_sync_state
      SET last_status = 'running', last_started_at = ?, scheduled_slot = ?, retry_attempts = 1,
          next_retry_at = ?, lease_token = 'expired-lease', lease_expires_at = ?
      WHERE id = 1`).run(
      RA_SYNC_ANCHOR,
      RA_SYNC_ANCHOR,
      RA_SYNC_ANCHOR + 24 * 60 * 60 * 1000,
      RA_SYNC_ANCHOR + 300_000,
    );

    await expect(syncRaEvents(db, {
      mode: 'scheduled', now: RA_SYNC_ANCHOR + 24 * 60 * 60 * 1000,
    })).resolves.toEqual({ kind: 'success', fetched: 1, inserted: 1, skippedExcluded: 0 });
    expect(sqlite.prepare('SELECT id FROM performances ORDER BY id').all()).toEqual([
      { id: 'manual-1' },
      { id: 'ra-42' },
    ]);
  });

  it('parses namespaced event XML without exposing parser diagnostics', () => {
    const xml = `<?xml version="1.0"?>
      <ra:events xmlns:ra="https://www.residentadvisor.net/">
        <ra:event><ra:id>42</ra:id><ra:title>Fixture</ra:title></ra:event>
      </ra:events>`;

    expect(parseRaEventsXml(xml)).toMatchObject([{ id: '42', title: 'Fixture' }]);
    expect(() => parseRaEventsXml('<events><event><id>secret-fixture</events>')).toThrow(
      'Invalid RA events XML',
    );
  });
});
