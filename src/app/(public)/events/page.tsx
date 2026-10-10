import type { Metadata } from 'next';
import EventsPageClient from '@/components/public/EventsPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getEventsProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  const projection = await getEventsProjection(await getRequestLocale());
  return createPublicMetadata({ title: projection.pageMeta.events.title || 'Events', description: projection.pageMeta.events.subtitle || 'Upcoming and past performances by STANN LUMO', path: '/events' });
}

export default async function EventsPage() {
  const projection = await getEventsProjection(await getRequestLocale());
  return <EventsPageClient eventsMeta={projection.pageMeta.events} schedule={projection.schedule} />;
}
