import 'server-only';

import type { D1Database, R2Bucket, R2GetOptions, R2Object, R2ObjectBody } from '@/lib/db';
import { extractYouTubeId, type GalleryPhoto } from './media';

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
  focal_x: number;
  focal_y: number;
  video_youtube_id: string | null;
  video_thumbnail_url: string | null;
  linked_event_id: string | null;
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
    mediaType: (row.media_type as GalleryPhoto['mediaType']) ?? 'image',
    focalX: row.focal_x ?? 50,
    focalY: row.focal_y ?? 50,
    videoYoutubeId: row.video_youtube_id ?? undefined,
    videoThumbnailUrl: row.video_thumbnail_url ?? undefined,
    linkedEventId: row.linked_event_id ?? undefined,
  };
}

export async function fetchGalleryPhotos(db: D1Database): Promise<GalleryPhoto[]> {
  const result = await db.prepare(
    'SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at DESC',
  ).all<GalleryPhotoRow>();
  return result.results.map(mapGalleryPhoto);
}

export async function fetchGalleryPhotoById(
  db: D1Database,
  id: string,
): Promise<GalleryPhoto | null> {
  const row = await db.prepare(
    'SELECT * FROM gallery_photos WHERE id = ?',
  ).bind(id).first<GalleryPhotoRow>();
  return row ? mapGalleryPhoto(row) : null;
}

export async function updateGalleryPhotos(
  db: D1Database,
  photos: GalleryPhoto[],
): Promise<void> {
  await db.batch(photos.map((photo, index) => db.prepare(
    `UPDATE gallery_photos
     SET alt_text = ?, caption = ?, sort_order = ?, focal_x = ?, focal_y = ?, linked_event_id = ?
     WHERE id = ?`,
  ).bind(
    photo.altText ?? '',
    photo.caption ?? '',
    index,
    photo.focalX ?? 50,
    photo.focalY ?? 50,
    photo.linkedEventId ?? null,
    photo.id,
  )));
}

export interface YouTubeGalleryInput {
  youtubeUrl: string;
  caption?: string;
  altText?: string;
  linkedEventId?: string;
}

export async function addYouTubeGalleryVideo(
  db: D1Database,
  input: YouTubeGalleryInput,
): Promise<GalleryPhoto | null> {
  const videoId = extractYouTubeId(input.youtubeUrl);
  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const minOrderRow = await db.prepare(
    'SELECT MIN(sort_order) as min_order FROM gallery_photos',
  ).first<{ min_order: number | null }>();
  const nextOrder = (minOrderRow?.min_order ?? 1) - 1;
  const id = crypto.randomUUID();
  const caption = input.caption ?? '';
  const altText = input.altText ?? `YouTube: ${videoId}`;
  const linkedEventId = input.linkedEventId ?? null;

  await db.prepare(
    `INSERT INTO gallery_photos
      (id, filename, mime_type, size_bytes, alt_text, caption, sort_order,
       media_type, focal_x, focal_y, video_youtube_id, video_thumbnail_url, linked_event_id)
     VALUES (?, ?, 'video/youtube', 0, ?, ?, ?, 'video_youtube', 50, 50, ?, ?, ?)`,
  ).bind(
    id,
    `youtube_${videoId}`,
    altText,
    caption,
    nextOrder,
    videoId,
    thumbnailUrl,
    linkedEventId,
  ).run();

  return {
    id,
    filename: `youtube_${videoId}`,
    mimeType: 'video/youtube',
    sizeBytes: 0,
    altText,
    caption,
    sortOrder: nextOrder,
    createdAt: new Date().toISOString(),
    mediaType: 'video_youtube',
    focalX: 50,
    focalY: 50,
    videoYoutubeId: videoId,
    videoThumbnailUrl: thumbnailUrl,
    ...(linkedEventId && { linkedEventId }),
  };
}

export function fetchGalleryObject(r2: R2Bucket, id: string, options?: R2GetOptions): Promise<R2ObjectBody | R2Object | null> {
  return r2.get(`gallery/${id}`, options);
}

export function headGalleryObject(r2: R2Bucket, id: string): Promise<R2Object | null> {
  return r2.head(`gallery/${id}`);
}

/**
 * Resolves a single `bytes=` range against the object size (Safari only plays video that honours ranges).
 * Returns null when the whole object should be sent (no header, multiple ranges, other units).
 */
export function resolveByteRange(header: string | null, size: number): { start: number; end: number } | 'unsatisfiable' | null {
  const match = header?.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix === 0 || size === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || end < start) return 'unsatisfiable';
  return { start, end };
}
