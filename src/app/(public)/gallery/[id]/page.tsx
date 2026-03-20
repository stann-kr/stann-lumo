'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { GalleryPhoto, GalleryData } from '@/types/content';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import PageLayout from '@/components/feature/PageLayout';

const GalleryPhotoPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((json: { success: boolean; data: GalleryData }) => {
        if (json.success) setPhotos(json.data.photos);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const currentIndex = photos.findIndex((p) => p.id === id);
  const photo = currentIndex >= 0 ? photos[currentIndex] : null;
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevPhoto) router.push(`/gallery/${prevPhoto.id}`);
      if (e.key === 'ArrowRight' && nextPhoto) router.push(`/gallery/${nextPhoto.id}`);
      if (e.key === 'Escape') router.push('/gallery');
    },
    [prevPhoto, nextPhoto, router],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <PageLayout title="...">
        <p className="text-[var(--color-secondary)]/40 text-sm tracking-widest animate-pulse">
          LOADING...
        </p>
      </PageLayout>
    );
  }

  if (!photo) {
    return (
      <PageLayout title="NOT FOUND">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] transition-colors"
        >
          <i className="ri-arrow-left-line"></i>
          {t('back') || 'BACK TO GALLERY'}
        </Link>
      </PageLayout>
    );
  }

  // 타이틀: 파일명 제외, caption > altText > 인덱스 순 폴백
  const pageTitle = photo.caption || photo.altText
    || `${t('gallery_label') || 'GALLERY'} ${currentIndex + 1}`;

  // 카테고리 뱃지
  const categoryLabel =
    photo.linkedEventId          ? 'EVENT'
    : photo.mediaType === 'video_youtube' ? 'YOUTUBE'
    : photo.mediaType === 'video_file'    ? 'VIDEO'
    : 'PHOTO';
  const categoryIcon =
    photo.linkedEventId          ? 'ri-calendar-event-line'
    : photo.mediaType === 'video_youtube' ? 'ri-youtube-line'
    : photo.mediaType === 'video_file'    ? 'ri-film-line'
    : 'ri-image-line';

  return (
    <PageLayout title={pageTitle}>
      {/* 상단 — 뒤로가기 + 카테고리 + 인덱스 */}
      <div className="flex items-center justify-between">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] transition-colors"
        >
          <i className="ri-arrow-left-line"></i>
          GALLERY
        </Link>
        <div className="flex items-center gap-4">
          {/* 카테고리 뱃지 */}
          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest px-2 py-1 border"
            style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)', color: 'var(--color-accent)', opacity: 0.7 }}>
            <i className={`${categoryIcon} text-xs`}></i>
            {categoryLabel}
          </span>
          {photos.length > 0 && (
            <span className="text-xs text-[var(--color-secondary)]/30 tracking-widest">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
        </div>
      </div>

      {/* 미디어 + 좌우 화살표 오버레이 */}
      <div className="relative">
        {photo.mediaType === 'video_youtube' && photo.videoYoutubeId ? (
          <div className="w-full aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${photo.videoYoutubeId}`}
              allow="encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full"
              title={photo.altText || photo.filename}
            />
          </div>
        ) : photo.mediaType === 'video_file' ? (
          <video
            src={`/api/media/${photo.id}`}
            controls
            className="w-full max-h-[70vh] object-contain"
          />
        ) : (
          <img
            src={`/api/media/${photo.id}`}
            alt={photo.altText || photo.filename}
            className="w-full object-contain"
            style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }}
          />
        )}

        {/* 이전 화살표 오버레이 */}
        {prevPhoto && (
          <Link
            href={`/gallery/${prevPhoto.id}`}
            className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-[var(--color-bg)]/60 to-transparent"
            aria-label="Previous photo"
          >
            <i className="ri-arrow-left-s-line text-3xl text-[var(--color-secondary)]"></i>
          </Link>
        )}

        {/* 다음 화살표 오버레이 */}
        {nextPhoto && (
          <Link
            href={`/gallery/${nextPhoto.id}`}
            className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-[var(--color-bg)]/60 to-transparent"
            aria-label="Next photo"
          >
            <i className="ri-arrow-right-s-line text-3xl text-[var(--color-secondary)]"></i>
          </Link>
        )}
      </div>

      {/* 캡션 + 이벤트 링크 + 화살표 버튼 */}
      <div className="flex items-start justify-between gap-6 border-t pt-6" style={borderFaint}>
        <div className="space-y-2 flex-1">
          {photo.caption && (
            <p className="text-sm text-[var(--color-secondary)]/70 tracking-wider leading-relaxed">
              {photo.caption}
            </p>
          )}
          {photo.linkedEventId && (
            <Link
              href={`/events/${photo.linkedEventId}`}
              className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--color-accent)] hover:opacity-70 transition-opacity"
            >
              <i className="ri-calendar-event-line"></i>
              VIEW EVENT
            </Link>
          )}
        </div>

        {/* 이전/다음 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={prevPhoto ? `/gallery/${prevPhoto.id}` : '/gallery'}
            className={`w-10 h-10 border flex items-center justify-center transition-colors ${
              prevPhoto
                ? 'text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 cursor-pointer'
                : 'text-[var(--color-secondary)]/20 cursor-not-allowed pointer-events-none'
            }`}
            style={borderMid}
            aria-disabled={!prevPhoto}
          >
            <i className="ri-arrow-left-line text-sm"></i>
          </Link>
          <Link
            href={nextPhoto ? `/gallery/${nextPhoto.id}` : '/gallery'}
            className={`w-10 h-10 border flex items-center justify-center transition-colors ${
              nextPhoto
                ? 'text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 cursor-pointer'
                : 'text-[var(--color-secondary)]/20 cursor-not-allowed pointer-events-none'
            }`}
            style={borderMid}
            aria-disabled={!nextPhoto}
          >
            <i className="ri-arrow-right-line text-sm"></i>
          </Link>
        </div>
      </div>

      {/* 키보드 힌트 */}
      <p className="text-[var(--color-secondary)]/20 text-xs tracking-widest">
        ← → {t('gallery_navigate') || 'NAVIGATE'} · ESC {t('gallery_back') || 'BACK TO GALLERY'}
      </p>
    </PageLayout>
  );
};

export default GalleryPhotoPage;
