/**
 * 아티스트 기본 정보 타입 (동적 key-value 쌍)
 */
export interface ArtistInfoItem {
  id: string;
  key: string;
  value: string;
}

/**
 * 음악 철학 항목 타입
 */
export interface PhilosophyItem {
  id: string;
  quote: string;
  description: string;
}

/**
 * 동적 섹션 타입
 */
export type DynamicSectionType = 'paragraphs' | 'philosophy-items';

/**
 * About 페이지 동적 섹션
 */
export interface DynamicSection {
  id: string;
  title: string;
  type: DynamicSectionType;
  order: number;
  paragraphs?: string[];    // type === 'paragraphs'
  items?: PhilosophyItem[]; // type === 'philosophy-items'
}

/**
 * 홈 페이지 메타
 */
export interface HomePageMeta {
  navTitle: string;
}

/**
 * 음악 페이지 메타
 */
export interface MusicPageMeta {
  title: string;
  subtitle: string;
}

/**
 * 이벤트 페이지 메타
 */
export interface EventsPageMeta {
  title: string;
  subtitle: string;
  upcomingTitle: string;
  pastTitle: string;
}

/**
 * 연락처 페이지 메타
 */
export interface ContactPageMeta {
  title: string;
  subtitle: string;
  guestbookTitle: string;
  directTitle: string;
  bookingTitle: string;
}

/**
 * 링크 페이지 메타
 */
export interface LinkPageMeta {
  title: string;
  subtitle: string;
  terminalTitle: string;
}

/**
 * 전체 페이지 메타
 */
export interface PageMeta {
  home: HomePageMeta;
  music: MusicPageMeta;
  events: EventsPageMeta;
  contact: ContactPageMeta;
  link: LinkPageMeta;
}

/**
 * 홈 섹션 타입
 */
export interface HomeSection {
  title: string;
  description: string;
  path: string;
  icon: string; // Remix Icon class name (e.g., 'ri-user-line')
}

/**
 * 음악 트랙 타입
 */
export interface Track {
  id: string;
  title: string;
  type: string;
  duration: string;
  year: string;
  platform: string;
  link: string;
}

/**
 * 공연 일정 타입
 */
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
}

/**
 * 이벤트 정보 타입
 */
export interface EventsInfo {
  setDurations: string[];
  technicalRequirements: string[];
  contactEmail: string;
  responseTime: string;
}

/**
 * 링크 플랫폼 타입
 */
export interface LinkPlatform {
  id: string;
  platform: string;
  url: string;
  icon: string;
  description: string;
}

/**
 * 터미널 커스텀 필드 타입 (동적 key-value)
 */
export interface TerminalCustomField {
  id: string;
  fieldKey: string;
  fieldValue: string;
  fieldType: 'text' | 'url' | 'badge';
  sortOrder: number;
}

/**
 * 터미널 스타일 설정 타입
 */
export interface TerminalStyleConfig {
  fontSize: 'sm' | 'md' | 'lg';
  animationSpeed: 'slow' | 'normal' | 'fast';
  promptText: string;
  showEmbed: boolean;
  embedHeight: string;
}

/**
 * 터미널 정보 타입
 */
export interface TerminalInfo {
  url: string;
  description: string;
  customFields?: TerminalCustomField[];
  style?: TerminalStyleConfig;
}

/**
 * 연락처 항목 타입
 */
export interface ContactItem {
  label: string;
  value: string;
  icon: string; // Remix Icon class name (e.g., 'ri-mail-line')
}

/**
 * 테마 색상 타입
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  bg: string;
  bgSidebar: string;
}

/**
 * 갤러리 사진 타입
 */
export interface GalleryPhoto {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  caption: string;
  sortOrder: number;
  createdAt: string;
  mediaType: 'image' | 'video_file' | 'video_youtube';
  focalX: number;
  focalY: number;
  videoYoutubeId?: string;
  videoThumbnailUrl?: string;
  linkedEventId?: string;
}

/**
 * 갤러리 레이아웃 설정 타입
 */
export interface GallerySettings {
  layoutMode: 'masonry' | 'grid';
  columnsMobile: 1 | 2;
  columnsTablet: 2 | 3;
  columnsDesktop: 2 | 3 | 4 | 5;
  gapSize: 'sm' | 'md' | 'lg';
  aspectRatio: 'auto' | '1:1' | '4:3' | '3:4' | '16:9';
  hoverEffect: 'zoom' | 'fade' | 'none';
  captionDisplay: 'overlay' | 'below' | 'hidden';
  lightboxEnabled: boolean;
}

/**
 * 갤러리 응답 데이터 타입 (photos + settings)
 */
export interface GalleryData {
  photos: GalleryPhoto[];
  settings: GallerySettings;
}

/**
 * RA API 설정 타입
 */
export interface RAApiConfig {
  userId: string;
  apiKey: string;
  djId: string;
  option: '1' | '2' | '3' | '4'; // 1: upcoming, 2: previous 50, 3: all dates by year, 4: most recent 100
}

/**
 * 전체 콘텐츠 데이터 타입
 */
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
  themeColors: ThemeColors;
  raApiConfig?: RAApiConfig;
  displaySettings?: import('./displaySettings').AllDisplaySettings;
}

/**
 * 언어별 콘텐츠 데이터 타입
 */
export interface MultiLanguageContent {
  en: ContentData;
  ko: ContentData;
}

/**
 * 음악 콘텐츠 타입
 */
export interface MusicContent {
  tracks: Track[];
}

/**
 * 이벤트 콘텐츠 타입
 */
export interface EventsContent {
  performances: Performance[];
  eventsInfo: EventsInfo;
}

/**
 * 연락처 콘텐츠 타입
 */
export interface ContactContent {
  contactInfo: ContactItem[];
}
