import { apiGet, apiPut, apiRequest } from '@/services/apiClient';
import type {
  ContentLocale,
  PageMeta,
  Track,
} from './content';

export function fetchPageMeta(lang: ContentLocale) {
  return apiGet<PageMeta>(`/api/admin/page-meta?lang=${lang}`);
}

export function updatePageMeta(lang: ContentLocale, pageMeta: PageMeta) {
  return apiPut<void>('/api/admin/page-meta', { lang, pageMeta });
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
