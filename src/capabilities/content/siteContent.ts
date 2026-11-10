import type { ArtistInfoItem, ContactItem, ContactPageMeta, DynamicSection, LinkPageMeta, LinkPlatform } from './content';
import type { EventsInfo } from '@/capabilities/events/events';
import type { TerminalInfo } from '@/capabilities/terminal/terminalConfig';
import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_NAME, SOUNDCLOUD_URL } from '@/constants/site';

/**
 * Public About, Contact and Link copy kept in code, like the press kit.
 * These were admin-edited D1 rows until 2026-11; the values below are the production rows at that time
 * (English only — Korean already fell back to English). The tables stay in D1 for rollback but are no longer read.
 * Edit here and deploy to change them.
 */

export const SITE_ARTIST_INFO: ArtistInfoItem[] = [
  { id: 'name', key: 'Name', value: SITE_NAME },
  { id: 'genre', key: 'Genre', value: 'Techno' },
  { id: 'location', key: 'Location', value: 'Seoul, South Korea' },
];

export const SITE_ABOUT_SECTIONS: DynamicSection[] = [
  {
    id: 'biography',
    title: 'BIOGRAPHY',
    type: 'philosophy-items',
    order: 0,
    items: [{
      id: 'biography-1',
      quote: 'Seoul-based DJ Stann Lumo captivates audiences with his primal sound and deep mixing, pushing the boundaries of techno as a resident at Club Faust while gaining international recognition.',
      description: [
        'Seoul-based DJ Stann Lumo delivers tracks infused with primal sound and intense energy, captivating audiences with his commanding stage presence.',
        'His unique style is defined by instinctive rhythm, deep mixing, and raw, unrefined sound, all while wrapping listeners in an atmosphere that feels otherworldly.',
        'This distinctive approach creates a powerful sense of immersion, pushing the boundaries of traditional techno and showcasing his musical prowess.',
        "Currently a resident DJ at Seoul's iconic techno club Faust, Stann Lumo is also gaining international recognition, with impressive performances in cities like Berlin, Glasgow, and Mongolia.",
      ].join('\n\n'),
    }],
  },
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
