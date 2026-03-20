'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { GalleryPhoto, GallerySettings, GalleryData } from '@/types/content';
import { createBorderFaint } from '@/utils/colorMix';
import PageLayout from '@/components/feature/PageLayout';

// ─── 설정 → CSS 클래스 매핑 ──────────────────────────────────────────────────

const COL_MASONRY: Record<number, string> = {
  1: 'columns-1', 2: 'columns-2', 3: 'columns-3', 4: 'columns-4', 5: 'columns-5',
};
const COL_GRID: Record<number, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5',
};
const GAP_MAP: Record<GallerySettings['gapSize'], string> = {
  sm: 'gap-1', md: 'gap-3', lg: 'gap-6',
};
const MB_MAP: Record<GallerySettings['gapSize'], string> = {
  sm: 'mb-1', md: 'mb-3', lg: 'mb-6',
};
const ASPECT_MAP: Record<GallerySettings['aspectRatio'], string> = {
  auto: '',
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '16:9': 'aspect-video',
};

function buildContainerClasses(s: GallerySettings): string {
  const gap = GAP_MAP[s.gapSize];
  if (s.layoutMode === 'masonry') {
    return `${COL_MASONRY[s.columnsMobile]} md:${COL_MASONRY[s.columnsTablet]} lg:${COL_MASONRY[s.columnsDesktop]} ${gap}`;
  }
  return `grid ${COL_GRID[s.columnsMobile]} md:${COL_GRID[s.columnsTablet]} lg:${COL_GRID[s.columnsDesktop]} ${gap}`;
}

function buildHoverClass(effect: GallerySettings['hoverEffect']): string {
  if (effect === 'zoom') return 'group-hover:scale-105';
  if (effect === 'fade') return 'group-hover:opacity-80';
  return '';
}

// ─── 미디어 렌더: 그리드 아이템 ──────────────────────────────────────────────
interface GridItemProps {
  photo: GalleryPhoto;
  settings: GallerySettings;
  onClick: () => void;
}

const GridItem = ({ photo, settings, onClick }: GridItemProps) => {
  const aspectClass = settings.layoutMode === 'grid' ? ASPECT_MAP[settings.aspectRatio] : '';
  const hoverClass = buildHoverClass(settings.hoverEffect);

  const wrapperClass = `${settings.layoutMode === 'masonry' ? `break-inside-avoid ${MB_MAP[settings.gapSize]}` : ''} group cursor-pointer relative overflow-hidden`;
  const mediaClass = `w-full ${aspectClass ? aspectClass + ' object-cover' : 'block'} transition-transform duration-500 ${hoverClass}`;

  let mediaEl: React.ReactNode;
  if (photo.mediaType === 'video_youtube') {
    mediaEl = (
      <div className="relative">
        <img
          src={photo.videoThumbnailUrl ?? ''}
          alt={photo.altText || photo.filename}
          className={mediaClass}
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center">
            <i className="ri-play-fill text-white text-xl ml-0.5"></i>
          </div>
        </div>
      </div>
    );
  } else if (photo.mediaType === 'video_file') {
    mediaEl = (
      <div className="relative">
        <video
          src={`/api/media/${photo.id}`}
          className={mediaClass}
          preload="metadata"
          muted
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-[var(--color-bg)]/70 flex items-center justify-center">
            <i className="ri-play-fill text-[var(--color-secondary)] text-lg"></i>
          </div>
        </div>
      </div>
    );
  } else {
    mediaEl = (
      <img
        src={`/api/media/${photo.id}`}
        alt={photo.altText || photo.filename}
        className={mediaClass}
        style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }}
        loading="lazy"
      />
    );
  }

  return (
    <div className={wrapperClass} onClick={onClick}>
      {mediaEl}

      {/* 캡션 오버레이 */}
      {settings.captionDisplay === 'overlay' && photo.caption && (
        <div className="absolute inset-0 bg-[var(--color-bg)]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <p className="text-[var(--color-secondary)] text-xs tracking-wider leading-relaxed line-clamp-3">
            {photo.caption}
          </p>
        </div>
      )}

      {/* 확대 아이콘 */}
      {settings.lightboxEnabled && (
        <div className="absolute top-3 right-3 w-7 h-7 bg-[var(--color-bg)]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <i className="ri-zoom-in-line text-[var(--color-secondary)] text-sm"></i>
        </div>
      )}

      {/* 캡션 하단 표시 */}
      {settings.captionDisplay === 'below' && photo.caption && (
        <p className="text-[var(--color-secondary)]/60 text-xs tracking-wider leading-relaxed pt-1.5 pb-1">
          {photo.caption}
        </p>
      )}
    </div>
  );
};

// ─── 메인 갤러리 페이지 ──────────────────────────────────────────────────────
const GalleryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [settings, setSettings] = useState<GallerySettings>({
    layoutMode: 'masonry',
    columnsMobile: 2,
    columnsTablet: 3,
    columnsDesktop: 4,
    gapSize: 'md',
    aspectRatio: 'auto',
    hoverEffect: 'zoom',
    captionDisplay: 'overlay',
    lightboxEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/gallery');
        const json = (await res.json()) as { success: boolean; data: GalleryData };
        if (json.success) {
          setPhotos(json.data.photos);
          setSettings(json.data.settings);
        }
      } catch {
        // 조용히 실패 — 빈 갤러리 표시
      } finally {
        setIsLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const borderStyle = createBorderFaint();
  const containerClasses = buildContainerClasses(settings);

  return (
    <PageLayout
      title={t('gallery_title')}
      subtitle={t('gallery_subtitle')}
    >
      {/* 사진 그리드 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-[var(--color-secondary)]/40 text-sm tracking-widest animate-pulse">
            LOADING...
          </div>
        </div>
      ) : photos.length === 0 ? (
        <div className="flex items-center justify-center py-24 border" style={borderStyle}>
          <p className="text-[var(--color-secondary)]/30 text-sm tracking-widest">
            {t('gallery_empty')}
          </p>
        </div>
      ) : (
        <div className={containerClasses}>
          {photos.map((photo) => (
            <GridItem
              key={photo.id}
              photo={photo}
              settings={settings}
              onClick={() => router.push(`/gallery/${photo.id}`)}
            />
          ))}
        </div>
      )}

    </PageLayout>
  );
};

export default GalleryPage;
