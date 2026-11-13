import 'server-only';

import type { D1Database } from '@/lib/db';
import type {
  ContentData,
  ArtistInfoItem,
  DynamicSection,
  DynamicSectionType,
  PhilosophyItem,
  PageMeta,
  HomeSection,
  Track,
  LinkPlatform,
  ContactItem,
} from './content';
import { trackMediaFields, TRACK_MEDIA_COLUMNS, TRACK_MEDIA_JOIN, type TrackMediaColumns } from './trackMedia';
import type { EventsInfo, Performance } from '@/capabilities/events/events';
import type { TerminalCustomField, TerminalInfo } from '@/capabilities/terminal/terminalConfig';

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
interface TrackRow extends TrackMediaColumns {
  id: string; lang: string; title: string; type: string; duration: string; year: string; platform: string; link: string; sort_order: number;
}
interface PerformanceRow {
  id: string; date: string; venue: string; location: string | null; time: string | null;
  title: string; lineup: string | null; ra_event_link: string | null; ra_event_id: string | null;
  poster_image_id: string | null; status: string; sort_order: number;
  ra_venue_id: string | null; ra_country_name: string | null; ra_area_name: string | null;
  ra_area_id: string | null; ra_address: string | null; ra_cost: string | null;
  ra_promoter: string | null; ra_venue_link: string | null; ra_has_tickets: string | null;
  ra_has_barcode: string | null; ra_promoter_id: string | null; ra_lineup_raw: string | null;
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

export type ContentLocale = 'en' | 'ko';

// ---------- 음악 목록 투영: 공개 API와 관리자 목록 저장의 충돌 검사가 함께 쓴다 ----------

const TRACKS_SQL = `SELECT t.*, ${TRACK_MEDIA_COLUMNS} FROM tracks t ${TRACK_MEDIA_JOIN} WHERE t.lang = ? ORDER BY t.sort_order`;

/**
 * `/api/content/[lang]`이 내려주는 한 언어의 음악 목록. 관리자 음악 편집기는 이 목록에서 편집을 시작한다.
 * KO 행이 하나도 없으면 EN 행을 그대로 보여준다.
 */
function projectTracks(lang: ContentLocale, rows: TrackRow[], englishRows: TrackRow[] | undefined): Track[] {
  const source = lang === 'ko' && rows.length === 0 && englishRows ? englishRows : rows;
  return source.map((r) => ({
    id: r.id, title: r.title, type: r.type, duration: r.duration,
    year: r.year, platform: r.platform, link: r.link, ...trackMediaFields(r),
  }));
}

/** 두 언어의 음악 목록을 한 번에 읽는다. 각 목록은 `/api/content/[lang]`의 tracks와 같다. */
export async function fetchTrackLists(db: D1Database): Promise<Record<ContentLocale, Track[]>> {
  const [en, ko] = await db.batch<TrackRow>([
    db.prepare(TRACKS_SQL).bind('en'),
    db.prepare(TRACKS_SQL).bind('ko'),
  ]);
  return { en: projectTracks('en', en.results, undefined), ko: projectTracks('ko', ko.results, en.results) };
}

export async function fetchContentBundle(
  db: D1Database,
  lang: ContentLocale,
): Promise<ContentData> {
    const queries = [
      db.prepare('SELECT * FROM artist_info WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM about_sections WHERE lang = ? ORDER BY section_order').bind(lang),
      db.prepare('SELECT * FROM about_section_paragraphs WHERE lang = ? ORDER BY item_order').bind(lang),
      db.prepare('SELECT * FROM about_section_philosophy_items WHERE lang = ? ORDER BY item_order').bind(lang),
      db.prepare('SELECT * FROM page_meta WHERE lang = ?').bind(lang),
      db.prepare('SELECT * FROM home_sections WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare(TRACKS_SQL).bind(lang),
      db.prepare('SELECT * FROM performances ORDER BY date DESC, sort_order'),
      db.prepare('SELECT * FROM events_info WHERE id = 1'),
      db.prepare('SELECT * FROM events_set_durations WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM events_tech_requirements WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM link_platforms WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM contact_info WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM site_config WHERE id = 1'),
      db.prepare('SELECT * FROM terminal_custom_fields ORDER BY sort_order ASC'),
    ];

    if (lang === 'ko') {
      queries.push(
        db.prepare('SELECT * FROM artist_info WHERE lang = ? ORDER BY sort_order').bind('en'),
        db.prepare('SELECT * FROM about_sections WHERE lang = ? ORDER BY section_order').bind('en'),
        db.prepare('SELECT * FROM about_section_paragraphs WHERE lang = ? ORDER BY item_order').bind('en'),
        db.prepare('SELECT * FROM about_section_philosophy_items WHERE lang = ? ORDER BY item_order').bind('en'),
        db.prepare('SELECT * FROM page_meta WHERE lang = ?').bind('en'),
        db.prepare('SELECT * FROM home_sections WHERE lang = ? ORDER BY sort_order').bind('en'),
        db.prepare(TRACKS_SQL).bind('en'),
        db.prepare('SELECT * FROM events_set_durations WHERE lang = ? ORDER BY sort_order').bind('en'),
        db.prepare('SELECT * FROM events_tech_requirements WHERE lang = ? ORDER BY sort_order').bind('en'),
        db.prepare('SELECT * FROM link_platforms WHERE lang = ? ORDER BY sort_order').bind('en'),
        db.prepare('SELECT * FROM contact_info WHERE lang = ? ORDER BY sort_order').bind('en'),
      );
    }

    const res = await db.batch(queries);

    // 헬퍼: KO 결과가 없으면 EN 결과를 반환
    const getRows = <T>(idx: number, fallbackIdx?: number): T[] => {
      const primary = (res[idx].results as T[]);
      if (lang === 'ko' && primary.length === 0 && fallbackIdx !== undefined) {
        return (res[fallbackIdx].results as T[]);
      }
      return primary;
    };

    const queryIndex = {
      artistInfo: 0,
      aboutSections: 1,
      aboutParagraphs: 2,
      aboutPhilosophy: 3,
      pageMeta: 4,
      homeSections: 5,
      tracks: 6,
      performances: 7,
      eventsInfo: 8,
      eventDurations: 9,
      eventRequirements: 10,
      linkPlatforms: 11,
      contactInfo: 12,
      siteConfig: 13,
      terminalFields: 14,
      fallbackArtistInfo: 15,
      fallbackAboutSections: 16,
      fallbackAboutParagraphs: 17,
      fallbackAboutPhilosophy: 18,
      fallbackPageMeta: 19,
      fallbackHomeSections: 20,
      fallbackTracks: 21,
      fallbackEventDurations: 22,
      fallbackEventRequirements: 23,
      fallbackLinkPlatforms: 24,
      fallbackContactInfo: 25,
    } as const;

    const artistInfoRows = getRows<ArtistInfoRow>(
      queryIndex.artistInfo,
      queryIndex.fallbackArtistInfo,
    );
    const aboutSectionRows = getRows<AboutSectionRow>(
      queryIndex.aboutSections,
      queryIndex.fallbackAboutSections,
    );
    const aboutParaRows = getRows<AboutSectionParagraphRow>(
      queryIndex.aboutParagraphs,
      queryIndex.fallbackAboutParagraphs,
    );
    const aboutPhilRows = getRows<AboutSectionPhilosophyItemRow>(
      queryIndex.aboutPhilosophy,
      queryIndex.fallbackAboutPhilosophy,
    );

    // PageMeta는 병합 처리
    let pageMetaRows: PageMetaRow[] = (res[queryIndex.pageMeta].results as PageMetaRow[]);
    if (lang === 'ko') {
      const enMetaRows = (res[queryIndex.fallbackPageMeta].results as PageMetaRow[]);
      const metaMap = new Map<string, PageMetaRow>();
      enMetaRows.forEach(r => metaMap.set(`${r.page}:${r.key}`, r));
      pageMetaRows.forEach(r => metaMap.set(`${r.page}:${r.key}`, r));
      pageMetaRows = Array.from(metaMap.values());
    }

    const homeSectionRows = getRows<HomeSectionRow>(
      queryIndex.homeSections,
      queryIndex.fallbackHomeSections,
    );
    const performanceRows = (res[queryIndex.performances].results as PerformanceRow[]);
    const eventsInfoRow = (res[queryIndex.eventsInfo].results[0] as EventsInfoRow | undefined);
    const setDurationRows = getRows<EventsListRow>(
      queryIndex.eventDurations,
      queryIndex.fallbackEventDurations,
    );
    const techReqRows = getRows<EventsListRow>(
      queryIndex.eventRequirements,
      queryIndex.fallbackEventRequirements,
    );
    const linkPlatformRows = getRows<LinkPlatformRow>(
      queryIndex.linkPlatforms,
      queryIndex.fallbackLinkPlatforms,
    );
    const contactInfoRows = getRows<ContactInfoRow>(
      queryIndex.contactInfo,
      queryIndex.fallbackContactInfo,
    );

    const siteRow = (res[queryIndex.siteConfig].results[0] as SiteConfigRow | undefined);
    const terminalFieldRows = (res[queryIndex.terminalFields].results as TerminalCustomFieldRow[]);

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

    // Tracks — 관리자 목록 저장의 충돌 검사(fetchTrackLists)와 같은 투영
    const tracks: Track[] = projectTracks(
      lang,
      res[queryIndex.tracks].results as TrackRow[],
      lang === 'ko' ? res[queryIndex.fallbackTracks].results as TrackRow[] : undefined,
    );

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
      ...(r.ra_venue_id != null && { raVenueId: r.ra_venue_id }),
      ...(r.ra_country_name != null && { raCountryName: r.ra_country_name }),
      ...(r.ra_area_name != null && { raAreaName: r.ra_area_name }),
      ...(r.ra_area_id != null && { raAreaId: r.ra_area_id }),
      ...(r.ra_address != null && { raAddress: r.ra_address }),
      ...(r.ra_cost != null && { raCost: r.ra_cost }),
      ...(r.ra_promoter != null && { raPromoter: r.ra_promoter }),
      ...(r.ra_venue_link != null && { raVenueLink: r.ra_venue_link }),
      raHasTickets: r.ra_has_tickets === '1',
      raHasBarcode: r.ra_has_barcode === '1',
      ...(r.ra_promoter_id != null && { raPromoterId: r.ra_promoter_id }),
      ...(r.ra_lineup_raw != null && { raLineupRaw: r.ra_lineup_raw }),
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
    };

    return data;
}
