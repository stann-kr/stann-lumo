'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import type { Performance, GalleryPhoto } from '@/types/content';

interface EventDetailData {
  event: Performance;
  posterPhoto?: GalleryPhoto;
}

const STATUS_CLASSES: Record<Performance['status'], string> = {
  Announced: 'text-green-400',
  TBA:       'text-yellow-400',
  Cancelled: 'text-red-400',
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const [data, setData] = useState<EventDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error?.message || 'Event not found');
        }
      })
      .catch(() => setError('Failed to load event'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <PageLayout title="...">
        <p className="text-[var(--color-secondary)]/40 text-sm tracking-widest animate-pulse">
          LOADING...
        </p>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout title="EVENT NOT FOUND">
        <p className="text-[var(--color-secondary)]/60 text-sm tracking-wider">{error}</p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] transition-colors mt-4"
        >
          <i className="ri-arrow-left-line"></i>
          {t('back') || 'BACK TO EVENTS'}
        </Link>
      </PageLayout>
    );
  }

  const { event, posterPhoto } = data;

  return (
    <PageLayout title={event.title} subtitle={`${event.venue}${event.location ? ` · ${event.location}` : ''}`}>
      {/* 뒤로가기 */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] transition-colors"
      >
        <i className="ri-arrow-left-line"></i>
        {t('back') || 'BACK TO EVENTS'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* 포스터 이미지 */}
        {posterPhoto && (
          <div className="order-1 lg:order-2">
            <img
              src={`/api/media/${posterPhoto.id}`}
              alt={posterPhoto.altText || event.title}
              className="w-full object-contain"
              style={{ objectPosition: `${posterPhoto.focalX}% ${posterPhoto.focalY}%` }}
            />
          </div>
        )}

        {/* 이벤트 정보 */}
        <div className={`order-2 ${posterPhoto ? 'lg:order-1' : ''} space-y-6`}>
          {/* 날짜 / 시간 */}
          <div className="space-y-1 border-b pb-6" style={borderFaint}>
            <p className="text-xs tracking-widest text-[var(--color-accent)]">DATE</p>
            <p className="text-2xl font-mono text-[var(--color-secondary)]">{event.date}</p>
            {event.time && (
              <p className="text-sm font-mono text-[var(--color-secondary)]/60">{event.time}</p>
            )}
          </div>

          {/* 장소 / 위치 */}
          <div className="space-y-1 border-b pb-6" style={borderFaint}>
            <p className="text-xs tracking-widest text-[var(--color-accent)]">VENUE</p>
            <p className="text-lg text-[var(--color-secondary)]">{event.venue}</p>
            {event.location && (
              <p className="text-sm text-[var(--color-secondary)]/60">{event.location}</p>
            )}
          </div>

          {/* 라인업 */}
          {event.lineup && (
            <div className="space-y-1 border-b pb-6" style={borderFaint}>
              <p className="text-xs tracking-widest text-[var(--color-accent)]">LINEUP</p>
              <p className="text-sm text-[var(--color-secondary)]/80 leading-relaxed whitespace-pre-line">
                {event.lineup}
              </p>
            </div>
          )}

          {/* 상태 */}
          <div className="space-y-1">
            <p className="text-xs tracking-widest text-[var(--color-accent)]">STATUS</p>
            <p className={`text-sm font-mono tracking-widest ${STATUS_CLASSES[event.status]}`}>
              {event.status.toUpperCase()}
            </p>
          </div>

          {/* RA 링크 */}
          {event.raEventLink && (
            <a
              href={event.raEventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border text-xs tracking-widest text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors"
              style={borderMid}
            >
              <i className="ri-external-link-line"></i>
              VIEW ON RESIDENT ADVISOR
            </a>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default EventDetailPage;
