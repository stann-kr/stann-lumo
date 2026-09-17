'use client';

import Link from '../feature/PublicLink';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/feature/PageLayout';
import { getPublicImageUrl, type GalleryPhoto } from '@/capabilities/media/media';
import type { Performance } from '@/capabilities/events/events';
import { performanceDate, performanceLocation, performanceToday } from '@/capabilities/events/events';
import styles from './EventDetailPageClient.module.css';
import LoadingImage from '@/capabilities/media/LoadingImage';

export default function EventDetailPageClient({ event, posterPhoto }: { event: Performance; posterPhoto?: GalleryPhoto }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const location = performanceLocation(event);
  const showStatus = event.status === 'Cancelled' || performanceDate(event.date) >= performanceToday();
  return (
    <PageLayout title={event.title} titleSize="display">
      <Link href="/events" className={styles.back}>{t('events_title')}</Link>
      <div className={styles.detail}>
        <aside className={styles.facts} aria-label={isKorean ? '공연 정보' : 'Event information'}>
          <dl>
            <div><dt>{isKorean ? '일시' : 'Date'}</dt><dd><time dateTime={performanceDate(event.date)}>{performanceDate(event.date)}</time>{event.time && <span>{event.time}</span>}</dd></div>
            <div><dt>{isKorean ? '장소' : 'Venue'}</dt><dd>{event.venue}{location && <span>{location}</span>}</dd></div>
            {showStatus && <div><dt>{isKorean ? '상태' : 'Status'}</dt><dd>{event.status}</dd></div>}
            {event.lineup && <div><dt>{isKorean ? '라인업' : 'Lineup'}</dt><dd className={styles.lineup}>{event.lineup}</dd></div>}
          </dl>
          {event.raEventLink && <a href={event.raEventLink} target="_blank" rel="noopener noreferrer" className={styles.external}>{isKorean ? 'Resident Advisor에서 보기' : 'View on Resident Advisor'}<span className="sr-only">{isKorean ? ' (새 창)' : ' (opens in a new tab)'}</span></a>}
        </aside>
        {posterPhoto && <div className={styles.poster}><LoadingImage src={getPublicImageUrl(posterPhoto.id)} alt={posterPhoto.altText || event.title} loading="eager" natural /></div>}
      </div>
    </PageLayout>
  );
}
