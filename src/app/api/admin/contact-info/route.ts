/**
 * 어드민 연락처 정보 API
 * GET  /api/admin/contact-info?lang=en|ko
 * PUT  /api/admin/contact-info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { ContactItem } from '@/types/content';

interface ContactInfoRow {
  id: string; lang: string; label: string; value: string; icon: string; sort_order: number;
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
      'SELECT * FROM contact_info WHERE lang = ? ORDER BY sort_order',
    ).bind(lang).all<ContactInfoRow>();

    const data: ContactItem[] = result.results.map((r) => ({
      label: r.label, value: r.value, icon: r.icon,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch contact info' } },
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
    const body = (await request.json()) as { lang: string; items: (ContactItem & { id?: string })[] };
    const { lang, items } = body;

    if (lang !== 'en' && lang !== 'ko') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'items must be an array' } },
        { status: 400 },
      );
    }

    await db.batch([
      db.prepare('DELETE FROM contact_info WHERE lang = ?').bind(lang),
      ...items.map((item, idx) =>
        db.prepare(
          'INSERT INTO contact_info (id, lang, label, value, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(item.id ?? String(idx + 1), lang, item.label, item.value, item.icon, idx),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update contact info' } },
      { status: 500 },
    );
  }
}
