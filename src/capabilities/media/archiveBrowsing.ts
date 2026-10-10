import type { GalleryPhoto } from './media';

export type ArchiveSort = 'newest' | 'random' | 'oldest';
export const ARCHIVE_PAGE_SIZE = 24;

export interface ArchiveBrowseState { sort: ArchiveSort; seed: number; page: number; from: string; }

export function archiveBrowseState(params: Pick<URLSearchParams, 'get'>): ArchiveBrowseState {
  const sort = params.get('sort');
  const page = Number(params.get('page'));
  const seed = Number(params.get('seed'));
  return {
    sort: sort === 'oldest' || sort === 'random' ? sort : 'newest',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    seed: Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff ? seed : 1,
    from: (params.get('from') || '').slice(0, 200),
  };
}

export function archiveHref(browse: ArchiveBrowseState, photoId?: string): string {
  const params = new URLSearchParams();
  if (browse.sort !== 'newest') params.set('sort', browse.sort);
  if (browse.sort === 'random') params.set('seed', String(browse.seed));
  if (browse.page > 1) params.set('page', String(browse.page));
  if (photoId && browse.from) params.set('from', browse.from);
  const query = params.size ? `?${params}` : '';
  return `/archive${photoId ? `/${encodeURIComponent(photoId)}` : ''}${query}`;
}

export function archiveItemAnchor(id: string): string { return `archive-item-${id}`; }

export function archiveReturnHref(browse: ArchiveBrowseState): string {
  return `${archiveHref(browse)}${browse.from ? `#${encodeURIComponent(archiveItemAnchor(browse.from))}` : ''}`;
}

type ArchiveOrderItem = Pick<GalleryPhoto, 'id' | 'eventDate' | 'createdAt' | 'sortOrder'>;

function archiveDate(photo: ArchiveOrderItem): number | null {
  const eventDate = Date.parse(photo.eventDate?.replace(/\./g, '-') ?? '');
  if (Number.isFinite(eventDate)) return eventDate;
  const createdAt = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(photo.createdAt)
    ? `${photo.createdAt.replace(' ', 'T')}Z`
    : photo.createdAt;
  const date = Date.parse(createdAt);
  return Number.isFinite(date) ? date : null;
}

export function archiveDetailContext(photos: readonly GalleryPhoto[], id: string, browse: ArchiveBrowseState) {
  const ordered = sortArchivePhotos(photos, browse.sort, browse.seed);
  const index = ordered.findIndex((photo) => photo.id === id);
  if (index < 0) return null;
  const originIndex = ordered.findIndex((photo) => photo.id === browse.from);
  const returnIndex = originIndex < 0 ? index : originIndex;
  return {
    photo: ordered[index]!, previous: ordered[index - 1] ?? null, next: ordered[index + 1] ?? null,
    index, total: ordered.length,
    browse: { ...browse, from: ordered[returnIndex]!.id,
      page: Math.min(Math.ceil(ordered.length / ARCHIVE_PAGE_SIZE), Math.max(browse.page, Math.floor(returnIndex / ARCHIVE_PAGE_SIZE) + 1)) },
  };
}

export function sortArchivePhotos<T extends ArchiveOrderItem>(
  photos: readonly T[],
  sort: ArchiveSort,
  seed: number,
): T[] {
  const sorted = [...photos];
  if (sort === 'random') {
    // A seeded shuffle stays fixed while moving between pages.
    let state = seed | 0 || 1;
    for (let index = sorted.length - 1; index > 0; index--) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const other = Math.floor(((state >>> 0) / 0x100000000) * (index + 1));
      [sorted[index], sorted[other]] = [sorted[other]!, sorted[index]!];
    }
    return sorted;
  }
  return sorted.sort((left, right) => {
    const a = archiveDate(left);
    const b = archiveDate(right);
    if (a === null && b !== null) return 1;
    if (b === null && a !== null) return -1;
    const byDate = (a ?? 0) - (b ?? 0);
    return (sort === 'oldest' ? byDate : -byDate)
      || left.sortOrder - right.sortOrder
      || left.id.localeCompare(right.id);
  });
}
