'use client';

import { captionIncludesDate, getPublicImageUrl } from '@/capabilities/media/media';

import Link from '../feature/PublicLink';
import { useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import PagedList from '@/components/feature/PagedList';
import LoadingImage from '@/capabilities/media/LoadingImage';
import { fetchPublicPage, type PublicPage } from '@/capabilities/content/publicPagination';
import { useLanguage } from '@/contexts/LanguageContext';
import v5 from '@/styles/v5.module.css';
import styles from './ArchivePageClient.module.css';
import type { GalleryPhoto } from '@/capabilities/media/media';
import { ARCHIVE_PAGE_SIZE, archiveBrowseState, archiveHref, archiveItemAnchor, archiveReturnHref, type ArchiveBrowseState } from '@/capabilities/media/archiveBrowsing';

const RETURN_POSITION_KEY = 'lumo:archive:return-position';

function GridItem({ photo, browse, eager }: { photo: GalleryPhoto; browse: ArchiveBrowseState; eager: boolean }) {
  const { language } = useLanguage();
  const label = photo.caption || photo.altText || photo.filename;
  return (
    <article>
      <Link id={archiveItemAnchor(photo.id)} href={archiveHref(browse, photo.id)} prefetch={false} className={styles.tile} aria-label={`${language === 'ko' ? '아카이브 항목 열기' : 'Open archive item'}: ${label}`} onNavigate={() => {
        const href = archiveReturnHref({ ...browse, from: photo.id });
        try { sessionStorage.setItem(RETURN_POSITION_KEY, JSON.stringify({ href, y: window.scrollY })); } catch { /* The URL still restores the selected item when storage is unavailable. */ }
        window.history.replaceState(null, '', href);
      }}>
        <div className={styles.media} data-video={photo.mediaType !== 'image'}>
          {photo.mediaType === 'video_youtube' ? <LoadingImage src={photo.videoThumbnailUrl || undefined} alt={photo.altText || photo.filename} quiet loading={eager ? 'eager' : 'lazy'} />
            : photo.mediaType === 'video_file' ? <video src={`/api/media/${photo.id}`} preload="none" muted playsInline aria-hidden="true" />
            : <LoadingImage src={getPublicImageUrl(photo.id, 640)} alt={photo.altText || photo.filename} quiet loading={eager ? 'eager' : 'lazy'} />}
        </div>
        {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
      </Link>
      {photo.eventDate && !captionIncludesDate(photo.caption, photo.eventDate) && <time className={`${v5.mono} ${styles.date}`} dateTime={photo.eventDate.replace(/\./g, '-')}>{photo.eventDate}</time>}
    </article>
  );
}

/** The server's first screen applies only to the order it was rendered for. */
interface InitialArchive { sort: ArchiveBrowseState['sort']; seed: number; page: PublicPage<GalleryPhoto>; }

export default function ArchivePageClient({ total, initial }: { total: number; initial?: InitialArchive }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { sort, seed, page } = archiveBrowseState(searchParams);
  const listRef = useRef<HTMLUListElement>(null);
  const restoredHref = useRef('');
  const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const browse = { sort, seed, page: currentPage, from: '' };
  const initialPage = initial && initial.sort === sort && initial.seed === seed ? initial.page : undefined;
  const eagerCount = initialPage?.items.length ?? 0;
  const loadPage = useCallback((offset: number, signal: AbortSignal) => fetchPublicPage<GalleryPhoto>(`/api/archive?sort=${sort}&seed=${seed}&offset=${offset}`, signal), [sort, seed]);
  const restorePosition = useCallback(() => {
    const href = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (restoredHref.current === href) return;
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!id.startsWith('archive-item-')) return;
    const target = document.getElementById(id);
    if (!target || !listRef.current?.contains(target)) return;
    // Wait until the previous list depth exists before restoring its scroll geometry.
    if ((listRef.current?.querySelectorAll('a').length ?? 0) < Math.min(total, currentPage * ARCHIVE_PAGE_SIZE)) return;
    restoredHref.current = href;
    target.focus({ preventScroll: true });
    try {
      const position = JSON.parse(sessionStorage.getItem(RETURN_POSITION_KEY) || 'null');
      if (position?.href === `${window.location.pathname}${window.location.search}${window.location.hash}` && typeof position.y === 'number' && Number.isFinite(position.y) && position.y >= 0) {
        window.scrollTo({ top: position.y, behavior: 'instant' });
        return;
      }
    } catch { /* A direct link can restore the item without a saved scroll position. */ }
    target.scrollIntoView?.({ block: 'center', behavior: 'instant' });
  }, [total, currentPage]);
  return (
    <PageLayout title={t('gallery_title')} motionRevision={`${sort}:${seed}:${currentPage}`} animateEntry={false}
      meta={total > 0 && <div className={v5.readout}><span className={v5.label}>{t('gallery_items')}</span><span>{String(total).padStart(2, '0')}</span></div>}>
      {total === 0 ? <p className={`${v5.plate} ${v5.pad} ${styles.empty}`}>{t('gallery_empty')}</p> : <section className={v5.plate} aria-label={t('gallery_title')}>
        <div className={styles.toolbar}>
          <span className={`${v5.label} ${styles.total}`} aria-hidden="true">{t('gallery_sort')}</span>
          <fieldset className={styles.sort}>
            <legend className="sr-only">{t('gallery_sort')}</legend>
            {(['newest', 'random', 'oldest'] as const).map((value) => (
              <label key={value} className={styles.sortKey}>
                <input type="radio" name="archive-sort" value={value} checked={sort === value} className="sr-only" onChange={() => {
                  window.history.replaceState(null, '', archiveHref({ sort: value, seed: value === 'random' ? crypto.getRandomValues(new Uint32Array(1))[0]! || 1 : seed, page: 1, from: '' }));
                }} />
                <span>{t(`gallery_sort_${value}`)}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <PagedList key={`${sort}:${seed}`} total={total} initialPage={initialPage} loadPage={loadPage} restoreCount={currentPage * ARCHIVE_PAGE_SIZE} restoreFromHash={currentPage === 1}
          onItemsRendered={restorePosition} skeleton={<div className={styles.skeleton}><div /><span /></div>}
          listRef={listRef} label={t('gallery_items')} className={styles.grid}
          renderItem={(photo, index, visibleCount) => <GridItem photo={photo} eager={index < eagerCount} browse={{ ...browse, page: Math.ceil(visibleCount / ARCHIVE_PAGE_SIZE) }} />} />
      </section>}
    </PageLayout>
  );
}
