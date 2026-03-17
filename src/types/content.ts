/**
 * 아티스트 기본 정보 타입 (동적 key-value 쌍)
 */
export interface ArtistInfoItem {
  id: string;
  key: string;
  value: string;
}

/**
 * 아티스트 약력 타입
 */
export interface Biography {
  paragraphs: string[];
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
 * 디자인 철학 타입 (단락 배열)
 */
export interface DesignPhilosophy {
  paragraphs: string[];
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
  status: 'Confirmed' | 'Pending' | 'Cancelled';
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
 * 터미널 정보 타입
 */
export interface TerminalInfo {
  url: string;
  description: string;
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
  biography: Biography;
  musicalPhilosophy: PhilosophyItem[];
  designPhilosophy: DesignPhilosophy;
  homeSections: HomeSection[];
  tracks: Track[];
  performances: Performance[];
  eventsInfo: EventsInfo;
  linkPlatforms: LinkPlatform[];
  terminalInfo: TerminalInfo;
  contactInfo: ContactItem[];
  themeColors: ThemeColors;
  raApiConfig?: RAApiConfig;
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