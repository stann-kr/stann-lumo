'use client';

import Link from '../feature/PublicLink';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/feature/PageLayout';
import { getPublicImageUrl, type GalleryPhoto } from '@/capabilities/media/media';
import type { Performance } from '@/capabilities/events/events';
import { performanceDate, performanceLocation, performanceToday } from '@/capabilities/events/events';
import LoadingImage from '@/capabilities/media/LoadingImage';
import v5 from '@/styles/v5.module.css';
import styles from './EventDetailPageClient.module.css';

/* v5 event detail: fact rows on a plate beside the poster on an inset plate; tickets are the red signal key. */
export default function EventDetailPageClient({ event, posterPhoto }: { event: Performance; posterPhoto?: GalleryPhoto }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const location = performanceLocation(event);
  const isUpcoming = performanceDate(event.date) >= performanceToday();
  // 'Announced' is the RA default for every listing; only a real exception is worth a line.
  const showStatus = event.status === 'Cancelled' || (event.status === 'TBA' && isUpcoming);
  const hasTickets = Boolean(event.raEventLink && event.raHasTickets && isUpcoming && event.status !== 'Cancelled');
  return (
    <PageLayout title={event.title} titleSize="display" eyebrow={<Link href="/events">{t('events_title')}</Link>}>
      <div className={styles.detail} data-poster={Boolean(posterPhoto)}>
        <aside className={`${v5.plate} ${styles.facts}`} aria-label={isKorean ? '공연 정보' : 'Event information'}>
          <div className={v5.band}><span className={v5.label}>{isUpcoming ? (isKorean ? '예정 공연' : 'Upcoming') : (isKorean ? '지난 공연' : 'Past')}</span></div>
          <dl className={v5.rows}>
            <div className={styles.fact}><dt className={v5.label}>{isKorean ? '일시' : 'Date'}</dt><dd><time className={v5.mono} dateTime={performanceDate(event.date)}>{performanceDate(event.date)}</time>{event.time && <span className={v5.mono}>{event.time}</span>}</dd></div>
            <div className={styles.fact}><dt className={v5.label}>{isKorean ? '장소' : 'Venue'}</dt><dd>{event.venue}{location && <span>{location}</span>}</dd></div>
            {showStatus && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '상태' : 'Status'}</dt><dd>{event.status}</dd></div>}
            {event.lineup && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '라인업' : 'Lineup'}</dt><dd className={styles.lineup}>{event.lineup}</dd></div>}
          </dl>
          {event.raEventLink && (
            <a href={event.raEventLink} target="_blank" rel="noopener noreferrer" className={`${v5.key} ${styles.external} ${hasTickets ? v5.red : ''}`}>
              {hasTickets ? 'Tickets' : (isKorean ? 'Resident Advisor에서 보기' : 'View on Resident Advisor')} ↗<span className="sr-only">{isKorean ? ' (새 창)' : ' (opens in a new tab)'}</span>
            </a>
          )}
        </aside>
        {posterPhoto && <div className={`${v5.inset} ${styles.poster}`}><LoadingImage src={getPublicImageUrl(posterPhoto.id)} alt={posterPhoto.altText || event.title} loading="eager" natural /></div>}
      </div>
    </PageLayout>
  );
}
