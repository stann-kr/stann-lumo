/**
 * 스타일 상수 정의
 * Magic Number 제거 및 디자인 일관성 유지
 */

/**
 * Border 스타일 상수
 */
export const BORDER = {
  WIDTH: {
    THIN: '1px',
    MEDIUM: '2px',
    THICK: '3px',
  },
  RADIUS: {
    NONE: '0',
    SM: '0.125rem',
    DEFAULT: '0.25rem',
    MD: '0.375rem',
    LG: '0.5rem',
    XL: '0.75rem',
    FULL: '9999px',
  },
  OPACITY: {
    LIGHT: 0.15,
    MEDIUM: 0.3,
    STRONG: 0.5,
  },
} as const;

/**
 * Padding 및 Spacing 상수
 */
export const SPACING = {
  XS: '0.5rem',
  SM: '0.75rem',
  MD: '1rem',
  LG: '1.5rem',
  XL: '2rem',
  XXL: '3rem',
} as const;

/**
 * Transition 및 Animation 상수
 */
export const TRANSITION = {
  DURATION: {
    FAST: '150ms',
    DEFAULT: '200ms',
    MEDIUM: '300ms',
    SLOW: '500ms',
  },
  TIMING: {
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    LINEAR: 'linear',
  },
  PROPERTY: {
    ALL: 'all',
    COLOR: 'color',
    BACKGROUND: 'background-color',
    BORDER: 'border-color',
    OPACITY: 'opacity',
    TRANSFORM: 'transform',
  },
} as const;

/**
 * Typography 상수
 */
export const TYPOGRAPHY = {
  SIZE: {
    XS: '0.75rem',
    SM: '0.875rem',
    BASE: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    XXL: '1.5rem',
    XXXL: '2rem',
  },
  WEIGHT: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
  LINE_HEIGHT: {
    TIGHT: '1.25',
    NORMAL: '1.5',
    RELAXED: '1.75',
  },
} as const;

/**
 * Z-Index 레이어 상수
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
} as const;

/**
 * Breakpoint 상수
 */
export const BREAKPOINT = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  XXL: '1536px',
} as const;

/**
 * 공통 스타일 조합 생성 함수
 */
export const createTransition = (
  property: keyof typeof TRANSITION.PROPERTY = 'ALL',
  duration: keyof typeof TRANSITION.DURATION = 'DEFAULT',
  timing: keyof typeof TRANSITION.TIMING = 'EASE_IN_OUT'
): string => {
  return `${TRANSITION.PROPERTY[property]} ${TRANSITION.DURATION[duration]} ${TRANSITION.TIMING[timing]}`;
};

/**
 * Border 스타일 생성 함수
 */
export const createBorderStyle = (
  width: keyof typeof BORDER.WIDTH = 'THIN',
  opacity: keyof typeof BORDER.OPACITY = 'LIGHT'
): string => {
  return `${BORDER.WIDTH[width]} solid color-mix(in srgb, var(--color-secondary) ${BORDER.OPACITY[opacity] * 100}%, transparent)`;
};