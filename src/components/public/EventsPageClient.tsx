'use client';

import { getPublicImageUrl } from '@/capabilities/media/media';

import { useCallback } from 'react';
import Link from '../feature/PublicLink';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/feature/PageLayout';
import PagedList from '@/components/feature/PagedList';
import LoadingImage from '@/capabilities/media/LoadingImage';
import { fetchPublicPage } from '@/capabilities/content/publicPagination';
import { useLanguage } from '@/contexts/LanguageContext';
import v5 from '@/styles/v5.module.css';
import styles from './EventsPageClient.module.css';
import type { EventsPageMeta } from '@/capabilities/content/content';
import type { Performance } from '@/capabilities/events/events';
import { performanceDate, performanceLocation } from '@/capabilities/events/events';

interface EventsPageClientProps {
  eventsMeta: EventsPageMeta;
  schedule: { today: string; upcoming: number; past: number };
}

function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${performanceDate(date)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

function EventRow({ event, today, featured = false, past = false }: { event: Performance; today: string; featured?: boolean; past?: boolean }) {
  const location = performanceLocation(event);
  // Every RA listing starts as 'Announced'; show only cancellations and still-open TBA dates.
  const showStatus = event.status === 'Cancelled' || (!past && event.status === 'TBA');
  const days = past ? 0 : Math.max(0, daysUntil(event.date, today));
  return (
    <Link href={`/events/${event.id}`} prefetch={false} className={styles.row} data-featured={featured} data-past={past}>
      <div className={styles.date}><time className={v5.mono} dateTime={performanceDate(event.date)}>{performanceDate(event.date)}</time>{event.time && <span className={v5.mono}>{event.time}</span>}</div>
      <h3 className={styles.title}>{event.title}</h3>
      <div className={styles.venue}>{event.venue}{location && <span className={v5.label}>{location}</span>}</div>
      <span className={`${v5.label} ${styles.status}`} data-cancelled={event.status === 'Cancelled'}>
        {showStatus ? event.status : past ? '' : <>{featured && <span className={v5.lamp} aria-hidden="true" />}D-{String(days).padStart(2, '0')}</>}
      </span>
      {event.posterImageId ? <LoadingImage src={getPublicImageUrl(event.posterImageId)} alt="" className={styles.poster} quiet />
        : <span className={styles.arrow} aria-hidden="true">→</span>}
    </Link>
  );
}

function EventList({ total, section, today, label }: { total: number; section: 'upcoming' | 'past'; today: string; label: string }) {
  const loadPage = useCallback((offset: number, signal: AbortSignal) => fetchPublicPage<Performance>(`/api/events?section=${section}&today=${today}&offset=${offset}`, signal), [section, today]);
  return <PagedList total={total} label={label} loadPage={loadPage} className={styles.rows}
    skeleton={<div className={styles.skeleton} data-past={section === 'past'}><span /><span /><span /><span /></div>}
    renderItem={(event, index) => <EventRow event={event} today={today} featured={section === 'upcoming' && index === 0} past={section === 'past'} />} />;
}

export default function EventsPageClient({ eventsMeta, schedule }: EventsPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const upcomingTitle = eventsMeta.upcomingTitle || t('events_upcoming');
  const pastTitle = eventsMeta.pastTitle || t('events_past');

  return (
    <PageLayout title={eventsMeta.title || t('events_title')} subtitle={eventsMeta.subtitle} meta={<>
      <div className={v5.readout} data-signal={schedule.upcoming > 0}><span className={v5.label}>{upcomingTitle}</span><span>{String(schedule.upcoming).padStart(2, '0')}</span></div>
      <div className={v5.readout}><span className={v5.label}>{pastTitle}</span><span>{String(schedule.past).padStart(2, '0')}</span></div>
    </>}>
      <section className={v5.plate} aria-labelledby="upcoming-events-heading">
        <div className={v5.band}><h2 id="upcoming-events-heading" className={v5.label}>{upcomingTitle} <span className={v5.muted}>{schedule.upcoming}</span></h2></div>
        {schedule.upcoming === 0 ? <p className={styles.empty}>{language === 'ko' ? '예정된 공연이 없습니다.' : 'No upcoming events.'}</p> : (
          <EventList total={schedule.upcoming} section="upcoming" today={schedule.today} label={upcomingTitle} />
        )}
      </section>
      <section className={`${v5.inset} ${styles.past}`} aria-labelledby="past-events-heading">
        <div className={v5.band}><h2 id="past-events-heading" className={v5.label}>{pastTitle} <span className={v5.muted}>{schedule.past}</span></h2></div>
        {schedule.past === 0 ? <p className={styles.empty}>{t('msg_no_items')}</p> : (
          <EventList total={schedule.past} section="past" today={schedule.today} label={pastTitle} />
        )}
      </section>
    </PageLayout>
  );
}
