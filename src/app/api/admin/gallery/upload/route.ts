/**
 * 갤러리 파일 업로드
 * POST /api/admin/gallery/upload — multipart/form-data, field: "files"
 * R2 저장 + D1 메타데이터 INSERT
 * 이미지(image/*) + 동영상(video/*) 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getR2 } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { GalleryPhoto } from '@/types/content';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function resolveMediaType(mimeType: string): 'image' | 'video_file' {
  return mimeType.startsWith('video/') ? 'video_file' : 'image';
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  const r2 = getR2();

  if (!db || !r2) {
    return NextResponse.json(
      { success: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Storage not available in this environment' } },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'No files provided' } },
        { status: 400 },
      );
    }

    // 현재 최대 sort_order 조회
    const maxOrderRow = await db
      .prepare('SELECT MAX(sort_order) as max_order FROM gallery_photos')
      .first<{ max_order: number | null }>();
    let nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

    const uploaded: GalleryPhoto[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        continue;
      }

      const id = crypto.randomUUID();
      const r2Key = `gallery/${id}`;
      const mediaType = resolveMediaType(file.type);

      // stream() 사용으로 대용량 메모리 방지
      await r2.put(r2Key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      await db
        .prepare(
          `INSERT INTO gallery_photos
            (id, filename, mime_type, size_bytes, alt_text, caption, sort_order,
             media_type, focal_x, focal_y)
           VALUES (?, ?, ?, ?, '', '', ?, ?, 50, 50)`,
        )
        .bind(id, file.name, file.type, file.size, nextOrder, mediaType)
        .run();

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

    return NextResponse.json({ success: true, data: uploaded });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Upload failed' } },
      { status: 500 },
    );
  }
}
