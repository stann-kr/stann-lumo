import type { Metadata } from 'next';
import EventsPageClient from '@/components/public/EventsPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getEventsPage, getEventsProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  const projection = await getEventsProjection(await getRequestLocale());
  return createPublicMetadata({ title: projection.pageMeta.events.title || 'Events', description: projection.pageMeta.events.subtitle || 'Upcoming and past performances by STANN LUMO', path: '/events' });
}

export default async function EventsPage() {
  const projection = await getEventsProjection(await getRequestLocale());
  const { today } = projection.schedule;
  const [upcoming, past] = await Promise.all([getEventsPage('upcoming', today, 0), getEventsPage('past', today, 0)]);
  return <EventsPageClient eventsMeta={projection.pageMeta.events} schedule={projection.schedule} initial={{ upcoming, past }} />;
}
