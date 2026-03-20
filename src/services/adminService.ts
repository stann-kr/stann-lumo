/**
 * 어드민 콘텐츠 CRUD 서비스
 *
 * 어드민 API(/api/admin/*)를 호출하는 서비스 계층.
 * 모든 메서드는 세션 쿠키를 자동으로 포함하여 인증함.
 */

import { apiGet, apiPut } from './apiClient';
import type {
  ArtistInfoItem,
  DynamicSection,
  PageMeta,
  HomeSection,
  Track,
  Performance,
  EventsInfo,
  LinkPlatform,
  ContactItem,
  ThemeColors,
  RAApiConfig,
  TerminalCustomField,
  TerminalStyleConfig,
} from '@/types/content';
import type { SiteConfigData } from '@/app/api/admin/site-config/route';
import type { AllDisplaySettings } from '@/types/displaySettings';

// ---------- 아티스트 정보 ----------

export function fetchArtistInfo(lang: 'en' | 'ko') {
  return apiGet<ArtistInfoItem[]>(`/api/admin/artist-info?lang=${lang}`);
}
export function updateArtistInfo(lang: 'en' | 'ko', items: ArtistInfoItem[]) {
  return apiPut<void>('/api/admin/artist-info', { lang, items });
}

// ---------- 동적 섹션 ----------

export function fetchAboutSections(lang: 'en' | 'ko') {
  return apiGet<DynamicSection[]>(`/api/admin/about-sections?lang=${lang}`);
}
export function updateAboutSections(lang: 'en' | 'ko', sections: DynamicSection[]) {
  return apiPut<void>('/api/admin/about-sections', { lang, sections });
}

// ---------- 페이지 메타 ----------

export function fetchPageMeta(lang: 'en' | 'ko') {
  return apiGet<PageMeta>(`/api/admin/page-meta?lang=${lang}`);
}
export function updatePageMeta(lang: 'en' | 'ko', pageMeta: PageMeta) {
  return apiPut<void>('/api/admin/page-meta', { lang, pageMeta });
}

// ---------- 홈 섹션 ----------

export function fetchHomeSections(lang: 'en' | 'ko') {
  return apiGet<HomeSection[]>(`/api/admin/home-sections?lang=${lang}`);
}
export function updateHomeSections(lang: 'en' | 'ko', items: HomeSection[]) {
  return apiPut<void>('/api/admin/home-sections', { lang, items });
}

// ---------- 트랙 ----------

export function fetchTracks(lang: 'en' | 'ko') {
  return apiGet<Track[]>(`/api/admin/tracks?lang=${lang}`);
}
export function updateTracks(lang: 'en' | 'ko', items: Track[]) {
  return apiPut<void>('/api/admin/tracks', { lang, items });
}

// ---------- 공연 일정 ----------

export function fetchPerformances() {
  return apiGet<Performance[]>('/api/admin/performances');
}
export function updatePerformances(items: Performance[]) {
  return apiPut<void>('/api/admin/performances', { items });
}

/**
 * 이벤트 포스터 이미지 업로드
 * @param eventId - 대상 이벤트(performances) ID
 * @param file - 업로드할 이미지 파일
 */
export async function uploadEventPoster(
  eventId: string,
  file: File,
): Promise<{ success: boolean; data?: { photoId: string; eventId: string }; error?: { code: string; message: string } }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`/api/admin/events/${eventId}/poster`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}

/**
 * 이벤트 포스터 이미지 삭제
 * @param eventId - 대상 이벤트(performances) ID
 */
export async function deleteEventPoster(
  eventId: string,
): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  const res = await fetch(`/api/admin/events/${eventId}/poster`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}

// ---------- RA API 설정 ----------

export function fetchRaApiConfig() {
  return apiGet<RAApiConfig>('/api/admin/ra-api-config');
}
export function updateRaApiConfig(raApiConfig: RAApiConfig) {
  return apiPut<void>('/api/admin/ra-api-config', { raApiConfig });
}

// ---------- 이벤트 정보 ----------

export function fetchEventsInfo(lang: 'en' | 'ko') {
  return apiGet<EventsInfo>(`/api/admin/events-info?lang=${lang}`);
}
export function updateEventsInfo(lang: 'en' | 'ko', eventsInfo: EventsInfo) {
  return apiPut<void>('/api/admin/events-info', { lang, eventsInfo });
}

// ---------- 링크 플랫폼 ----------

export function fetchLinkPlatforms(lang: 'en' | 'ko') {
  return apiGet<LinkPlatform[]>(`/api/admin/link-platforms?lang=${lang}`);
}
export function updateLinkPlatforms(lang: 'en' | 'ko', items: LinkPlatform[]) {
  return apiPut<void>('/api/admin/link-platforms', { lang, items });
}

// ---------- 연락처 ----------

export function fetchContactInfo(lang: 'en' | 'ko') {
  return apiGet<ContactItem[]>(`/api/admin/contact-info?lang=${lang}`);
}
export function updateContactInfo(lang: 'en' | 'ko', items: ContactItem[]) {
  return apiPut<void>('/api/admin/contact-info', { lang, items });
}

// ---------- 테마 ----------

export function fetchThemeColors() {
  return apiGet<ThemeColors>('/api/admin/theme');
}
export function updateThemeColors(themeColors: ThemeColors) {
  return apiPut<void>('/api/admin/theme', { themeColors });
}

// ---------- 사이트 설정 ----------

export function fetchSiteConfig() {
  return apiGet<SiteConfigData>('/api/admin/site-config');
}
export function updateSiteConfig(siteConfig: SiteConfigData) {
  return apiPut<void>('/api/admin/site-config', { siteConfig });
}

// ---------- Display Settings ----------

export function fetchDisplaySettings(): ReturnType<typeof apiGet<AllDisplaySettings>>;
export function fetchDisplaySettings(page: keyof AllDisplaySettings): ReturnType<typeof apiGet<AllDisplaySettings[keyof AllDisplaySettings]>>;
export function fetchDisplaySettings(page?: keyof AllDisplaySettings) {
  if (page) {
    return apiGet<AllDisplaySettings[keyof AllDisplaySettings]>(`/api/admin/display-settings?page=${page}`);
  }
  return apiGet<AllDisplaySettings>('/api/admin/display-settings');
}

export function updateDisplaySettings(
  page: keyof AllDisplaySettings,
  settings: AllDisplaySettings[keyof AllDisplaySettings],
) {
  return apiPut<void>('/api/admin/display-settings', { page, settings: settings as unknown as Record<string, unknown> });
}

// ---------- 터미널 통합 설정 ----------

export interface TerminalConfigData {
  url:          string;
  description:  string;
  customFields: TerminalCustomField[];
  style:        TerminalStyleConfig;
}

export function fetchTerminalConfig() {
  return apiGet<TerminalConfigData>('/api/admin/terminal-config');
}
export function updateTerminalConfig(config: TerminalConfigData) {
  return apiPut<void>('/api/admin/terminal-config', { config });
}

/**
 * 하위 호환: 기존 호출부에서 사용 중인 updateTerminalInfo
 * 커스텀 필드·스타일이 없는 경우에도 안전하게 처리
 */
export async function updateTerminalInfo(
  terminalInfo: import('@/types/content').TerminalInfo,
): ReturnType<typeof apiPut> {
  const current = await fetchSiteConfig();
  if (!current.success || !current.data) {
    return { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Cannot fetch site config' } };
  }
  return apiPut<void>('/api/admin/site-config', {
    siteConfig: {
      ...current.data,
      terminalUrl:         terminalInfo.url,
      terminalDescription: terminalInfo.description,
    },
  });
}
