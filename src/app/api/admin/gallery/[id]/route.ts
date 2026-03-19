/**
 * 갤러리 사진 삭제
 * DELETE /api/admin/gallery/[id] — D1 + R2 동시 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getR2 } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const { id } = await params;

  const db = getDB();
  const r2 = getR2();

  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    // D1에서 먼저 삭제
    await db.prepare('DELETE FROM gallery_photos WHERE id = ?').bind(id).run();

    // R2 삭제 (실패해도 무시 — D1이 정상 삭제되면 orphan 파일만 남음)
    if (r2) {
      await r2.delete(`gallery/${id}`).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete photo' } },
      { status: 500 },
    );
  }
}
