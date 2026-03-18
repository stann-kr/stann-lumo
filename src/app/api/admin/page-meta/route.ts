/**
 * 어드민 페이지 메타 API
 * GET  /api/admin/page-meta?lang=en|ko  — 페이지 메타 조회
 * PUT  /api/admin/page-meta             — 페이지 메타 전체 교체 (lang별)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { PageMeta } from '@/types/content';

interface PageMetaRow {
  page: string; lang: string; key: string; value: string;
}

function buildPageMeta(rows: PageMetaRow[]): PageMeta {
  const meta: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!meta[row.page]) meta[row.page] = {};
    meta[row.page][row.key] = row.value;
  }
  return {
    home:    { navTitle: meta.home?.navTitle ?? '' },
    music:   { title: meta.music?.title ?? '', subtitle: meta.music?.subtitle ?? '' },
    events:  {
      title:         meta.events?.title ?? '',
      subtitle:      meta.events?.subtitle ?? '',
      upcomingTitle: meta.events?.upcomingTitle ?? '',
      pastTitle:     meta.events?.pastTitle ?? '',
    },
    contact: {
      title:          meta.contact?.title ?? '',
      subtitle:       meta.contact?.subtitle ?? '',
      guestbookTitle: meta.contact?.guestbookTitle ?? '',
      directTitle:    meta.contact?.directTitle ?? '',
      bookingTitle:   meta.contact?.bookingTitle ?? '',
    },
    link: {
      title:         meta.link?.title ?? '',
      subtitle:      meta.link?.subtitle ?? '',
      terminalTitle: meta.link?.terminalTitle ?? '',
    },
  };
}

/** PageMeta 객체 → { page, key, value } 행 배열로 평탄화 */
function flattenPageMeta(pageMeta: PageMeta): Array<{ page: string; key: string; value: string }> {
  const rows: Array<{ page: string; key: string; value: string }> = [];
  const entries: Array<[string, Record<string, string>]> = [
    ['home',    pageMeta.home    as unknown as Record<string, string>],
    ['music',   pageMeta.music   as unknown as Record<string, string>],
    ['events',  pageMeta.events  as unknown as Record<string, string>],
    ['contact', pageMeta.contact as unknown as Record<string, string>],
    ['link',    pageMeta.link    as unknown as Record<string, string>],
  ];
  for (const [page, kvs] of entries) {
    for (const [key, value] of Object.entries(kvs)) {
      rows.push({ page, key, value });
    }
  }
  return rows;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const lang = request.nextUrl.searchParams.get('lang') ?? 'en';
  if (lang !== 'en' && lang !== 'ko') {
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
    const result = await db.prepare(
      'SELECT * FROM page_meta WHERE lang = ?',
    ).bind(lang).all<PageMetaRow>();

    return NextResponse.json({ success: true, data: buildPageMeta(result.results) });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch page meta' } },
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
    const body = (await request.json()) as { lang: string; pageMeta: PageMeta };
    const { lang, pageMeta } = body;

    if (lang !== 'en' && lang !== 'ko') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!pageMeta || typeof pageMeta !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'pageMeta is required' } },
        { status: 400 },
      );
    }

    const rows = flattenPageMeta(pageMeta);

    await db.batch([
      db.prepare('DELETE FROM page_meta WHERE lang = ?').bind(lang),
      ...rows.map((row) =>
        db.prepare(
          'INSERT INTO page_meta (page, lang, key, value) VALUES (?, ?, ?, ?)',
        ).bind(row.page, lang, row.key, row.value),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update page meta' } },
      { status: 500 },
    );
  }
}
