import { NextResponse } from 'next/server';
import { getTrackLink } from '@/capabilities/content/publicContent.server';
import { cachedResize, parseImageWidth, resizeImage } from '@/capabilities/media/imageResize.server';
import { trackArtSource } from '@/capabilities/media/trackArt';
import { fetchTrackArt } from '@/capabilities/media/trackArt.server';
import { getImages } from '@/lib/db';

const MISSING_HEADERS = { 'Cache-Control': 'public, max-age=3600' };
const ART_HEADERS = { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400', 'X-Content-Type-Options': 'nosniff' };

/** Same-origin platform artwork for a track without an uploaded cover; 404 lets the page keep its label plate. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 200) return new NextResponse(null, { status: 404, headers: MISSING_HEADERS });
  const width = parseImageWidth(new URL(request.url).searchParams.get('w'));
  try {
    const produce = async () => {
      const source = trackArtSource(await getTrackLink(id));
      const art = source && await fetchTrackArt(source);
      if (!art) return null;
      // A failed resize falls back to the platform's own file, which is already a reasonable cover size.
      const output = width ? await resizeImage(getImages(), new Response(art.body).body!, art.contentType, width) : null;
      return output
        ? new Response(output.body, { headers: { 'Content-Type': output.contentType, ...ART_HEADERS } })
        : new Response(art.body, { headers: { 'Content-Type': art.contentType, ...ART_HEADERS } });
    };
    // The edge keeps the answer for its max-age, so a changed platform link shows its new art within a week.
    const art = width ? await cachedResize(new URL(`/api/track-art/${encodeURIComponent(id)}?w=${width}`, request.url).toString(), produce) : await produce();
    return art ?? new NextResponse(null, { status: 404, headers: MISSING_HEADERS });
  } catch {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
