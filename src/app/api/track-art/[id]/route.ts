import { NextResponse } from 'next/server';
import { getTrackLink } from '@/capabilities/content/publicContent.server';
import { trackArtSource } from '@/capabilities/media/trackArt';
import { fetchTrackArt } from '@/capabilities/media/trackArt.server';

const MISSING_HEADERS = { 'Cache-Control': 'public, max-age=3600' };

/** Same-origin platform artwork for a track without an uploaded cover; 404 lets the page keep its label plate. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 200) return new NextResponse(null, { status: 404, headers: MISSING_HEADERS });
  try {
    const source = trackArtSource(await getTrackLink(id));
    const art = source && await fetchTrackArt(source);
    if (!art) return new NextResponse(null, { status: 404, headers: MISSING_HEADERS });
    return new NextResponse(art.body, {
      headers: {
        'Content-Type': art.contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
