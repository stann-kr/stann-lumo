import type { ComponentProps, ReactNode } from 'react';
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { GalleryPhoto } from '@/capabilities/media/media';
import ArchivePageClient from '@/components/public/ArchivePageClient';
import { archiveBrowseState, archiveDetailContext, archiveHref, archiveReturnHref, sortArchivePhotos } from '@/capabilities/media/archiveBrowsing';

vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import('react');
  return { useSearchParams: () => new URLSearchParams(useSyncExternalStore(
    (listener) => { window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener); },
    () => window.location.search,
  )) };
});

vi.mock('next/link', () => ({
  default: ({ href, children, onNavigate, ...props }: ComponentProps<'a'> & { href: string; prefetch?: boolean; onNavigate?: (event: { preventDefault: () => void }) => void }) => {
    delete props.prefetch;
    return <a href={href} {...props} onClick={(event) => { event.preventDefault(); onNavigate?.({ preventDefault: () => {} }); }}>{children}</a>;
  },
}));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/feature/PageLayout', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

const photos: GalleryPhoto[] = [
  {
    id: 'night-signal',
    filename: 'night-signal.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    altText: 'STANN LUMO performing beneath red lights',
    caption: 'Night Signal',
    sortOrder: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    mediaType: 'image',
    focalX: 50,
    focalY: 50,
  },
  {
    id: 'live-cut',
    filename: 'live-cut.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 2048,
    altText: 'Live performance clip',
    caption: '',
    sortOrder: 2,
    createdAt: '2026-08-02T00:00:00.000Z',
    mediaType: 'video_file',
    focalX: 50,
    focalY: 50,
  },
];

function mockPages(items: GalleryPhoto[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const params = new URL(url, 'http://localhost').searchParams;
    const { sort, seed } = archiveBrowseState(params);
    const ordered = sortArchivePhotos(items, sort, seed);
    const offset = Number(params.get('offset'));
    return Response.json({ success: true, data: { items: ordered.slice(offset, offset + 4), total: ordered.length, nextOffset: offset + 4 < ordered.length ? offset + 4 : null } });
  }));
}
const links = () => within(screen.getByRole('list')).queryAllByRole('link');
async function loadMore(count: number) {
  fireEvent.click(screen.getByRole('button', { name: 'list_load_more' }));
  await waitFor(() => expect(links()).toHaveLength(count));
}

describe('GalleryPage', () => {
  beforeEach(() => {
    window.history.replaceState({ __NA: true }, '', '/archive');
    sessionStorage.clear();
    mockPages(photos);
    vi.stubGlobal('scrollTo', vi.fn());
    const replace = window.history.replaceState.bind(window.history);
    // Next publishes external History updates, but skips its own internal __NA calls.
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, title, url) => {
      replace({ ...data, __NA: true }, title, url);
      if (!data?.__NA) window.dispatchEvent(new PopStateEvent('popstate'));
    });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('renders each archive tile as an article containing a named native link', async () => {
    const { container } = render(<ArchivePageClient total={photos.length} />);
    await loadMore(2);

    const nightSignal = screen.getByRole('link', { name: 'Open archive item: Night Signal' });
    const liveCut = screen.getByRole('link', { name: 'Open archive item: Live performance clip' });

    expect(screen.getByRole('list')).toContainElement(nightSignal.closest('li'));
    expect(nightSignal).toHaveAttribute('href', '/archive/night-signal');
    act(() => nightSignal.focus());
    await waitFor(() => expect(within(nightSignal).getByRole('img')).toHaveAttribute('src', '/api/media/night-signal?v=2'));
    expect(liveCut).toHaveAttribute('href', '/archive/live-cut');
    expect(nightSignal.closest('article')).toContainElement(nightSignal);
    expect(container.querySelectorAll('div[onclick]')).toHaveLength(0);
  });

  it('keeps non-interactive media affordances out of the accessibility tree', async () => {
    const { container } = render(<ArchivePageClient total={photos.length} />);
    await loadMore(2);

    expect(container.querySelector('video')).toHaveAttribute('aria-hidden', 'true');
    for (const icon of container.querySelectorAll('i')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('requests the selected order and keeps event dates ahead of upload dates', async () => {
    const items = [
      { ...photos[0]!, id: 'older-event', caption: 'Older event', eventDate: '2020-01-01', createdAt: '2026-09-08 03:00:00' },
      { ...photos[0]!, id: 'newer-event', caption: 'Newer event', eventDate: '2024-01-01', createdAt: '2026-09-08 01:00:00' },
      { ...photos[0]!, id: 'photo', caption: 'Photo', createdAt: '2025-01-01T00:00:00Z' },
    ];
    mockPages(items);
    render(<ArchivePageClient total={items.length} />);
    await loadMore(items.length);
    const captions = () => within(screen.getByRole('list')).getAllByRole('link').map(link => link.textContent);
    expect(captions()).toEqual(['Photo', 'Newer event', 'Older event']);
    fireEvent.click(screen.getByRole('radio', { name: 'gallery_sort_oldest' }));
    await loadMore(3);
    expect(captions()).toEqual(['Older event', 'Newer event', 'Photo']);
    expect(items.map(item => item.id)).toEqual(['older-event', 'newer-event', 'photo']);
  });

  it('requests four items at a time, preserves tiles, and resets requests on sort', async () => {
    const items = Array.from({ length: 9 }, (_, index) => ({ ...photos[0]!, id: `item-${index}`, caption: `Item ${index}`, eventDate: `2024-01-0${index + 1}` }));
    mockPages(items);
    render(<ArchivePageClient total={items.length} />);
    expect(fetch).not.toHaveBeenCalled();
    expect(links()).toHaveLength(0);
    await loadMore(4);
    expect(links()[0]).toHaveAttribute('href', '/archive/item-8');
    const original = links()[0];
    await loadMore(8);
    expect(links()[0]).toBe(original);
    expect(links()[4]).toHaveFocus();
    fireEvent.click(screen.getByRole('radio', { name: 'gallery_sort_random' }));
    expect(links()).toHaveLength(0);
    await loadMore(4);
    const first = links().map(link => link.id);
    await loadMore(8);
    await loadMore(9);
    expect(links().slice(0, 4).map(link => link.id)).toEqual(first);
    expect(new Set(links().map(link => link.id)).size).toBe(9);
    expect(screen.queryByRole('button', { name: 'list_load_more' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'gallery_sort_oldest' }));
    await loadMore(4);
    expect(links()[0]).toHaveAttribute('href', '/archive/item-0?sort=oldest');
    expect(vi.mocked(fetch).mock.calls.map(([url]) => new URL(String(url), 'http://localhost').searchParams.get('offset'))).toEqual(['0', '4', '0', '4', '8', '0']);
  });

  it('shuffles reproducibly without mutation and keeps undated items last', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ ...photos[0]!, id: `item-${index}` }));
    const original = items.map(item => item.id);
    const shuffled = sortArchivePhotos(items, 'random', 42).map(item => item.id);
    expect(shuffled).not.toEqual(original);
    expect(sortArchivePhotos(items, 'random', 42).map(item => item.id)).toEqual(shuffled);
    expect(new Set(shuffled)).toEqual(new Set(original));
    expect(items.map(item => item.id)).toEqual(original);
    for (const sort of ['newest', 'oldest'] as const) {
      expect(sortArchivePhotos([{ ...photos[0]!, id: 'undated', createdAt: '' }, photos[1]!], sort, 1).at(-1)?.id).toBe('undated');
    }
  });

  it('does not show pagination for an empty archive', () => {
    render(<ArchivePageClient total={0} />);
    expect(screen.getByText('gallery_empty')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'gallery_sort' })).not.toBeInTheDocument();
  });

  it('restores sort, random seed, page, selected tile and scroll after opening a detail', async () => {
    const items = Array.from({ length: 53 }, (_, index) => ({ ...photos[0]!, id: `item-${index}`, caption: `Item ${index}` }));
    window.history.replaceState(null, '', '/archive?sort=random&seed=42&page=2');
    vi.stubGlobal('scrollY', 780);
    mockPages(items);
    const view = render(<ArchivePageClient total={items.length} />);
    await waitFor(() => expect(screen.getByRole('list').querySelectorAll('a[href]')).toHaveLength(48));
    const links = within(screen.getByRole('list')).getAllByRole('link');
    const selected = links[27]!;
    const href = selected.getAttribute('href');
    fireEvent.click(selected);
    expect(window.location.hash).toMatch(/^#archive-item-/);
    view.unmount();
    render(<ArchivePageClient total={items.length} />);
    await waitFor(() => expect(screen.getByRole('list').querySelectorAll('a[href]')).toHaveLength(48));
    expect(screen.getByRole('radio', { name: 'gallery_sort_random' })).toBeChecked();
    expect(document.activeElement).toHaveAttribute('href', href);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 780, behavior: 'instant' });
    expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(48);
  });

  it('retains every loaded batch even when returning from an earlier tile and clamps stale page URLs', async () => {
    const items = Array.from({ length: 53 }, (_, index) => ({ ...photos[0]!, id: `item-${index}` }));
    const browse = archiveBrowseState(new URLSearchParams('sort=random&seed=42&page=3'));
    const first = sortArchivePhotos(items, browse.sort, browse.seed)[0]!;
    const detail = archiveDetailContext(items, first.id, browse)!;
    expect(detail.browse.page).toBe(3);
    expect(archiveDetailContext(items, detail.next!.id, detail.browse)!.browse).toEqual(detail.browse);
    window.history.replaceState(null, '', archiveReturnHref({ ...detail.browse, page: 999 }));
    mockPages(items);
    render(<ArchivePageClient total={items.length} />);
    await waitFor(() => expect(screen.getByRole('list').querySelectorAll('a[href]')).toHaveLength(53));
    expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(53);
    expect(document.activeElement).toHaveAttribute('id', `archive-item-${first.id}`);
    expect(screen.queryByRole('button', { name: 'list_load_more' })).not.toBeInTheDocument();
  });

  it('uses the grid order for detail numbering and neighbours, retaining the original return item', () => {
    for (const sort of ['newest', 'oldest', 'random'] as const) {
      const browse = archiveBrowseState(new URLSearchParams(`sort=${sort}&seed=42`));
      const ordered = sortArchivePhotos(photos, sort, browse.seed);
      const detail = archiveDetailContext(photos, ordered[0]!.id, browse)!;
      expect(detail.index).toBe(0);
      expect(detail.previous).toBeNull();
      expect(detail.next?.id).toBe(ordered[1]!.id);
      const next = archiveDetailContext(photos, detail.next!.id, detail.browse)!;
      expect(next.index).toBe(1);
      expect(next.browse.from).toBe(ordered[0]!.id);
      expect(archiveReturnHref(next.browse)).toContain(`#archive-item-${ordered[0]!.id}`);
      expect(archiveHref(next.browse, next.photo.id)).toContain(`from=${ordered[0]!.id}`);
    }
    expect(archiveBrowseState(new URLSearchParams('sort=unknown&page=NaN&seed=Infinity'))).toEqual({ sort: 'newest', page: 1, seed: 1, from: '' });
  });
});
