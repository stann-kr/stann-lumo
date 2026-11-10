/**
 * 어드민 믹스 커버 API
 * POST /api/admin/tracks/{id}/cover — multipart/form-data, field: "file". R2 저장 + track_media.cover_image_id 갱신
 * DELETE /api/admin/tracks/{id}/cover — 커버 연결 해제 + R2 객체 삭제
 * 커버는 gallery_photos 행을 만들지 않으므로 공개 아카이브에 나타나지 않는다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteTrackCover, MediaLifecycleError, replaceTrackCover } from '@/capabilities/media/mediaLifecycle.server';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getDB, getR2 } from '@/lib/db';

function errorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof MediaLifecycleError) {
    if (error.code === 'TRACK_NOT_FOUND' || error.code === 'EVENT_NOT_FOUND') {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Save the track before adding a cover' } }, { status: 404 });
    }
    const message = { FILE_REQUIRED: 'No file provided', INVALID_FILE_TYPE: 'Invalid file type', FILE_TOO_LARGE: 'File too large (max 10MB)' }[error.code];
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message } }, { status: 400 });
  }
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: fallback } }, { status: 500 });
}

function storageUnavailable() {
  return NextResponse.json({ success: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Storage not available' } }, { status: 503 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;
  const { id } = await params;
  const db = getDB();
  const r2 = getR2();
  if (!db || !r2) return storageUnavailable();
  try {
    const entry = (await request.formData()).get('file');
    const data = await replaceTrackCover(db, r2, id, entry instanceof File ? entry : null);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error, 'Cover upload failed');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;
  const { id } = await params;
  const db = getDB();
  const r2 = getR2();
  if (!db || !r2) return storageUnavailable();
  try {
    await deleteTrackCover(db, r2, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Cover delete failed');
  }
}
