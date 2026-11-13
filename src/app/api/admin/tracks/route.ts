import { NextRequest, NextResponse } from 'next/server';
import { isContentLocale, type Track } from '@/capabilities/content/content';
import { fetchTracks, replaceTracksFromBase, TrackInputError } from '@/capabilities/content/contentAdmin.server';
import { deleteMediaObjects } from '@/capabilities/media/mediaLifecycle.server';
import { requireAdminSession } from '@/capabilities/auth/authRoute.server';
import { getDB, getR2 } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const lang = request.nextUrl.searchParams.get('lang') ?? 'en';
  if (!isContentLocale(lang)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
      { status: 400 },
    );
  }

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json({ success: true, data: await fetchTracks(db, lang) });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tracks' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { lang: string; items: Track[]; base?: unknown };
    const { lang } = body;
    if (!isContentLocale(lang)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'items must be an array' } },
        { status: 400 },
      );
    }
    // The list the editor started from. Without it a stale tab could replace tracks it never saw.
    if (!Array.isArray(body.base)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'base must be an array' } },
        { status: 400 },
      );
    }

    const result = await replaceTracksFromBase(db, lang, body.base, body.items);
    if (result.kind === 'conflict') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Tracks changed. Refresh and try again.' } },
        { status: 409 },
      );
    }
    const r2 = getR2();
    if (r2) await deleteMediaObjects(r2, result.removedCoverIds);
    return NextResponse.json({ success: true, data: { tracks: result.tracks } });
  } catch (error) {
    if (error instanceof TrackInputError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Tracklist is too long or the recording date is not YYYY-MM-DD' } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update tracks' } },
      { status: 500 },
    );
  }
}
