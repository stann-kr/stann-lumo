import type { Performance } from '@/capabilities/events/events';
import { performanceDate, performanceLocation } from '@/capabilities/events/events';
import { INSTAGRAM_URL, SITE_NAME, SOUNDCLOUD_URL } from '@/constants/site';
import { SITE_URL } from '@/capabilities/site/publicMetadata';

/** schema.org JSON-LD for search engines: the artist on the home page, and each event on its detail page. */
type JsonLd = Record<string, unknown>;

const absolute = (path: string) => new URL(path, SITE_URL).toString();

function artist(): JsonLd {
  return {
    '@type': 'MusicGroup',
    name: SITE_NAME,
    url: SITE_URL.toString(),
    genre: 'Techno',
    sameAs: [INSTAGRAM_URL, SOUNDCLOUD_URL],
  };
}

/** Names the site for search results; without it Google labels results with the bare domain. */
export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['Stann Lumo', 'STANNLUMO'],
    url: SITE_URL.toString(),
  };
}

export function artistJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    ...artist(),
    image: absolute('/og.jpg'),
    description: 'Techno DJ and producer based in Seoul, resident at Faust Seoul.',
  };
}

const EVENT_STATUS: Record<Performance['status'], string> = {
  Announced: 'https://schema.org/EventScheduled',
  TBA: 'https://schema.org/EventScheduled',
  Cancelled: 'https://schema.org/EventCancelled',
};

export function eventJsonLd(event: Performance, posterUrl?: string): JsonLd {
  const locality = performanceLocation(event);
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    url: absolute(`/events/${event.id}`),
    // The site keeps a day, not a start time, so the event is dated rather than timed.
    startDate: performanceDate(event.date),
    eventStatus: EVENT_STATUS[event.status],
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue || locality || event.title,
      address: {
        '@type': 'PostalAddress',
        ...(locality && { addressLocality: locality }),
        ...(event.raCountryName && { addressCountry: event.raCountryName }),
      },
    },
    performer: artist(),
    ...(posterUrl && { image: absolute(posterUrl) }),
    ...(event.raEventLink && event.raHasTickets && event.status !== 'Cancelled' && {
      offers: { '@type': 'Offer', url: event.raEventLink, availability: 'https://schema.org/InStock' },
    }),
  };
}

/** Serialized for a <script type="application/ld+json">: `<` is escaped so text from the CMS cannot close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
