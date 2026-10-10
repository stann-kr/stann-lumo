import type { GalleryPhoto } from '@/capabilities/media/media';

export interface Performance {
  id: string;
  date: string;
  venue: string;
  location?: string;
  time?: string;
  title: string;
  lineup?: string;
  raEventLink?: string;
  raEventId?: string;
  posterImageId?: string;
  status: 'Announced' | 'TBA' | 'Cancelled';

  raVenueId?: string;
  raCountryName?: string;
  raAreaName?: string;
  raAreaId?: string;
  raAddress?: string;
  raCost?: string;
  raPromoter?: string;
  raVenueLink?: string;
  raHasTickets?: boolean;
  raHasBarcode?: boolean;
  raPromoterId?: string;
  raLineupRaw?: string;
}

export interface EventsInfo {
  setDurations: string[];
  technicalRequirements: string[];
  contactEmail: string;
  responseTime: string;
}

export interface EventsContent {
  performances: Performance[];
  eventsInfo: EventsInfo;
}

export interface EventDetailData {
  event: Performance;
  posterPhoto?: GalleryPhoto;
}

export function performanceDate(date: string): string {
  return date.replace(/\./g, '-').slice(0, 10);
}

export function performanceToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function performanceSchedule(performances: readonly Performance[], today = performanceToday()) {
  const upcoming = performances.filter((event) => performanceDate(event.date) >= today)
    .sort((a, b) => performanceDate(a.date).localeCompare(performanceDate(b.date)));
  const past = performances.filter((event) => performanceDate(event.date) < today)
    .sort((a, b) => performanceDate(b.date).localeCompare(performanceDate(a.date)));
  return { upcoming, past };
}

export function performanceLocation(event: Pick<Performance, 'venue' | 'location' | 'raCountryName'>): string {
  // RA uses "All" for an area-wide result, not a location visitors can use.
  const location = event.location?.trim();
  return location?.toLowerCase() === 'all' ? event.raCountryName || ''
    : location === event.venue ? '' : location || '';
}
