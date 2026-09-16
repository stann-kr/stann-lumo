'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link, { usePublicNavigation } from '../feature/PublicLink';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPublicImageUrl, type GalleryPhoto } from '@/capabilities/media/media';
import styles from './ArchiveDetailPageClient.module.css';
import LoadingImage from '@/capabilities/media/LoadingImage';
import { useContentMotion } from '../feature/useContentMotion';
import { archiveHref, archiveReturnHref, type ArchiveBrowseState } from '@/capabilities/media/archiveBrowsing';

interface ArchiveDetailPageClientProps {
  photo: GalleryPhoto;
  previous: GalleryPhoto | null;
  next: GalleryPhoto | null;
  index: number;
  total: number;
  browse?: ArchiveBrowseState;
}

export default function ArchiveDetailPageClient({ photo, previous, next, index, total, browse = { sort: 'newest', seed: 1, page: 1, from: '' } }: ArchiveDetailPageClientProps) {
  const pageRef = useRef<HTMLElement>(null);
  useContentMotion(pageRef, photo.id);
  const navigate = usePublicNavigation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const itemLabel = photo.caption || photo.altText || `${t('gallery_label')} ${index + 1}`;
  const previousLabel = isKorean ? '이전 아카이브 항목' : 'Previous archive item';
  const nextLabel = isKorean ? '다음 아카이브 항목' : 'Next archive item';
  const backHref = archiveReturnHref(browse);
  const previousHref = previous ? archiveHref(browse, previous.id) : null;
  const nextHref = next ? archiveHref(browse, next.id) : null;
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (pageRef.current?.closest('[inert]')) return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Player controls, text entry and an open navigation dialog own their own keys.
    if (event.target instanceof Element && event.target.closest('input, textarea, select, video, audio, iframe, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="slider"]')) return;
    const href = event.key === 'ArrowLeft' ? previousHref
      : event.key === 'ArrowRight' ? nextHref
      : event.key === 'Escape' ? backHref : null;
    if (href) { event.preventDefault(); navigate(href, event.key === 'Escape' ? { scroll: false } : undefined); }
  }, [nextHref, previousHref, backHref, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <article ref={pageRef} className={styles.page} aria-label={`Archive item: ${itemLabel}`}>
      <header className={styles.header}>
        <Link href={backHref} scroll={false}>{t('gallery_title')}</Link>
        <h1>{t('gallery_sort_' + browse.sort)} <span>{index + 1} / {total}</span><span className="sr-only"> — {itemLabel}</span></h1>
      </header>
      <div className={styles.detail}>
        <div className={styles.media}>
          {photo.mediaType === 'video_youtube' && photo.videoYoutubeId ? <iframe src={`https://www.youtube.com/embed/${photo.videoYoutubeId}`} allow="encrypted-media; fullscreen" allowFullScreen title={photo.altText || photo.filename} />
            : photo.mediaType === 'video_file' ? <video src={`/api/media/${photo.id}`} controls preload="metadata" aria-label={itemLabel} />
            : <LoadingImage src={getPublicImageUrl(photo.id)} alt={photo.altText || photo.filename} loading="eager" natural />}
        </div>
        <div className={styles.info}>
          <p className={styles.type}>{photo.mediaType === 'video_youtube' ? 'YouTube' : photo.mediaType === 'video_file' ? (isKorean ? '영상' : 'Video') : (isKorean ? '이미지' : 'Image')}</p>
          {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
          {photo.eventDate && <time dateTime={photo.eventDate.replace(/\./g, '-')}>{photo.eventDate}</time>}
          {photo.linkedEventId && <Link href={`/events/${photo.linkedEventId}`} className={styles.event}>{isKorean ? '공연 보기' : 'View event'}</Link>}
          <nav className={styles.navigation} aria-label={isKorean ? '아카이브 탐색' : 'Archive navigation'}>
            {previousHref ? <Link href={previousHref} aria-label={previousLabel} aria-keyshortcuts="ArrowLeft">{isKorean ? '이전' : 'Previous'}</Link>
              : <button type="button" aria-label={isKorean ? '이전 아카이브 항목 없음' : 'No previous archive item'} disabled>{isKorean ? '이전' : 'Previous'}</button>}
            {nextHref ? <Link href={nextHref} aria-label={nextLabel} aria-keyshortcuts="ArrowRight">{isKorean ? '다음' : 'Next'}</Link>
              : <button type="button" aria-label={isKorean ? '다음 아카이브 항목 없음' : 'No next archive item'} disabled>{isKorean ? '다음' : 'Next'}</button>}
          </nav>
          <p className={styles.hint}>{isKorean ? '← → 이전·다음 / Esc 목록으로' : '← → Previous / next · Esc back to archive'}</p>
        </div>
      </div>
    </article>
  );
}
