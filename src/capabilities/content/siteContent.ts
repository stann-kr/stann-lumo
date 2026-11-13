import type { ArtistInfoItem, ContactItem, ContactPageMeta, LinkPageMeta, LinkPlatform } from './content';
import type { EventsInfo } from '@/capabilities/events/events';
import type { TerminalInfo } from '@/capabilities/terminal/terminalConfig';
import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_NAME, SOUNDCLOUD_URL } from '@/constants/site';

/**
 * Public artist, Contact and Link copy kept in code, like the press kit (the About page became /press-kit in 2026-11).
 * These were admin-edited D1 rows until 2026-11; the values below are the production rows at that time
 * (English only — Korean already fell back to English). The tables stay in D1 for rollback but are no longer read.
 * Edit here and deploy to change them.
 */

export const SITE_ARTIST_INFO: ArtistInfoItem[] = [
  { id: 'name', key: 'Name', value: SITE_NAME },
  { id: 'genre', key: 'Genre', value: 'Techno' },
  { id: 'location', key: 'Location', value: 'Seoul, South Korea' },
];

export const SITE_CONTACT_INFO: ContactItem[] = [
  { label: 'Email', value: CONTACT_EMAIL, icon: 'ri-mail-line' },
];

export const SITE_BOOKING_INFO: EventsInfo = {
  contactEmail: CONTACT_EMAIL,
  responseTime: 'Within 48 hours',
  setDurations: ['90+ Mins (DJ Set)', '60 - 90 Mins (Live Set)'],
  technicalRequirements: ['3x CDJ-2000NXS2 or better (Min. 2x required)', '1x Xone 96 or DJM-V10'],
};

export const SITE_LINK_PLATFORMS: LinkPlatform[] = [
  { id: 'instagram', platform: 'Instagram', url: INSTAGRAM_URL, icon: 'ri-instagram-line', description: 'Stann Lumo Instagram' },
  { id: 'soundcloud', platform: 'SoundCloud', url: SOUNDCLOUD_URL, icon: 'ri-soundcloud-line', description: 'Platform description' },
];

export const SITE_TERMINAL_INFO: TerminalInfo = {
  url: 'https://terminal.stann.kr',
  description: 'Terminal Platform',
  customFields: [],
  style: { fontSize: 'md', animationSpeed: 'normal', promptText: '>', showEmbed: false, embedHeight: '400px' },
};

/** Page headings were empty in production, so each page uses its translated default. */
export const SITE_CONTACT_META: ContactPageMeta = { title: '', subtitle: '', guestbookTitle: '', directTitle: '', bookingTitle: '' };
export const SITE_LINK_META: LinkPageMeta = { title: '', subtitle: '', terminalTitle: '' };
