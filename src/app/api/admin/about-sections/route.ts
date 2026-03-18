/**
 * 어드민 동적 섹션 API
 * GET  /api/admin/about-sections?lang=en|ko  — 섹션 목록 (paragraphs/items 포함)
 * PUT  /api/admin/about-sections             — 전체 교체 (lang별)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { DynamicSection, DynamicSectionType, PhilosophyItem } from '@/types/content';

interface AboutSectionRow {
  id: string; lang: string; title: string; type: string; section_order: number;
}
interface AboutSectionParagraphRow {
  id: string; section_id: string; lang: string; content: string; item_order: number;
}
interface AboutSectionPhilosophyItemRow {
  id: string; section_id: string; lang: string; quote: string; description: string | null; item_order: number;
}

function buildSections(
  sections: AboutSectionRow[],
  paragraphs: AboutSectionParagraphRow[],
  philosophyItems: AboutSectionPhilosophyItemRow[],
): DynamicSection[] {
  return sections.map((section) => {
    const base = {
      id:    section.id,
      title: section.title,
      type:  section.type as DynamicSectionType,
      order: section.section_order,
    };
    if (section.type === 'philosophy-items') {
      const items: PhilosophyItem[] = philosophyItems
        .filter((r) => r.section_id === section.id)
        .sort((a, b) => a.item_order - b.item_order)
        .map((r) => ({ id: r.id, quote: r.quote, description: r.description ?? '' }));
      return { ...base, items };
    }
    const paras = paragraphs
      .filter((r) => r.section_id === section.id)
      .sort((a, b) => a.item_order - b.item_order)
      .map((r) => r.content);
    return { ...base, paragraphs: paras };
  });
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
    const [sectionsRes, parasRes, philRes] = await db.batch([
      db.prepare('SELECT * FROM about_sections WHERE lang = ? ORDER BY section_order').bind(lang),
      db.prepare('SELECT * FROM about_section_paragraphs WHERE lang = ? ORDER BY item_order').bind(lang),
      db.prepare('SELECT * FROM about_section_philosophy_items WHERE lang = ? ORDER BY item_order').bind(lang),
    ]);

    const data = buildSections(
      sectionsRes.results  as AboutSectionRow[],
      parasRes.results     as AboutSectionParagraphRow[],
      philRes.results      as AboutSectionPhilosophyItemRow[],
    );

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch about sections' } },
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
    const body = (await request.json()) as { lang: string; sections: DynamicSection[] };
    const { lang, sections } = body;

    if (lang !== 'en' && lang !== 'ko') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'sections must be an array' } },
        { status: 400 },
      );
    }

    const insertSections = sections.map((s, idx) =>
      db.prepare(
        'INSERT INTO about_sections (id, lang, title, type, section_order) VALUES (?, ?, ?, ?, ?)',
      ).bind(s.id, lang, s.title, s.type, idx),
    );

    const insertParagraphs = sections.flatMap((s) =>
      s.type === 'paragraphs'
        ? (s.paragraphs ?? []).map((para, idx) =>
            db.prepare(
              'INSERT INTO about_section_paragraphs (id, section_id, lang, content, item_order) VALUES (?, ?, ?, ?, ?)',
            ).bind(`${s.id}-p-${idx}`, s.id, lang, para, idx),
          )
        : [],
    );

    const insertPhilosophy = sections.flatMap((s) =>
      s.type === 'philosophy-items'
        ? (s.items ?? []).map((item, idx) =>
            db.prepare(
              'INSERT INTO about_section_philosophy_items (id, section_id, lang, quote, description, item_order) VALUES (?, ?, ?, ?, ?, ?)',
            ).bind(item.id, s.id, lang, item.quote, item.description ?? '', idx),
          )
        : [],
    );

    await db.batch([
      db.prepare('DELETE FROM about_sections WHERE lang = ?').bind(lang),
      db.prepare('DELETE FROM about_section_paragraphs WHERE lang = ?').bind(lang),
      db.prepare('DELETE FROM about_section_philosophy_items WHERE lang = ?').bind(lang),
      ...insertSections,
      ...insertParagraphs,
      ...insertPhilosophy,
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update about sections' } },
      { status: 500 },
    );
  }
}
