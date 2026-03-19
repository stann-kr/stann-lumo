/**
 * Display Settings 타입 정의
 * 각 페이지의 레이아웃을 어드민에서 동적 제어하기 위한 설정 타입
 * 빈 JSON '{}'는 모든 필드에 기본값 적용 → 마이그레이션 직후 기존 동작 100% 보존
 */

export interface GlobalDisplaySettings {
  /** 공개 페이지 최대 너비 */
  pageMaxWidth: 'sm' | 'md' | 'lg' | 'xl';
  /** 기본 섹션 간격 */
  defaultSpacing: 'sm' | 'md' | 'lg';
  /** 타이핑 텍스트 속도 (ms/char) */
  typingSpeed: number;
  /** 페이지 진입 애니메이션 활성화 여부 */
  animationEnabled: boolean;
}

export interface EventsDisplaySettings {
  /** 섹션 간격 */
  spacing: 'sm' | 'md' | 'lg';
  /** 초기 지난 이벤트 표시 수 */
  initialPastCount: number;
  /** 더 보기 시 추가 로드 수 */
  loadMoreCount: number;
  /** 지난 이벤트 불투명도 (0~100) */
  pastEventOpacity: number;
  /** 이벤트 카드 패딩 */
  cardPadding: 'sm' | 'md' | 'lg';
  /** 이벤트 카드 간격 */
  cardGap: 'sm' | 'md' | 'lg';
}

export interface MusicDisplaySettings {
  /** 섹션 간격 */
  spacing: 'sm' | 'md' | 'lg';
  /** 트랙 카드 패딩 */
  cardPadding: 'sm' | 'md' | 'lg';
  /** 트랙 간격 */
  trackGap: 'sm' | 'md' | 'lg';
  /** 재생 시간 표시 여부 */
  showDuration: boolean;
  /** 연도 표시 여부 */
  showYear: boolean;
  /** 타입 뱃지 표시 여부 */
  showTypeBadge: boolean;
}

export interface AboutDisplaySettings {
  /** 섹션 간격 */
  spacing: 'sm' | 'md' | 'lg';
  /** 타이핑 텍스트 속도 (ms/char) */
  typingSpeed: number;
  /** 아티스트 정보 그리드 컬럼 수 */
  infoGridColumns: 2 | 3 | 4;
  /** 아티스트 정보 카드 간격 */
  infoCardGap: 'sm' | 'md' | 'lg';
}

export interface ContactDisplaySettings {
  /** 섹션 간격 */
  spacing: 'sm' | 'md' | 'lg';
  /** 메시지 최대 글자 수 */
  messageMaxLength: number;
  /** textarea 행 수 */
  textareaRows: number;
  /** 연락처 정보 그리드 컬럼 수 */
  contactInfoColumns: 2 | 3 | 4;
  /** 부킹 정보 그리드 컬럼 수 */
  bookingColumns: 2 | 3 | 4;
}

export interface LinkDisplaySettings {
  /** 섹션 간격 */
  spacing: 'sm' | 'md' | 'lg';
  /** 링크 그리드 컬럼 수 */
  gridColumns: 2 | 3 | 4;
  /** 카드 패딩 */
  cardPadding: 'sm' | 'md' | 'lg';
  /** 그리드 간격 */
  gridGap: 'sm' | 'md' | 'lg';
  /** 터미널 카드 표시 여부 */
  showTerminalCard: boolean;
}

export interface HomeDisplaySettings {
  /** 네비게이션 그리드 컬럼 수 */
  navGridColumns: 1 | 2 | 3;
  /** 네비게이션 카드 패딩 */
  navCardPadding: 'sm' | 'md' | 'lg';
  /** 네비게이션 그리드 간격 */
  navGridGap: 'sm' | 'md' | 'lg';
  /** 터미널 정보 카드 표시 여부 */
  showTerminalInfo: boolean;
}

/** 전체 페이지 설정 맵 */
export interface AllDisplaySettings {
  global: GlobalDisplaySettings;
  home: HomeDisplaySettings;
  about: AboutDisplaySettings;
  music: MusicDisplaySettings;
  events: EventsDisplaySettings;
  contact: ContactDisplaySettings;
  link: LinkDisplaySettings;
}

// ─── 기본값 상수 ─────────────────────────────────────────────────────────────
// 기존 하드코딩 값과 동일 → 빈 JSON 저장 시 동작 100% 보존

export const DISPLAY_SETTINGS_DEFAULTS: AllDisplaySettings = {
  global: {
    pageMaxWidth: 'lg',
    defaultSpacing: 'md',
    typingSpeed: 80,
    animationEnabled: true,
  },
  home: {
    navGridColumns: 2,
    navCardPadding: 'lg',
    navGridGap: 'md',
    showTerminalInfo: true,
  },
  about: {
    spacing: 'lg',
    typingSpeed: 60,
    infoGridColumns: 4,
    infoCardGap: 'sm',
  },
  music: {
    spacing: 'md',
    cardPadding: 'md',
    trackGap: 'sm',
    showDuration: true,
    showYear: true,
    showTypeBadge: true,
  },
  events: {
    spacing: 'lg',
    initialPastCount: 10,
    loadMoreCount: 10,
    pastEventOpacity: 50,
    cardPadding: 'md',
    cardGap: 'sm',
  },
  contact: {
    spacing: 'lg',
    messageMaxLength: 500,
    textareaRows: 6,
    contactInfoColumns: 3,
    bookingColumns: 3,
  },
  link: {
    spacing: 'lg',
    gridColumns: 3,
    cardPadding: 'lg',
    gridGap: 'sm',
    showTerminalCard: true,
  },
};
