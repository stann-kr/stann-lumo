/**
 * 데이터 마이그레이션 API (일회성)
 * POST /api/admin/migrate
 *
 * 클라이언트가 localStorage에 저장된 MultiLanguageContent JSON을 전송하면
 * D1에 전체 INSERT(기존 데이터 초기화 후 재삽입).
 *
 * 실행 후: 이 라우트는 더 이상 필요 없으므로 삭제 또는 MIGRATE_ENABLED 플래그로 비활성화 처리.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { MultiLanguageContent, ContentData, DynamicSection } from '@/types/content';

const LANGS = ['en', 'ko'] as const;

export async function POST(request: NextRequest) {
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
    const body = (await request.json()) as { content: MultiLanguageContent };
    const { content } = body;

    if (!content?.en || !content?.ko) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'content.en and content.ko are required' } },
        { status: 400 },
      );
    }

    const statements = [];

    // ── 전체 테이블 초기화 ──────────────────────────────────────
    const langTables = [
      'artist_info', 'about_sections', 'about_section_paragraphs',
      'about_section_philosophy_items', 'page_meta', 'home_sections',
      'tracks', 'events_set_durations', 'events_tech_requirements',
      'link_platforms', 'contact_info',
    ];
    for (const table of langTables) {
      statements.push(db.prepare(`DELETE FROM ${table}`));
    }
    statements.push(db.prepare('DELETE FROM performances'));

    // ── 언어별 데이터 INSERT ────────────────────────────────────
    for (const lang of LANGS) {
      const data: ContentData = content[lang];

      // artist_info
      (data.artistInfo ?? []).forEach((item, idx) => {
        statements.push(
          db.prepare('INSERT INTO artist_info (id, lang, key, value, sort_order) VALUES (?,?,?,?,?)')
            .bind(item.id, lang, item.key, item.value, idx),
        );
      });

      // about_sections + paragraphs + philosophy_items
      const sections: DynamicSection[] = [...(data.aboutSections ?? [])].sort((a, b) => a.order - b.order);
      sections.forEach((section, idx) => {
        statements.push(
          db.prepare('INSERT INTO about_sections (id, lang, title, type, section_order) VALUES (?,?,?,?,?)')
            .bind(section.id, lang, section.title, section.type, idx),
        );
        if (section.type === 'paragraphs') {
          (section.paragraphs ?? []).forEach((para, pi) => {
            statements.push(
              db.prepare('INSERT INTO about_section_paragraphs (id, section_id, lang, content, item_order) VALUES (?,?,?,?,?)')
                .bind(`${section.id}-p-${pi}`, section.id, lang, para, pi),
            );
          });
        } else {
          (section.items ?? []).forEach((item, ii) => {
            statements.push(
              db.prepare('INSERT INTO about_section_philosophy_items (id, section_id, lang, quote, description, item_order) VALUES (?,?,?,?,?,?)')
                .bind(item.id, section.id, lang, item.quote, item.description ?? '', ii),
            );
          });
        }
      });

      // page_meta
      const pageMeta = data.pageMeta;
      if (pageMeta) {
        const metaRows: Array<[string, string, string]> = [
          ['home', 'navTitle', pageMeta.home?.navTitle ?? ''],
          ['music', 'title', pageMeta.music?.title ?? ''],
          ['music', 'subtitle', pageMeta.music?.subtitle ?? ''],
          ['events', 'title', pageMeta.events?.title ?? ''],
          ['events', 'subtitle', pageMeta.events?.subtitle ?? ''],
          ['events', 'upcomingTitle', pageMeta.events?.upcomingTitle ?? ''],
          ['events', 'pastTitle', pageMeta.events?.pastTitle ?? ''],
          ['contact', 'title', pageMeta.contact?.title ?? ''],
          ['contact', 'subtitle', pageMeta.contact?.subtitle ?? ''],
          ['contact', 'guestbookTitle', pageMeta.contact?.guestbookTitle ?? ''],
          ['contact', 'directTitle', pageMeta.contact?.directTitle ?? ''],
          ['contact', 'bookingTitle', pageMeta.contact?.bookingTitle ?? ''],
          ['link', 'title', pageMeta.link?.title ?? ''],
          ['link', 'subtitle', pageMeta.link?.subtitle ?? ''],
          ['link', 'terminalTitle', pageMeta.link?.terminalTitle ?? ''],
        ];
        metaRows.forEach(([page, key, value]) => {
          statements.push(
            db.prepare('INSERT INTO page_meta (page, lang, key, value) VALUES (?,?,?,?)')
              .bind(page, lang, key, value),
          );
        });
      }

      // home_sections
      (data.homeSections ?? []).forEach((s, idx) => {
        statements.push(
          db.prepare('INSERT INTO home_sections (id, lang, title, description, path, icon, sort_order) VALUES (?,?,?,?,?,?,?)')
            .bind(String(idx + 1), lang, s.title, s.description, s.path, s.icon, idx),
        );
      });

      // tracks
      (data.tracks ?? []).forEach((t, idx) => {
        statements.push(
          db.prepare('INSERT INTO tracks (id, lang, title, type, duration, year, platform, link, sort_order) VALUES (?,?,?,?,?,?,?,?,?)')
            .bind(t.id, lang, t.title, t.type, t.duration, t.year, t.platform, t.link, idx),
        );
      });

      // events_set_durations
      (data.eventsInfo?.setDurations ?? []).forEach((val, idx) => {
        statements.push(
          db.prepare('INSERT INTO events_set_durations (id, lang, value, sort_order) VALUES (?,?,?,?)')
            .bind(`dur-${lang}-${idx}`, lang, val, idx),
        );
      });

      // events_tech_requirements
      (data.eventsInfo?.technicalRequirements ?? []).forEach((val, idx) => {
        statements.push(
          db.prepare('INSERT INTO events_tech_requirements (id, lang, value, sort_order) VALUES (?,?,?,?)')
            .bind(`tech-${lang}-${idx}`, lang, val, idx),
        );
      });

      // link_platforms
      (data.linkPlatforms ?? []).forEach((p, idx) => {
        statements.push(
          db.prepare('INSERT INTO link_platforms (id, lang, platform, url, icon, description, sort_order) VALUES (?,?,?,?,?,?,?)')
            .bind(p.id, lang, p.platform, p.url, p.icon, p.description, idx),
        );
      });

      // contact_info
      (data.contactInfo ?? []).forEach((c, idx) => {
        statements.push(
          db.prepare('INSERT INTO contact_info (id, lang, label, value, icon, sort_order) VALUES (?,?,?,?,?,?)')
            .bind(String(idx + 1), lang, c.label, c.value, c.icon, idx),
        );
      });
    }

    // ── 언어 무관 테이블 (en 데이터 기준) ─────────────────────
    const enData = content.en;

    // performances (lang 없음)
    (enData.performances ?? []).forEach((p, idx) => {
      statements.push(
        db.prepare(`INSERT INTO performances
          (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id, status, sort_order)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
          .bind(
            p.id, p.date, p.venue,
            p.location ?? null, p.time ?? null,
            p.title,
            p.lineup ?? null, p.raEventLink ?? null, p.raEventId ?? null,
            p.status, idx,
          ),
      );
    });

    // events_info (단일행 UPDATE)
    if (enData.eventsInfo) {
      statements.push(
        db.prepare('UPDATE events_info SET contact_email=?, response_time=? WHERE id=1')
          .bind(enData.eventsInfo.contactEmail, enData.eventsInfo.responseTime),
      );
    }

    // theme_colors (단일행 UPDATE)
    if (enData.themeColors) {
      statements.push(
        db.prepare(`UPDATE theme_colors
          SET "primary"=?, secondary=?, accent=?, muted=?, bg=?, bg_sidebar=?
          WHERE id=1`)
          .bind(
            enData.themeColors.primary, enData.themeColors.secondary,
            enData.themeColors.accent,  enData.themeColors.muted,
            enData.themeColors.bg,      enData.themeColors.bgSidebar,
          ),
      );
    }

    // site_config — terminalInfo
    if (enData.terminalInfo) {
      statements.push(
        db.prepare('UPDATE site_config SET terminal_url=?, terminal_description=? WHERE id=1')
          .bind(enData.terminalInfo.url || null, enData.terminalInfo.description || null),
      );
    }

    // D1 batch는 한 번에 최대 100개 — 청크 분할 실행
    const CHUNK_SIZE = 90;
    for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
      await db.batch(statements.slice(i, i + CHUNK_SIZE));
    }

    return NextResponse.json({
      success: true,
      data: { inserted: statements.length },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: String(err) } },
      { status: 500 },
    );
  }
}
