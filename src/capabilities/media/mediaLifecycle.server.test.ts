import { describe, expect, it, vi } from 'vitest';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
  R2Bucket,
} from '@/lib/db';
import { createSqliteD1 } from '@/test/sqliteD1';
import {
  deleteGalleryMedia,
  replaceEventPoster,
  uploadGalleryFiles,
} from './mediaLifecycle.server';
import { fetchGalleryPhotos } from './mediaRepository.server';

interface StatementRecord {
  sql: string;
  bindings: unknown[];
}

function successfulResult(): D1Result {
  return { results: [], success: true, meta: {} };
}

function createDatabase(options?: {
  firstRows?: unknown[];
  batchError?: Error;
}) {
  const statements: StatementRecord[] = [];
  const firstRows = [...(options?.firstRows ?? [])];

  const database = {
    prepare(sql: string) {
      const record: StatementRecord = { sql, bindings: [] };
      statements.push(record);
      const statement = {
        bind(...values: unknown[]) {
          record.bindings = values;
          return statement;
        },
        async first<T>() {
          return (firstRows.shift() ?? null) as T | null;
        },
      };
      return statement as D1PreparedStatement;
    },
    batch: vi.fn(async (batchStatements: D1PreparedStatement[]) => {
      if (options?.batchError) throw options.batchError;
      return batchStatements.map(() => successfulResult());
    }),
  } as unknown as D1Database;

  return { database, statements };
}

function createBucket() {
  const bucket = {
    put: vi.fn(async (key: string) => ({ key, size: 0 })),
    delete: vi.fn(async () => undefined),
  } as unknown as R2Bucket;

  return {
    bucket,
    put: vi.mocked(bucket.put),
    delete: vi.mocked(bucket.delete),
  };
}

function imageFile(name = 'poster.webp'): File {
  return new File(['fixture'], name, { type: 'image/webp' });
}

describe('media lifecycle server capability', () => {
  it('compensates every new R2 object when the gallery metadata batch fails', async () => {
    const failure = new Error('test-only-d1-failure');
    const { database } = createDatabase({
      firstRows: [{ min_order: 4 }],
      batchError: failure,
    });
    const r2 = createBucket();

    await expect(
      uploadGalleryFiles(database, r2.bucket, [imageFile('one.webp'), imageFile('two.webp')]),
    ).rejects.toBe(failure);

    const storedKeys = r2.put.mock.calls.map(([key]) => key);
    expect(storedKeys).toHaveLength(2);
    expect(r2.delete).toHaveBeenCalledWith(storedKeys);
  });

  it('places a multi-file upload ahead of every existing item, in the order the files were chosen', async () => {
    const { db, sqlite, close } = createSqliteD1();
    try {
      for (let index = 0; index < 4; index++) {
        sqlite.prepare("INSERT INTO gallery_photos (id, filename, sort_order, created_at) VALUES (?, ?, ?, '2025-01-01 00:00:00')")
          .run(`old-${index}`, `old-${index}.jpg`, index);
      }

      const uploaded = await uploadGalleryFiles(db, createBucket().bucket, ['one.webp', 'two.webp', 'three.webp'].map(imageFile));

      // The admin list shows the new files first without reloading; a reload must agree.
      expect(uploaded.map(({ filename }) => filename)).toEqual(['one.webp', 'two.webp', 'three.webp']);
      expect((await fetchGalleryPhotos(db)).map(({ filename }) => filename)).toEqual([
        'one.webp', 'two.webp', 'three.webp', 'old-0.jpg', 'old-1.jpg', 'old-2.jpg', 'old-3.jpg',
      ]);
    } finally {
      close();
    }
  });

  it('keeps the previous poster intact and removes only the new object when D1 replacement fails', async () => {
    const failure = new Error('test-only-d1-failure');
    const { database, statements } = createDatabase({
      firstRows: [
        { id: 'event-1', poster_image_id: 'old-photo' },
        { max_order: 6 },
      ],
      batchError: failure,
    });
    const r2 = createBucket();

    await expect(
      replaceEventPoster(database, r2.bucket, 'event-1', imageFile()),
    ).rejects.toBe(failure);

    const newKey = r2.put.mock.calls[0]?.[0];
    expect(r2.delete).toHaveBeenCalledOnce();
    expect(r2.delete).toHaveBeenCalledWith(newKey);
    expect(r2.delete).not.toHaveBeenCalledWith('gallery/old-photo');
    expect(statements.slice(-3).map(({ sql }) => sql)).toEqual([
      expect.stringContaining('INSERT INTO gallery_photos'),
      'UPDATE performances SET poster_image_id = ? WHERE id = ?',
      'DELETE FROM gallery_photos WHERE id = ?',
    ]);
  });

  it('clears every event reference in the same D1 batch before deleting gallery storage', async () => {
    const { database, statements } = createDatabase();
    const r2 = createBucket();

    await deleteGalleryMedia(database, r2.bucket, 'photo-1');

    expect(statements.map(({ sql, bindings }) => ({ sql, bindings }))).toEqual([
      {
        sql: 'UPDATE performances SET poster_image_id = NULL WHERE poster_image_id = ?',
        bindings: ['photo-1'],
      },
      {
        sql: 'DELETE FROM gallery_photos WHERE id = ?',
        bindings: ['photo-1'],
      },
    ]);
    expect(r2.delete).toHaveBeenCalledWith('gallery/photo-1');
  });
});
