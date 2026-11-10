/**
 * 어드민 이벤트 포스터 업로드 API
 * POST /api/admin/events/{id}/poster — multipart/form-data, field: "file"
 * R2 저장 + gallery_photos INSERT (linked_event_id 설정) + performances UPDATE (poster_image_id)
 * DELETE /api/admin/events/{id}/poster — 포스터 연결 해제 + gallery_photos 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteEventPoster,
  MediaLifecycleError,
  replaceEventPoster,
} from '@/capabilities/media/mediaLifecycle.server';
import { getDB, getR2 } from '@/lib/db';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';

function mediaErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof MediaLifecycleError)) return null;

  if (error.code === 'EVENT_NOT_FOUND' || error.code === 'TRACK_NOT_FOUND') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
      { status: 404 },
    );
  }

  const message = {
    FILE_REQUIRED: 'No file provided',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_TOO_LARGE: 'File too large (max 10MB)',
  }[error.code];
  return NextResponse.json(
    { success: false, error: { code: 'BAD_REQUEST', message } },
    { status: 400 },
  );
}

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
    const formData = await request.formData();
    const entry = formData.get('file');
    const file = entry instanceof File ? entry : null;

    const data = await replaceEventPoster(db, r2, eventId, file);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const response = mediaErrorResponse(error);
    if (response) return response;
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
    await deleteEventPoster(db, r2, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = mediaErrorResponse(error);
    if (response) return response;
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Poster delete failed' } },
      { status: 500 },
    );
  }
}
