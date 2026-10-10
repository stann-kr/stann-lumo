import 'server-only';

import type { D1Database, D1Result, R2Bucket } from '@/lib/db';
import { GALLERY_UPLOAD_TYPES, MAX_UPLOAD_BYTES, POSTER_UPLOAD_TYPES, type GalleryPhoto } from './media';

const ALLOWED_MEDIA_TYPES = new Set(GALLERY_UPLOAD_TYPES);
const ALLOWED_POSTER_TYPES = new Set(POSTER_UPLOAD_TYPES);
const MAX_FILE_SIZE = MAX_UPLOAD_BYTES;

export type MediaLifecycleErrorCode =
  | 'EVENT_NOT_FOUND'
  | 'FILE_REQUIRED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE';

export class MediaLifecycleError extends Error {
  constructor(readonly code: MediaLifecycleErrorCode) {
    super(code);
    this.name = 'MediaLifecycleError';
  }
}

function mediaKey(id: string): string {
  return `gallery/${id}`;
}

function assertBatchSucceeded(results: D1Result[]): void {
  if (results.some((result) => !result.success)) {
    throw new Error('D1 batch failed');
  }
}

async function deleteObjectsBestEffort(r2: R2Bucket, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await r2.delete(keys.length === 1 ? keys[0]! : keys).catch(() => undefined);
}

function resolveMediaType(mimeType: string): GalleryPhoto['mediaType'] {
  return mimeType.startsWith('video/') ? 'video_file' : 'image';
}

function validatePosterFile(file: File): void {
  if (!ALLOWED_POSTER_TYPES.has(file.type)) {
    throw new MediaLifecycleError('INVALID_FILE_TYPE');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new MediaLifecycleError('FILE_TOO_LARGE');
  }
}

export async function uploadGalleryFiles(
  db: D1Database,
  r2: R2Bucket,
  files: File[],
): Promise<GalleryPhoto[]> {
  const acceptedFiles = files.filter(
    (file) => ALLOWED_MEDIA_TYPES.has(file.type) && file.size <= MAX_FILE_SIZE,
  );

  if (acceptedFiles.length === 0) return [];

  const minOrderRow = await db
    .prepare('SELECT MIN(sort_order) as min_order FROM gallery_photos')
    .first<{ min_order: number | null }>();
  let nextOrder = (minOrderRow?.min_order ?? 1) - 1;

  const uploaded: GalleryPhoto[] = [];
  const storedKeys: string[] = [];

  try {
    for (const file of acceptedFiles) {
      const id = crypto.randomUUID();
      const key = mediaKey(id);
      const mediaType = resolveMediaType(file.type);

      await r2.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });
      storedKeys.push(key);

      uploaded.push({
        id,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        altText: '',
        caption: '',
        sortOrder: nextOrder,
        createdAt: new Date().toISOString(),
        mediaType,
        focalX: 50,
        focalY: 50,
      });
      nextOrder++;
    }

    const results = await db.batch(
      uploaded.map((photo) =>
        db
          .prepare(
            `INSERT INTO gallery_photos
              (id, filename, mime_type, size_bytes, alt_text, caption, sort_order,
               media_type, focal_x, focal_y)
             VALUES (?, ?, ?, ?, '', '', ?, ?, 50, 50)`,
          )
          .bind(
            photo.id,
            photo.filename,
            photo.mimeType,
            photo.sizeBytes,
            photo.sortOrder,
            photo.mediaType,
          ),
      ),
    );
    assertBatchSucceeded(results);
  } catch (error) {
    await deleteObjectsBestEffort(r2, storedKeys);
    throw error;
  }

  return uploaded;
}

export async function replaceEventPoster(
  db: D1Database,
  r2: R2Bucket,
  eventId: string,
  file: File | null,
): Promise<{ photoId: string; eventId: string }> {
  const performance = await db
    .prepare('SELECT id, poster_image_id FROM performances WHERE id = ?')
    .bind(eventId)
    .first<{ id: string; poster_image_id: string | null }>();

  if (!performance) {
    throw new MediaLifecycleError('EVENT_NOT_FOUND');
  }

  if (!file) {
    throw new MediaLifecycleError('FILE_REQUIRED');
  }

  validatePosterFile(file);

  const maxOrderRow = await db
    .prepare('SELECT MAX(sort_order) as max_order FROM gallery_photos')
    .first<{ max_order: number | null }>();
  const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;
  const photoId = crypto.randomUUID();
  const newKey = mediaKey(photoId);

  await r2.put(newKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  try {
    const statements = [
      db
        .prepare(
          `INSERT INTO gallery_photos
            (id, filename, mime_type, size_bytes, alt_text, caption, sort_order,
             media_type, focal_x, focal_y, linked_event_id)
           VALUES (?, ?, ?, ?, '', '', ?, 'image', 50, 50, ?)`,
        )
        .bind(photoId, file.name, file.type, file.size, nextOrder, eventId),
      db
        .prepare('UPDATE performances SET poster_image_id = ? WHERE id = ?')
        .bind(photoId, eventId),
    ];

    if (performance.poster_image_id) {
      statements.push(
        db
          .prepare('DELETE FROM gallery_photos WHERE id = ?')
          .bind(performance.poster_image_id),
      );
    }

    const results = await db.batch(statements);
    assertBatchSucceeded(results);
  } catch (error) {
    await deleteObjectsBestEffort(r2, [newKey]);
    throw error;
  }

  if (performance.poster_image_id) {
    await deleteObjectsBestEffort(r2, [mediaKey(performance.poster_image_id)]);
  }

  return { photoId, eventId };
}

export async function deleteEventPoster(
  db: D1Database,
  r2: R2Bucket,
  eventId: string,
): Promise<void> {
  const performance = await db
    .prepare('SELECT poster_image_id FROM performances WHERE id = ?')
    .bind(eventId)
    .first<{ poster_image_id: string | null }>();

  if (!performance) {
    throw new MediaLifecycleError('EVENT_NOT_FOUND');
  }

  if (!performance.poster_image_id) return;

  const results = await db.batch([
    db.prepare('UPDATE performances SET poster_image_id = NULL WHERE id = ?').bind(eventId),
    db.prepare('DELETE FROM gallery_photos WHERE id = ?').bind(performance.poster_image_id),
  ]);
  assertBatchSucceeded(results);

  await deleteObjectsBestEffort(r2, [mediaKey(performance.poster_image_id)]);
}

export async function deleteGalleryMedia(
  db: D1Database,
  r2: R2Bucket | null,
  id: string,
): Promise<void> {
  const results = await db.batch([
    db.prepare('UPDATE performances SET poster_image_id = NULL WHERE poster_image_id = ?').bind(id),
    db.prepare('DELETE FROM gallery_photos WHERE id = ?').bind(id),
  ]);
  assertBatchSucceeded(results);

  if (r2) {
    await deleteObjectsBestEffort(r2, [mediaKey(id)]);
  }
}
