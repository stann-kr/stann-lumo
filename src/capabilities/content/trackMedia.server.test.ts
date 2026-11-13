import { describe, expect, it, vi } from 'vitest';
import type { R2Bucket } from '@/lib/db';
import { getDB } from '@/lib/db';
import { createSqliteD1 } from '@/test/sqliteD1';
import { fetchTracks, replaceTracks, replaceTracksFromBase, TrackInputError } from './contentAdmin.server';
import { fetchContentBundle } from './contentBundle.server';
import { getArchivePhotos, getMusicProjection } from './publicContent.server';
import { deleteTrackCover, MediaLifecycleError, replaceTrackCover } from '@/capabilities/media/mediaLifecycle.server';
import { normalizeTrackMediaInput, tracklistLines, MAX_TRACKLIST_LENGTH } from './trackMedia';
import type { Track } from './content';

vi.mock('@/lib/db', () => ({ getDB: vi.fn() }));

const base: Track = { id: 'mix-1', title: 'Faust Closing', type: 'DJ Mix', duration: '1:58:00', year: '2026', platform: 'SoundCloud', link: 'https://soundcloud.com/stannlumo/x' };

function bucket() {
  const r2 = { put: vi.fn(async (key: string) => ({ key, size: 0 })), delete: vi.fn(async () => undefined) } as unknown as R2Bucket;
  return { r2, put: vi.mocked(r2.put), remove: vi.mocked(r2.delete) };
}

const image = () => new File(['fixture'], 'cover.webp', { type: 'image/webp' });

describe('track media (tracklist, recording date, cover)', () => {
  it('stores mix text once for every language and keeps covers across list saves', async () => {
    const { db, sqlite, close } = createSqliteD1();
    vi.mocked(getDB).mockReturnValue(db);
    const { r2 } = bucket();
    try {
      await replaceTracks(db, 'en', [{ ...base, tracklist: 'A — One\r\nB — Two\n', recordedOn: '2026-10-31' }, { ...base, id: 'mix-2', title: 'Plain' }]);
      const { coverImageId } = await replaceTrackCover(db, r2, 'mix-1', image());

      // Saving again without the cover field must not drop the uploaded cover.
      await replaceTracks(db, 'en', [{ ...base, tracklist: 'A — One\nB — Two', recordedOn: '2026-10-31' }, { ...base, id: 'mix-2', title: 'Plain' }]);
      const [mix, plain] = await fetchTracks(db, 'en');
      expect(mix).toMatchObject({ tracklist: 'A — One\nB — Two', recordedOn: '2026-10-31', coverImageId });
      expect(plain).not.toHaveProperty('tracklist');
      expect(plain).not.toHaveProperty('coverImageId');

      // Korean falls back to the English rows and shares the same media.
      const ko = await getMusicProjection('ko');
      expect(ko.tracks[0]).toMatchObject({ id: 'mix-1', coverImageId, recordedOn: '2026-10-31' });

      // Covers never become archive items.
      expect(await getArchivePhotos()).toHaveLength(0);
      expect(sqlite.prepare('SELECT COUNT(*) AS n FROM gallery_photos').get()).toEqual({ n: 0 });
    } finally { close(); }
  });

  it('removes media only when the track id is gone from every language and returns its cover for cleanup', async () => {
    const { db, sqlite, close } = createSqliteD1();
    const { r2 } = bucket();
    try {
      await replaceTracks(db, 'en', [{ ...base, tracklist: 'x' }]);
      await replaceTracks(db, 'ko', [{ ...base, tracklist: 'x' }]);
      const { coverImageId } = await replaceTrackCover(db, r2, 'mix-1', image());

      expect(await replaceTracks(db, 'en', [])).toEqual({ removedCoverIds: [] });
      expect(sqlite.prepare('SELECT COUNT(*) AS n FROM track_media').get()).toEqual({ n: 1 });

      expect(await replaceTracks(db, 'ko', [])).toEqual({ removedCoverIds: [coverImageId] });
      expect(sqlite.prepare('SELECT COUNT(*) AS n FROM track_media').get()).toEqual({ n: 0 });
    } finally { close(); }
  });

  it('keeps shared mix text that a save in another language leaves out, and clears it only when sent empty', async () => {
    const { db, close } = createSqliteD1();
    try {
      await replaceTracks(db, 'en', [{ ...base, tracklist: 'A — One', recordedOn: '2026-10-31' }]);
      // The Korean list is saved from a copy that does not carry the shared fields.
      await replaceTracks(db, 'ko', [{ ...base, title: '포스트 클로징' }]);
      expect((await fetchTracks(db, 'en'))[0]).toMatchObject({ tracklist: 'A — One', recordedOn: '2026-10-31' });
      expect((await fetchTracks(db, 'ko'))[0]).toMatchObject({ title: '포스트 클로징', tracklist: 'A — One', recordedOn: '2026-10-31' });

      await replaceTracks(db, 'ko', [{ ...base, title: '포스트 클로징', tracklist: '', recordedOn: '' }]);
      const [en] = await fetchTracks(db, 'en');
      expect(en).not.toHaveProperty('tracklist');
      expect(en).not.toHaveProperty('recordedOn');
    } finally { close(); }
  });

  it('rejects malformed mix input before writing anything', async () => {
    const { db, sqlite, close } = createSqliteD1();
    try {
      await replaceTracks(db, 'en', [base]);
      await expect(replaceTracks(db, 'en', [{ ...base, recordedOn: '31/10/2026' }])).rejects.toBeInstanceOf(TrackInputError);
      await expect(replaceTracks(db, 'en', [{ ...base, tracklist: 'x'.repeat(MAX_TRACKLIST_LENGTH + 1) }])).rejects.toBeInstanceOf(TrackInputError);
      expect(sqlite.prepare('SELECT COUNT(*) AS n FROM tracks').get()).toEqual({ n: 1 });
    } finally { close(); }
  });

  it('replaces and removes covers in R2 and refuses tracks that are not saved yet', async () => {
    const { db, close } = createSqliteD1();
    const { r2, put, remove } = bucket();
    try {
      await expect(replaceTrackCover(db, r2, 'missing', image())).rejects.toEqual(new MediaLifecycleError('TRACK_NOT_FOUND'));
      expect(put).not.toHaveBeenCalled();

      await replaceTracks(db, 'en', [base]);
      const first = await replaceTrackCover(db, r2, 'mix-1', image());
      const second = await replaceTrackCover(db, r2, 'mix-1', image());
      expect(put.mock.calls.map(([key]) => key)).toEqual([`gallery/${first.coverImageId}`, `gallery/${second.coverImageId}`]);
      expect(remove).toHaveBeenCalledWith(`gallery/${first.coverImageId}`);

      await deleteTrackCover(db, r2, 'mix-1');
      expect(remove).toHaveBeenLastCalledWith(`gallery/${second.coverImageId}`);
      expect((await fetchTracks(db, 'en'))[0]).not.toHaveProperty('coverImageId');
    } finally { close(); }
  });

  it('refuses a save edited from a list that changed since, keeping the tracks and covers added elsewhere', async () => {
    const { db, sqlite, close } = createSqliteD1();
    const { r2 } = bucket();
    try {
      await replaceTracks(db, 'en', [base]);
      const staleTab = (await fetchContentBundle(db, 'en')).tracks;
      // Another tab adds a mix on top and gives it a cover.
      const otherTab = (await fetchContentBundle(db, 'en')).tracks;
      expect(await replaceTracksFromBase(db, 'en', otherTab, [{ ...base, id: 'mix-2', title: 'New Mix' }, ...otherTab]))
        .toMatchObject({ kind: 'success', removedCoverIds: [] });
      const { coverImageId } = await replaceTrackCover(db, r2, 'mix-2', image());

      expect(await replaceTracksFromBase(db, 'en', staleTab, [{ ...base, title: 'Renamed' }])).toEqual({ kind: 'conflict' });
      expect((await fetchTracks(db, 'en')).map(({ id, title, coverImageId: cover }) => ({ id, title, cover })))
        .toEqual([{ id: 'mix-2', title: 'New Mix', cover: coverImageId }, { id: 'mix-1', title: 'Faust Closing', cover: undefined }]);
      expect(sqlite.prepare('SELECT cover_image_id FROM track_media WHERE track_id = ?').get('mix-2')).toEqual({ cover_image_id: coverImageId });
    } finally { close(); }
  });

  it('accepts the list the content API serves, including a Korean list that falls back to the English rows', async () => {
    const { db, close } = createSqliteD1();
    const { r2 } = bucket();
    try {
      await replaceTracks(db, 'en', [{ ...base, tracklist: 'A — One', recordedOn: '2026-10-31' }, { ...base, id: 'mix-2', title: 'Plain' }]);
      await replaceTrackCover(db, r2, 'mix-1', image());
      const ko = (await fetchContentBundle(db, 'ko')).tracks;
      expect(ko.map((track) => track.id)).toEqual(['mix-1', 'mix-2']);

      const result = await replaceTracksFromBase(db, 'ko', ko, ko.map((track) => ({ ...track, title: `${track.title} KO` })));
      expect(result).toMatchObject({ kind: 'success' });
      expect((await fetchTracks(db, 'ko')).map((track) => track.title)).toEqual(['Faust Closing KO', 'Plain KO']);
      // The English list is untouched, so a save from what the English page loaded still goes through.
      const en = (await fetchContentBundle(db, 'en')).tracks;
      expect(await replaceTracksFromBase(db, 'en', en, en)).toMatchObject({ kind: 'success' });
    } finally { close(); }
  });

  it('compares mix text as it is stored and ignores covers, which the list save does not write', async () => {
    const { db, close } = createSqliteD1();
    const { r2 } = bucket();
    try {
      // The editor keeps what was typed; the server stores it trimmed with LF line breaks.
      const typed = { ...base, tracklist: '  A — One\r\nB — Two\n', recordedOn: ' 2026-10-31 ' };
      await replaceTracks(db, 'en', [typed]);
      await replaceTrackCover(db, r2, 'mix-1', image());
      expect(await replaceTracksFromBase(db, 'en', [typed], [{ ...typed, title: 'Next' }])).toMatchObject({ kind: 'success' });

      // Every field the save writes still counts.
      const saved = { ...typed, title: 'Next' };
      for (const stale of [typed, { ...saved, tracklist: 'A — One' }, { ...saved, recordedOn: '' }, { ...saved, id: 'mix-9' }]) {
        expect(await replaceTracksFromBase(db, 'en', [stale], [base])).toEqual({ kind: 'conflict' });
      }
      expect(await replaceTracksFromBase(db, 'en', [saved, saved], [base])).toEqual({ kind: 'conflict' });
      expect((await fetchTracks(db, 'en'))[0]).toMatchObject({ title: 'Next', tracklist: 'A — One\nB — Two', recordedOn: '2026-10-31' });
    } finally { close(); }
  });

  it('returns both lists after a save, so an English save moves a Korean list that falls back to English', async () => {
    const { db, close } = createSqliteD1();
    try {
      await replaceTracks(db, 'en', [base]);
      const koBefore = (await fetchContentBundle(db, 'ko')).tracks;
      const saved = await replaceTracksFromBase(db, 'en', [base], [{ ...base, id: 'mix-2', title: 'New Mix' }, base]);
      if (saved.kind !== 'success') throw new Error('expected the English save to succeed');
      expect(saved.tracks).toEqual({ en: (await fetchContentBundle(db, 'en')).tracks, ko: (await fetchContentBundle(db, 'ko')).tracks });
      expect(saved.tracks.ko.map((track) => track.id)).toEqual(['mix-2', 'mix-1']);

      // The Korean copy loaded before the English save is stale; the returned one is not.
      expect(await replaceTracksFromBase(db, 'ko', koBefore, koBefore)).toEqual({ kind: 'conflict' });
      expect(await replaceTracksFromBase(db, 'ko', saved.tracks.ko, saved.tracks.ko)).toMatchObject({ kind: 'success' });
    } finally { close(); }
  });

  it('normalizes tracklist text and dates', () => {
    expect(normalizeTrackMediaInput({ tracklist: '  a\r\nb  ', recordedOn: ' 2026-01-02 ' })).toEqual({ tracklist: 'a\nb', recordedOn: '2026-01-02' });
    expect(normalizeTrackMediaInput({ recordedOn: '2026-13-01' })).toBeNull();
    expect(normalizeTrackMediaInput({})).toEqual({ tracklist: '', recordedOn: '' });
    expect(tracklistLines('a\n\n  b \n')).toEqual(['a', 'b']);
  });
});
