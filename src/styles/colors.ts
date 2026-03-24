/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  STANN LUMO — 중앙화 컬러 컨트롤 파일                           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 이 파일이 사이트 전체 색상의 단일 소스입니다.
 *
 * 색상 변경 방법:
 *   1. 아래 THEME 섹션의 값을 수정
 *   2. src/app/globals.css 의 :root 를 동일하게 업데이트
 *      (두 파일이 1:1 대응, 항상 동기화 유지)
 *
 * 구조:
 *   PALETTE  → 원시 색상값 (hex) — 재사용 가능한 색상 팔레트
 *   THEME    → 시맨틱 토큰 — globals.css :root CSS 변수와 1:1 매핑
 *   COLORS   → 컴포넌트별 색상 할당 — CSS 변수 참조 (var(--color-*))
 */

// ──────────────────────────────────────────────────────────────
// 1. 원시 팔레트  (hex 색상값)
// ──────────────────────────────────────────────────────────────

export const PALETTE = {
  // 무채색 계열
  black: "#000000",
  nearBlack: "#050505",
  deepCharcoal: "#0a0a0a",
  darkGray: "#1a1a1a",
  midGray: "#333333",
  softGray: "#666666",
  lightGray: "#999999",
  white: "#ffffff",

  // 포인트 컬러
  neonGreen: "#999999",
  cyberRed: "#ff0033",
} as const;

// ──────────────────────────────────────────────────────────────
// 2. 시맨틱 토큰 — globals.css :root 와 1:1 동기화 필수
//
//    ⚠️  이 값을 바꾸면 globals.css :root 도 동일하게 수정할 것
// ──────────────────────────────────────────────────────────────

export const THEME = {
  primary: PALETTE.white, // --color-primary    : 주 텍스트, 헤딩
  secondary: PALETTE.neonGreen, // --color-secondary  : 보조 텍스트, 일반 본문
  accent: PALETTE.cyberRed, // --color-accent     : 아이콘, 라벨, 포인트 컬러
  muted: PALETTE.midGray, // --color-muted      : 흐린 텍스트, 구분선
  bg: PALETTE.black, // --color-bg         : 페이지 배경
  bgSidebar: PALETTE.nearBlack, // --color-bg-sidebar : 사이드바/헤더 배경
} as const;

// ──────────────────────────────────────────────────────────────
// 3. CSS 변수 단축 참조 (내부용)
// ──────────────────────────────────────────────────────────────

const v = {
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",
  muted: "var(--color-muted)",
  bg: "var(--color-bg)",
  bgSidebar: "var(--color-bg-sidebar)",
  // bg-surface / hud-panel 공식 — globals.css 와 동일
  surface: "color-mix(in srgb, var(--color-bg) 80%, transparent)",
} as const;

// ──────────────────────────────────────────────────────────────
// 4. 컴포넌트별 색상 할당
//    각 UI 요소가 어떤 시맨틱 색상을 사용하는지 명시적으로 기록
// ──────────────────────────────────────────────────────────────

export const COLORS = {
  /** ─ 글로벌 텍스트 위계 ─────────────────────────── */
  text: {
    primary: v.primary, // 최상위 헤딩, 강조 텍스트
    secondary: v.secondary, // 본문, 일반 UI 텍스트
    muted: v.muted, // 보조 메타, 흐린 텍스트
    accent: v.accent, // 라벨, 카테고리, 뱃지, 포인트
  },

  /** ─ 배경 ─────────────────────────────────────────── */
  bg: {
    page: v.bg,
    sidebar: v.bgSidebar,
    surface: v.surface, // hud-panel / bg-surface (80% 반투명)
    cardHover: `${v.accent}/5`, // 카드 마우스오버 배경
    overlay: `${v.bg}/80`, // 모달/lightbox 오버레이
    playButton: `${v.accent}/80`, // 갤러리 YouTube 재생 버튼
    zoomButton: `${v.bg}/70`, // 갤러리 확대 버튼
  },

  /** ─ 테두리 ────────────────────────────────────────── */
  border: {
    default: v.muted, // 기본 테두리 (border-[var(--color-muted)])
    faint: `${v.muted}/30`, // createBorderFaint 대응 — 희미한 구분선
    mid: `${v.muted}/60`, // createBorderMid 대응  — 중간 구분선
    accent: v.accent, // 강조 테두리 (활성 상태 등)
    gapFill: v.muted, // gap-trick 컨테이너 배경 (1px 행 구분선)
  },

  /** ─ 사이드바 / 모바일 헤더 ────────────────────────── */
  sidebar: {
    bg: v.bgSidebar,
    border: v.muted,
    brand: v.primary, // 아티스트 이름 브랜드 텍스트
    brandHover: v.accent,
    statusPulse: v.accent, // 상태 표시 animate-pulse 점
    metaLabel: v.muted, // "SYS.ID", "VERSION", "LOCAL TIME" 라벨
    version: v.primary,
    langActive: v.accent,
    langInactive: v.muted,
    langHover: v.primary,
  },

  /** ─ 내비게이션 링크 ────────────────────────────────── */
  nav: {
    active: v.accent, // 현재 페이지 링크 색상
    inactive: v.muted, // 비활성 링크
    hover: v.primary, // 링크 마우스오버
    indicator: v.accent, // 활성 페이지 좌측 2px 수직 바
    externalIcon: v.muted, // 외부 링크 아이콘
    indexNum: v.muted, // "[01]" 숫자 인덱스
  },

  /** ─ 페이지 헤더 (PageLayout) ────────────────────────── */
  pageHeader: {
    badge: v.accent, // "ACCESS_GRANTED // PAGE_INIT" 라벨
    pulse: v.accent, // 배지 앞 animate-pulse 점
    h1: v.primary, // 대형 타이틀 텍스트
    divider: v.muted, // 타이틀 하단 수평선 (opacity-50)
    subtitle: v.accent, // [SUBTITLE] 텍스트
  },

  /** ─ 섹션 헤더 (PageSection 컴포넌트) ────────────────── */
  section: {
    accentBar: v.muted, // 제목 좌측 4px 수직 바 (hidden md:block)
    icon: v.accent, // 섹션 아이콘 (ri-*-line)
    title: v.primary, // 섹션 h2 타이틀
    dividerLine: v.muted, // 제목 우측 수평 구분선 (opacity-30)
  },

  /** ─ HUD 패널 / 카드 컨테이너 ────────────────────────── */
  card: {
    bg: v.surface, // hud-panel 반투명 배경
    border: v.muted, // hud-panel 테두리
    hover: `${v.accent}/5`, // 행/카드 마우스오버 배경
  },

  /** ─ 홈 내비게이션 카드 ────────────────────────────────── */
  homeNav: {
    number: v.accent, // "[01]" 번호 라벨
    title: v.primary, // 카드 제목
    desc: v.secondary, // 설명 텍스트
    arrow: v.accent, // 화살표 아이콘
    border: v.muted, // 카드 외곽 테두리
  },

  /** ─ 음악 트랙 리스트 ──────────────────────────────────── */
  track: {
    headerLabel: v.accent, // 컬럼 헤더 (TITLE, TYPE, DURATION...)
    id: v.muted, // 트랙 번호 (001, 002...)
    idHover: v.accent, // 번호 마우스오버
    title: v.secondary, // 트랙 제목
    titleHover: v.primary, // 제목 마우스오버
    type: v.secondary, // "[Original Mix]" 타입 뱃지 (opacity-60)
    duration: v.secondary, // 재생 시간 (opacity-40)
    year: v.secondary, // 연도 (opacity-30)
    platformBtn: v.secondary, // 플랫폼 버튼 텍스트 (opacity-50)
    platformHover: v.primary, // 플랫폼 버튼 호버
  },

  /** ─ 이벤트 리스트 ─────────────────────────────────────── */
  event: {
    indexLabel: v.accent, // "[001]" 인덱스 (Upcoming)
    poster: v.accent, // 포스터 이미지 컬러 오버레이 (mix-blend-overlay)
    title: v.secondary, // 이벤트 제목
    titleHover: v.primary, // 제목 마우스오버
    meta: v.secondary, // venue / location (opacity-60)
    separator: v.muted, // "/" 구분자
    date: v.primary, // 날짜 (강조)
    time: v.accent, // 시간 (opacity-80)
    // 이벤트 상태 배지
    status: {
      Announced: v.accent, // 공연 확정
      TBA: v.secondary, // 미정 (+ opacity-60)
      Cancelled: v.muted, // 취소
    },
  },

  /** ─ 이벤트 상세 페이지 ─────────────────────────────────── */
  eventDetail: {
    fieldLabel: v.accent, // "DATE", "VENUE" 등 라벨
    fieldValue: v.secondary, // 필드 값 텍스트
    raLink: v.accent, // RA 링크
    backLink: v.muted, // "← BACK" 링크
  },

  /** ─ 아카이브 ───────────────────────────────────────────── */
  archive: {
    captionText: v.secondary, // 캡션 오버레이 텍스트
    playIcon: PALETTE.white, // YouTube 재생 아이콘 (흰색 고정)
    zoomIcon: v.secondary, // 확대 아이콘
    emptyText: v.secondary, // 빈 상태 / 로딩 텍스트
  },

  /** ─ 링크 / 플랫폼 카드 ─────────────────────────────────── */
  link: {
    icon: v.accent, // 플랫폼 아이콘 (기본)
    iconHover: v.secondary, // 아이콘 마우스오버
    title: v.secondary, // 플랫폼 이름
    titleHover: v.primary, // 이름 마우스오버
    desc: v.secondary, // 설명 (opacity-40)
    visitText: v.secondary, // "VISIT →" 텍스트 (opacity-25)
    // 터미널 피처드 카드
    terminalIcon: v.accent,
    terminalTitle: v.secondary,
    gradientLine: v.secondary, // 상/하단 그라디언트 장식선
    enterArrow: v.secondary, // "ENTER →" 화살표
  },

  /** ─ 연락처 ─────────────────────────────────────────────── */
  contact: {
    icon: v.accent, // 항목 아이콘
    label: v.accent, // 항목 라벨 (EMAIL, INSTAGRAM...)
    value: v.secondary, // 항목 값 텍스트 (opacity-80)
    valueHover: v.primary, // 값 마우스오버
    // Booking 정보
    bookingLabel: v.accent,
    bookingValue: v.secondary, // (opacity-70)
    bookingLink: v.secondary, // 이메일 링크 (opacity-80)
    bookingLinkHover: v.primary,
  },

  /** ─ About 페이지 — 아티스트 정보 카드 ──────────────────── */
  artistInfo: {
    key: v.accent, // 항목 키 (Name, Genre...)
    value: v.secondary, // 항목 값
    border: v.muted, // 카드 테두리 (faint)
    bg: v.surface, // 카드 배경
  },

  /** ─ 시스템 / 로딩 / 오류 상태 ──────────────────────────── */
  system: {
    loadingSpinner: v.primary, // 스피너 테두리
    loadingText: v.primary, // "FETCHING DATA..." 텍스트
    errorTitle: v.muted, // "SYS.ERR" 제목
    errorText: v.muted, // 오류 메시지
    retryBorder: v.muted, // RETRY 버튼 테두리
    retryText: v.muted, // RETRY 버튼 텍스트
    retryHover: v.primary, // RETRY 버튼 호버
  },

  /** ─ 3D 씬 (Scene3D / Three.js) ───────────────────────────
   *  CSS 변수 문자열이 아닌 hex 값 직접 참조 (Three.js용)    *  → CSS 변수와 동기화: THEME.accent, THEME.muted 사용    */
  scene3d: {
    accent: THEME.accent, // 팔각형 코어, 궤도선 포인트 색상
    muted: THEME.muted, // 파티클, 배경 요소 색상
  },

  /** ─ 어드민 공통 ─────────────────────────────────────────── */
  admin: {
    sectionTitle: v.secondary,
    labelText: v.secondary,
    inputBg: v.bg,
    inputText: v.secondary,
    inputBorder: v.muted,
    buttonBorder: v.muted,
    buttonText: v.secondary,
    buttonHover: `${v.secondary}/5`,
    successText: v.muted,
    dangerAccent: v.accent,
  },
} as const;

export type ColorTokens = typeof COLORS;
