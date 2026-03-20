/**
 * 공개 콘텐츠 API — 전체 ContentData 반환
 * GET /api/content/[lang]  (lang: 'en' | 'ko')
 *
 * DB 없는 개발 환경: 503 반환 → ContentContext 기본값 폴백
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import type {
  ContentData,
  ArtistInfoItem,
  DynamicSection,
  DynamicSectionType,
  PhilosophyItem,
  PageMeta,
  HomeSection,
  Track,
  Performance,
  EventsInfo,
  LinkPlatform,
  ContactItem,
  ThemeColors,
  RAApiConfig,
  TerminalInfo,
  TerminalCustomField,
} from '@/types/content';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';
import type { AllDisplaySettings } from '@/types/displaySettings';

// ---------- DB 행 타입 ----------

interface ArtistInfoRow {
  id: string; lang: string; key: string; value: string; sort_order: number;
}
interface AboutSectionRow {
  id: string; lang: string; title: string; type: string; section_order: number;
}
interface AboutSectionParagraphRow {
  id: string; section_id: string; lang: string; content: string; item_order: number;
}
interface AboutSectionPhilosophyItemRow {
  id: string; section_id: string; lang: string; quote: string; description: string | null; item_order: number;
}
interface PageMetaRow {
  page: string; lang: string; key: string; value: string;
}
interface HomeSectionRow {
  id: string; lang: string; title: string; description: string; path: string; icon: string; sort_order: number;
}
interface TrackRow {
  id: string; lang: string; title: string; type: string; duration: string; year: string; platform: string; link: string; sort_order: number;
}
interface PerformanceRow {
  id: string; date: string; venue: string; location: string | null; time: string | null;
  title: string; lineup: string | null; ra_event_link: string | null; ra_event_id: string | null;
  poster_image_id: string | null; status: string; sort_order: number;
}
interface EventsInfoRow {
  id: number; contact_email: string; response_time: string;
}
interface EventsListRow {
  id: string; lang: string; value: string; sort_order: number;
}
interface LinkPlatformRow {
  id: string; lang: string; platform: string; url: string; icon: string; description: string; sort_order: number;
}
interface ContactInfoRow {
  id: string; lang: string; label: string; value: string; icon: string; sort_order: number;
}
interface ThemeColorsRow {
  id: number; primary: string; secondary: string; accent: string; muted: string; bg: string; bg_sidebar: string;
}
interface SiteConfigRow {
  id: number; site_name: string; tagline: string; version: string;
  terminal_url: string | null; terminal_description: string | null;
  terminal_font_size: string | null; terminal_animation_speed: string | null;
  terminal_prompt_text: string | null; terminal_show_embed: number | null;
  terminal_embed_height: string | null;
}

interface TerminalCustomFieldRow {
  id: string; field_key: string; field_value: string; field_type: string; sort_order: number;
}
interface RAApiConfigRow {
  id: number; user_id: string | null; api_key: string | null; dj_id: string | null; option: string;
}
interface DisplaySettingsRow {
  page: string; settings: string;
}

// ---------- 헬퍼: page_meta 행 → PageMeta 객체 ----------

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

// ---------- 헬퍼: about_sections 조립 ----------

function buildAboutSections(
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

// ---------- Route Handler ----------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

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
    const [
      artistInfoRes,
      aboutSectionsRes,
      aboutParaRes,
      aboutPhilRes,
      pageMetaRes,
      homeSectionsRes,
      tracksRes,
      performancesRes,
      eventsInfoRes,
      setDurationsRes,
      techReqRes,
      linkPlatformsRes,
      contactInfoRes,
      themeColorsRes,
      raApiConfigRes,
      siteConfigRes,
      displaySettingsRes,
      terminalCustomFieldsRes,
    ] = await db.batch([
      db.prepare('SELECT * FROM artist_info WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM about_sections WHERE lang = ? ORDER BY section_order').bind(lang),
      db.prepare('SELECT * FROM about_section_paragraphs WHERE lang = ? ORDER BY item_order').bind(lang),
      db.prepare('SELECT * FROM about_section_philosophy_items WHERE lang = ? ORDER BY item_order').bind(lang),
      db.prepare('SELECT * FROM page_meta WHERE lang = ?').bind(lang),
      db.prepare('SELECT * FROM home_sections WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM tracks WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM performances ORDER BY date DESC, sort_order'),
      db.prepare('SELECT * FROM events_info WHERE id = 1'),
      db.prepare('SELECT * FROM events_set_durations WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM events_tech_requirements WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM link_platforms WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM contact_info WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM theme_colors WHERE id = 1'),
      db.prepare('SELECT * FROM ra_api_config WHERE id = 1'),
      db.prepare('SELECT * FROM site_config WHERE id = 1'),
      db.prepare('SELECT * FROM display_settings'),
      db.prepare('SELECT * FROM terminal_custom_fields ORDER BY sort_order ASC'),
    ]);

    const artistInfoRows    = (artistInfoRes.results   as ArtistInfoRow[]);
    const aboutSectionRows  = (aboutSectionsRes.results as AboutSectionRow[]);
    const aboutParaRows     = (aboutParaRes.results     as AboutSectionParagraphRow[]);
    const aboutPhilRows     = (aboutPhilRes.results     as AboutSectionPhilosophyItemRow[]);
    const pageMetaRows      = (pageMetaRes.results      as PageMetaRow[]);
    const homeSectionRows   = (homeSectionsRes.results  as HomeSectionRow[]);
    const trackRows         = (tracksRes.results        as TrackRow[]);
    const performanceRows   = (performancesRes.results  as PerformanceRow[]);
    const eventsInfoRow     = (eventsInfoRes.results[0] as EventsInfoRow | undefined);
    const setDurationRows   = (setDurationsRes.results  as EventsListRow[]);
    const techReqRows       = (techReqRes.results       as EventsListRow[]);
    const linkPlatformRows  = (linkPlatformsRes.results as LinkPlatformRow[]);
    const contactInfoRows   = (contactInfoRes.results   as ContactInfoRow[]);
    const themeRow              = (themeColorsRes.results[0]   as ThemeColorsRow | undefined);
    const raRow                 = (raApiConfigRes.results[0]   as RAApiConfigRow | undefined);
    const siteRow               = (siteConfigRes.results[0]    as SiteConfigRow | undefined);
    const displaySettingsRows   = (displaySettingsRes.results  as DisplaySettingsRow[]);
    const terminalFieldRows     = (terminalCustomFieldsRes.results as TerminalCustomFieldRow[]);

    // ArtistInfo
    const artistInfo: ArtistInfoItem[] = artistInfoRows.map((r) => ({
      id: r.id, key: r.key, value: r.value,
    }));

    // AboutSections
    const aboutSections: DynamicSection[] = buildAboutSections(
      aboutSectionRows, aboutParaRows, aboutPhilRows,
    );

    // PageMeta
    const pageMeta: PageMeta = buildPageMeta(pageMetaRows);

    // HomeSections
    const homeSections: HomeSection[] = homeSectionRows.map((r) => ({
      title: r.title, description: r.description, path: r.path, icon: r.icon,
    }));

    // Tracks
    const tracks: Track[] = trackRows.map((r) => ({
      id: r.id, title: r.title, type: r.type, duration: r.duration,
      year: r.year, platform: r.platform, link: r.link,
    }));

    // Performances
    const performances: Performance[] = performanceRows.map((r) => ({
      id: r.id, date: r.date, venue: r.venue,
      ...(r.location  != null && { location:    r.location }),
      ...(r.time      != null && { time:        r.time }),
      title: r.title,
      ...(r.lineup       != null && { lineup:       r.lineup }),
      ...(r.ra_event_link   != null && { raEventLink:   r.ra_event_link }),
      ...(r.ra_event_id     != null && { raEventId:     r.ra_event_id }),
      ...(r.poster_image_id != null && { posterImageId: r.poster_image_id }),
      status: r.status as Performance['status'],
    }));

    // EventsInfo
    const eventsInfo: EventsInfo = {
      setDurations:          setDurationRows.map((r) => r.value),
      technicalRequirements: techReqRows.map((r) => r.value),
      contactEmail:          eventsInfoRow?.contact_email ?? '',
      responseTime:          eventsInfoRow?.response_time ?? '',
    };

    // LinkPlatforms
    const linkPlatforms: LinkPlatform[] = linkPlatformRows.map((r) => ({
      id: r.id, platform: r.platform, url: r.url, icon: r.icon, description: r.description,
    }));

    // TerminalInfo (커스텀 필드 + 스타일 포함)
    const terminalCustomFields: TerminalCustomField[] = terminalFieldRows.map((r) => ({
      id:         r.id,
      fieldKey:   r.field_key,
      fieldValue: r.field_value,
      fieldType:  (r.field_type as TerminalCustomField['fieldType']) ?? 'text',
      sortOrder:  r.sort_order,
    }));

    const terminalInfo: TerminalInfo = {
      url:         siteRow?.terminal_url         ?? '',
      description: siteRow?.terminal_description ?? '',
      customFields: terminalCustomFields,
      style: {
        fontSize:       (siteRow?.terminal_font_size       as 'sm' | 'md' | 'lg')          ?? 'md',
        animationSpeed: (siteRow?.terminal_animation_speed as 'slow' | 'normal' | 'fast') ?? 'normal',
        promptText:     siteRow?.terminal_prompt_text  ?? '>',
        showEmbed:      (siteRow?.terminal_show_embed  ?? 0) === 1,
        embedHeight:    siteRow?.terminal_embed_height ?? '400px',
      },
    };

    // ContactInfo
    const contactInfo: ContactItem[] = contactInfoRows.map((r) => ({
      label: r.label, value: r.value, icon: r.icon,
    }));

    // ThemeColors
    const themeColors: ThemeColors = themeRow
      ? {
          primary:    themeRow.primary,
          secondary:  themeRow.secondary,
          accent:     themeRow.accent,
          muted:      themeRow.muted,
          bg:         themeRow.bg,
          bgSidebar:  themeRow.bg_sidebar,
        }
      : { primary: '#00ff00', secondary: '#ffffff', accent: '#00ff00', muted: '#666666', bg: '#000000', bgSidebar: '#000000' };

    // RAApiConfig
    const raApiConfig: RAApiConfig | undefined =
      raRow?.user_id
        ? {
            userId:  raRow.user_id  ?? '',
            apiKey:  raRow.api_key  ?? '',
            djId:    raRow.dj_id    ?? '',
            option:  (raRow.option as RAApiConfig['option']) ?? '1',
          }
        : undefined;

    // DisplaySettings — 기본값과 shallow merge
    const dsMap = Object.fromEntries(displaySettingsRows.map((r) => [r.page, r.settings]));
    function mergeDs<K extends keyof AllDisplaySettings>(page: K): AllDisplaySettings[K] {
      try {
        const parsed = JSON.parse(dsMap[page] ?? '{}') as Partial<AllDisplaySettings[K]>;
        return { ...DISPLAY_SETTINGS_DEFAULTS[page], ...parsed };
      } catch {
        return DISPLAY_SETTINGS_DEFAULTS[page];
      }
    }
    const displaySettings: AllDisplaySettings = {
      global:  mergeDs('global'),
      home:    mergeDs('home'),
      about:   mergeDs('about'),
      music:   mergeDs('music'),
      events:  mergeDs('events'),
      contact: mergeDs('contact'),
      link:    mergeDs('link'),
    };

    const data: ContentData = {
      artistInfo,
      aboutSections,
      pageMeta,
      homeSections,
      tracks,
      performances,
      eventsInfo,
      linkPlatforms,
      terminalInfo,
      contactInfo,
      themeColors,
      ...(raApiConfig && { raApiConfig }),
      displaySettings,
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
      { status: 500 },
    );
  }
}
