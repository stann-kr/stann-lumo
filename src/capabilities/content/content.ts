import type { EventsInfo, Performance } from '@/capabilities/events/events';
import type { TerminalInfo } from '@/capabilities/terminal/terminalConfig';

export type ContentLocale = 'en' | 'ko';

export function isContentLocale(value: unknown): value is ContentLocale {
  return value === 'en' || value === 'ko';
}

export interface ArtistInfoItem {
  id: string;
  key: string;
  value: string;
}

export interface PhilosophyItem {
  id: string;
  quote: string;
  description: string;
}

export type DynamicSectionType = 'paragraphs' | 'philosophy-items';

export interface DynamicSection {
  id: string;
  title: string;
  type: DynamicSectionType;
  order: number;
  paragraphs?: string[];
  items?: PhilosophyItem[];
}

export interface HomePageMeta {
  navTitle: string;
}

export interface MusicPageMeta {
  title: string;
  subtitle: string;
}

export interface EventsPageMeta {
  title: string;
  subtitle: string;
  upcomingTitle: string;
  pastTitle: string;
}

export interface ContactPageMeta {
  title: string;
  subtitle: string;
  guestbookTitle: string;
  directTitle: string;
  bookingTitle: string;
}

export interface LinkPageMeta {
  title: string;
  subtitle: string;
  terminalTitle: string;
}

export interface PageMeta {
  home: HomePageMeta;
  music: MusicPageMeta;
  events: EventsPageMeta;
  contact: ContactPageMeta;
  link: LinkPageMeta;
}

export interface HomePreviews {
  tracks: Pick<Track, 'id' | 'title' | 'type' | 'year' | 'platform' | 'link'>[];
  events: Pick<Performance, 'id' | 'title' | 'date' | 'venue' | 'status' | 'posterImageId'>[];
  photos: { id: string; caption: string; altText: string }[];
  /** Platform names only; the Link page owns the actual URLs. */
  platforms: string[];
}

export interface HomeSection {
  title: string;
  description: string;
  path: string;
  icon: string;
}

export interface Track {
  id: string;
  title: string;
  type: string;
  duration: string;
  year: string;
  platform: string;
  link: string;
}

/** Imported tracks carry a zero placeholder until a real length is entered. */
export function hasKnownDuration(duration?: string): boolean {
  return !!duration && !/^0{1,2}:00(:00)?$/.test(duration.trim());
}

export interface LinkPlatform {
  id: string;
  platform: string;
  url: string;
  icon: string;
  description: string;
}

export interface ContactItem {
  label: string;
  value: string;
  icon: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  bg: string;
  bgSidebar: string;
}

export interface ContentData {
  artistInfo: ArtistInfoItem[];
  aboutSections: DynamicSection[];
  pageMeta: PageMeta;
  homeSections: HomeSection[];
  tracks: Track[];
  performances: Performance[];
  eventsInfo: EventsInfo;
  linkPlatforms: LinkPlatform[];
  terminalInfo: TerminalInfo;
  contactInfo: ContactItem[];
  themeColors?: ThemeColors;
}

export interface MultiLanguageContent {
  en: ContentData;
  ko: ContentData;
}

export interface MusicContent {
  tracks: Track[];
}

export interface ContactContent {
  contactInfo: ContactItem[];
}

export type { EventsContent } from '@/capabilities/events/events';
