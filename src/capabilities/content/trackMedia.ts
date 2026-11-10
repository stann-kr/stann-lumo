import type { Track } from './content';

/** Columns joined from `track_media` (alias `m`) next to a `tracks` row (alias `t`). */
export const TRACK_MEDIA_COLUMNS = 'm.tracklist AS tracklist, m.recorded_on AS recorded_on, m.cover_image_id AS cover_image_id';
export const TRACK_MEDIA_JOIN = 'LEFT JOIN track_media m ON m.track_id = t.id';

export const MAX_TRACKLIST_LENGTH = 4000;

export interface TrackMediaColumns {
  tracklist?: string | null;
  recorded_on?: string | null;
  cover_image_id?: string | null;
}

/** Adds only the mix fields that hold a value, so tracks without them keep their old shape. */
export function trackMediaFields(row: TrackMediaColumns): Pick<Track, 'tracklist' | 'recordedOn' | 'coverImageId'> {
  return {
    ...(row.tracklist && { tracklist: row.tracklist }),
    ...(row.recorded_on && { recordedOn: row.recorded_on }),
    ...(row.cover_image_id && { coverImageId: row.cover_image_id }),
  };
}

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Validates editable mix text. Returns null when the input cannot be stored. */
export function normalizeTrackMediaInput(track: Pick<Track, 'tracklist' | 'recordedOn'>): { tracklist: string; recordedOn: string } | null {
  const tracklist = typeof track.tracklist === 'string' ? track.tracklist.replace(/\r\n?/g, '\n').trim() : '';
  const recordedOn = typeof track.recordedOn === 'string' ? track.recordedOn.trim() : '';
  if (tracklist.length > MAX_TRACKLIST_LENGTH) return null;
  if (recordedOn && !DATE_PATTERN.test(recordedOn)) return null;
  return { tracklist, recordedOn };
}

/** Splits stored tracklist text into display lines. */
export function tracklistLines(tracklist?: string): string[] {
  return (tracklist ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
}
