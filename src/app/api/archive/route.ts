import { NextResponse } from 'next/server';
import type { GalleryData } from '@/capabilities/media/media';
import { getDB } from '@/lib/db';
import { getArchivePage, getArchivePhotos } from '@/capabilities/content/publicContent.server';
import { publicPageOffset } from '@/capabilities/content/publicPagination';
import { archiveBrowseState } from '@/capabilities/media/archiveBrowsing';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (params.has('offset')) {
    const offset = publicPageOffset(params.get('offset'));
    if (offset === null) return NextResponse.json({ success: false }, { status: 400 });
    try {
      return NextResponse.json({ success: true, data: await getArchivePage(archiveBrowseState(params), offset) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ success: false }, { status: 500 });
    }
  }
  const db = getDB();
  if (!db) return NextResponse.json({ success: true, data: { photos: [] } });

  try {
    // The public projection, not the admin rows: event links are resolved and the payload is checked.
    const data: GalleryData = { photos: await getArchivePhotos() };
    return NextResponse.json({ success: true, data }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch archive' } },
      { status: 500 },
    );
  }
}
