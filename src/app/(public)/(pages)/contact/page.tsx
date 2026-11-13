import type { Metadata } from 'next';
import ContactPageClient from '@/components/public/ContactPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getContactProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  const projection = await getContactProjection(await getRequestLocale());
  return createPublicMetadata({
    title: projection.pageMeta.contact.title || 'Contact',
    description: projection.pageMeta.contact.subtitle || 'Booking and contact information for STANN LUMO',
    path: '/contact',
  });
}

export default async function ContactPage() {
  const projection = await getContactProjection(await getRequestLocale());
  return (
    <ContactPageClient
      contactMeta={projection.pageMeta.contact}
      contactInfo={projection.contactInfo}
      bookingInfo={projection.eventsInfo}
    />
  );
}
