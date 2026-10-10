import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventDetailPageClient from '@/components/public/EventDetailPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getEventDetail } from '@/capabilities/content/publicContent.server';
import { getPublicImageUrl } from '@/capabilities/media/media';

interface EventDetailPageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const detail = await getEventDetail((await params).id);
  if (!detail) return createPublicMetadata({ title: 'Event not found', description: 'The requested STANN LUMO event is unavailable.', path: '/events' });
  const { event, posterPhoto } = detail;
  return createPublicMetadata({
    title: event.title,
    description: [event.date.replace(/\./g, '-'), event.venue, event.location].filter(Boolean).join(' · '),
    path: `/events/${event.id}`,
    ...(posterPhoto && { image: { url: getPublicImageUrl(posterPhoto.id), alt: posterPhoto.altText || `${event.title} poster` } }),
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const detail = await getEventDetail((await params).id);
  if (!detail) notFound();
  return <EventDetailPageClient event={detail.event} posterPhoto={detail.posterPhoto} />;
}
