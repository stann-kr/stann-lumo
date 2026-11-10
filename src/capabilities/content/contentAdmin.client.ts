import { apiGet, apiPut, apiRequest } from '@/services/apiClient';
import type {
  ArtistInfoItem,
  ContactItem,
  ContentLocale,
  DynamicSection,
  HomeSection,
  LinkPlatform,
  PageMeta,
  Track,
} from './content';

export function fetchArtistInfo(lang: ContentLocale) {
  return apiGet<ArtistInfoItem[]>(`/api/admin/artist-info?lang=${lang}`);
}

export function updateArtistInfo(lang: ContentLocale, items: ArtistInfoItem[]) {
  return apiPut<void>('/api/admin/artist-info', { lang, items });
}

export function fetchAboutSections(lang: ContentLocale) {
  return apiGet<DynamicSection[]>(`/api/admin/about-sections?lang=${lang}`);
}

export function updateAboutSections(lang: ContentLocale, sections: DynamicSection[]) {
  return apiPut<void>('/api/admin/about-sections', { lang, sections });
}

export function fetchPageMeta(lang: ContentLocale) {
  return apiGet<PageMeta>(`/api/admin/page-meta?lang=${lang}`);
}

export function updatePageMeta(lang: ContentLocale, pageMeta: PageMeta) {
  return apiPut<void>('/api/admin/page-meta', { lang, pageMeta });
}

export function fetchHomeSections(lang: ContentLocale) {
  return apiGet<HomeSection[]>(`/api/admin/home-sections?lang=${lang}`);
}

export function updateHomeSections(lang: ContentLocale, items: HomeSection[]) {
  return apiPut<void>('/api/admin/home-sections', { lang, items });
}

export function fetchTracks(lang: ContentLocale) {
  return apiGet<Track[]>(`/api/admin/tracks?lang=${lang}`);
}

export function updateTracks(lang: ContentLocale, items: Track[]) {
  return apiPut<void>('/api/admin/tracks', { lang, items });
}

/** Uploads or replaces a saved track's cover; it is stored immediately, outside the list save. */
export function uploadTrackCover(trackId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<{ coverImageId: string; trackId: string }>(`/api/admin/tracks/${encodeURIComponent(trackId)}/cover`, { method: 'POST', body: formData });
}

export function deleteTrackCover(trackId: string) {
  return apiRequest<void>(`/api/admin/tracks/${encodeURIComponent(trackId)}/cover`, { method: 'DELETE' });
}

export function fetchLinkPlatforms(lang: ContentLocale) {
  return apiGet<LinkPlatform[]>(`/api/admin/link-platforms?lang=${lang}`);
}

export function updateLinkPlatforms(lang: ContentLocale, items: LinkPlatform[]) {
  return apiPut<void>('/api/admin/link-platforms', { lang, items });
}

export function fetchContactInfo(lang: ContentLocale) {
  return apiGet<ContactItem[]>(`/api/admin/contact-info?lang=${lang}`);
}

export function updateContactInfo(lang: ContentLocale, items: ContactItem[]) {
  return apiPut<void>('/api/admin/contact-info', { lang, items });
}
