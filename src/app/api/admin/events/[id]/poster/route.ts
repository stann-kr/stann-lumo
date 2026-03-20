/**
 * 어드민 이벤트 포스터 업로드 API
 * POST /api/admin/events/{id}/poster — multipart/form-data, field: "file"
 * R2 저장 + gallery_photos INSERT (linked_event_id 설정) + performances UPDATE (poster_image_id)
 * DELETE /api/admin/events/{id}/poster — 포스터 연결 해제 + gallery_photos 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getR2 } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const { id: eventId } = await params;
  const db = getDB();
  const r2 = getR2();

  if (!db || !r2) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Storage not available' } },
      { status: 503 },
    );
  }

  try {
    // 이벤트 존재 확인
    const perf = await db
      .prepare('SELECT id, poster_image_id FROM performances WHERE id = ?')
      .bind(eventId)
      .first<{ id: string; poster_image_id: string | null }>();

    if (!perf) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid file type' } },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'File too large (max 10MB)' } },
        { status: 400 },
      );
    }

    // 기존 포스터가 있으면 R2 + DB에서 삭제
    if (perf.poster_image_id) {
      await r2.delete(`gallery/${perf.poster_image_id}`).catch(() => {});
      await db.prepare('DELETE FROM gallery_photos WHERE id = ?').bind(perf.poster_image_id).run();
    }

    const photoId = crypto.randomUUID();
    const r2Key = `gallery/${photoId}`;

    // 현재 최대 sort_order 조회
    const maxOrderRow = await db
      .prepare('SELECT MAX(sort_order) as max_order FROM gallery_photos')
      .first<{ max_order: number | null }>();
    const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

    await r2.put(r2Key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    await db.batch([
      db.prepare(
        `INSERT INTO gallery_photos
          (id, filename, mime_type, size_bytes, alt_text, caption, sort_order,
           media_type, focal_x, focal_y, linked_event_id)
         VALUES (?, ?, ?, ?, '', '', ?, 'image', 50, 50, ?)`,
      ).bind(photoId, file.name, file.type, file.size, nextOrder, eventId),
      db.prepare('UPDATE performances SET poster_image_id = ? WHERE id = ?').bind(photoId, eventId),
    ]);

    return NextResponse.json({
      success: true,
      data: { photoId, eventId },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Poster upload failed' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const { id: eventId } = await params;
  const db = getDB();
  const r2 = getR2();

  if (!db || !r2) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Storage not available' } },
      { status: 503 },
    );
  }

  try {
    const perf = await db
      .prepare('SELECT poster_image_id FROM performances WHERE id = ?')
      .bind(eventId)
      .first<{ poster_image_id: string | null }>();

    if (!perf) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      );
    }

    if (perf.poster_image_id) {
      await r2.delete(`gallery/${perf.poster_image_id}`).catch(() => {});
      await db.batch([
        db.prepare('DELETE FROM gallery_photos WHERE id = ?').bind(perf.poster_image_id),
        db.prepare('UPDATE performances SET poster_image_id = NULL WHERE id = ?').bind(eventId),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Poster delete failed' } },
      { status: 500 },
    );
  }
}
