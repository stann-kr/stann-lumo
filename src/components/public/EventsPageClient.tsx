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
import styles from './EventsPageClient.module.css';
import type { EventsPageMeta } from '@/capabilities/content/content';
import type { Performance } from '@/capabilities/events/events';
import { performanceDate, performanceLocation } from '@/capabilities/events/events';

interface EventsPageClientProps {
  eventsMeta: EventsPageMeta;
  schedule: { today: string; upcoming: number; past: number };
}

function EventRow({ event, featured = false, past = false }: { event: Performance; featured?: boolean; past?: boolean }) {
  const location = performanceLocation(event);
  // Every RA listing starts as 'Announced'; show only cancellations and still-open TBA dates.
  const showStatus = event.status === 'Cancelled' || (!past && event.status === 'TBA');
  return (
    <Link href={`/events/${event.id}`} prefetch={false} className={styles.row} data-featured={featured} data-past={past}>
      <div className={styles.date}><time dateTime={performanceDate(event.date)}>{performanceDate(event.date)}</time>{event.time && <span>{event.time}</span>}</div>
      <h3 data-hover-label>{event.title}</h3>
      <div className={styles.venue}>{event.venue}{location && <span>{location}</span>}</div>
      <span className={styles.status} data-cancelled={event.status === 'Cancelled'}>{showStatus ? event.status : ''}</span>
      {event.posterImageId && <LoadingImage src={getPublicImageUrl(event.posterImageId)} alt="" className={styles.poster} data-hover-image />}
      <i className={styles.rowRule} aria-hidden="true" />
    </Link>
  );
}

function EventList({ total, section, today, label }: { total: number; section: 'upcoming' | 'past'; today: string; label: string }) {
  const loadPage = useCallback((offset: number, signal: AbortSignal) => fetchPublicPage<Performance>(`/api/events?section=${section}&today=${today}&offset=${offset}`, signal), [section, today]);
  return <PagedList total={total} label={label} loadPage={loadPage}
    skeleton={<div className={styles.skeleton}><span /><span /><span /></div>}
    renderItem={(event, index) => <EventRow event={event} featured={section === 'upcoming' && index === 0} past={section === 'past'} />} />;
}

export default function EventsPageClient({ eventsMeta, schedule }: EventsPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <PageLayout title={eventsMeta.title || t('events_title')} subtitle={eventsMeta.subtitle}>
      <section className={styles.section} aria-labelledby="upcoming-events-heading">
        <h2 id="upcoming-events-heading">{eventsMeta.upcomingTitle || t('events_upcoming')} <span>{schedule.upcoming}</span></h2>
        {schedule.upcoming === 0 ? <p className={styles.empty}>{language === 'ko' ? '예정된 공연이 없습니다.' : 'No upcoming events.'}</p> : (
          <EventList total={schedule.upcoming} section="upcoming" today={schedule.today} label={eventsMeta.upcomingTitle || t('events_upcoming')} />
        )}
      </section>
      <section className={styles.section} aria-labelledby="past-events-heading">
        <h2 id="past-events-heading">{eventsMeta.pastTitle || t('events_past')} <span>{schedule.past}</span></h2>
        {schedule.past === 0 ? <p className={styles.empty}>{t('msg_no_items')}</p> : <>
          <EventList total={schedule.past} section="past" today={schedule.today} label={eventsMeta.pastTitle || t('events_past')} />
        </>}
      </section>
    </PageLayout>
  );
}
