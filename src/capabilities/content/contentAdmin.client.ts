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

/** Both languages' lists after a list save; a Korean list without rows of its own shows the English rows. */
export interface SavedTrackLists {
  tracks: Record<ContentLocale, Track[]>;
}

/**
 * Replaces one language's list. `base` is the list the edit started from: when the stored list no longer matches it,
 * nothing is written and the response fails with code CONFLICT.
 */
export function updateTracks(lang: ContentLocale, items: Track[], base: Track[]) {
  return apiPut<SavedTrackLists>('/api/admin/tracks', { lang, items, base });
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
