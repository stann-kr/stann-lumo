/**
 * CSS 변수 키 상수 정의
 * 타입 안정성 확보 및 오타 방지
 */

/**
 * 색상 CSS 변수 키
 */
export const COLOR_VARS = {
  PRIMARY: '--color-primary',
  SECONDARY: '--color-secondary',
  ACCENT: '--color-accent',
  MUTED: '--color-muted',
  BG: '--color-bg',
  BG_SIDEBAR: '--color-bg-sidebar',
} as const;

/**
 * CSS 변수 값 타입
 */
export type ColorVarKey = typeof COLOR_VARS[keyof typeof COLOR_VARS];

/**
 * CSS 변수 값 가져오기
 * @param varKey - CSS 변수 키
 * @returns CSS var() 함수 문자열
 */
export const getCSSVar = (varKey: ColorVarKey): string => {
  return `var(${varKey})`;
};

/**
 * CSS 변수 설정
 * @param varKey - CSS 변수 키
 * @param value - 색상 값
 */
export const setCSSVar = (varKey: ColorVarKey, value: string): void => {
  document.documentElement.style.setProperty(varKey, value);
};

/**
 * 모든 색상 CSS 변수 설정
 * @param colors - 색상 객체
 */
export const setAllColorVars = (colors: {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  bg: string;
  bgSidebar?: string;
}): void => {
  setCSSVar(COLOR_VARS.PRIMARY, colors.primary);
  setCSSVar(COLOR_VARS.SECONDARY, colors.secondary);
  setCSSVar(COLOR_VARS.ACCENT, colors.accent);
  setCSSVar(COLOR_VARS.MUTED, colors.muted);
  setCSSVar(COLOR_VARS.BG, colors.bg);
  setCSSVar(COLOR_VARS.BG_SIDEBAR, colors.bgSidebar ?? colors.bg);
};

/**
 * CSS 변수 값 읽기
 * @param varKey - CSS 변수 키
 * @returns 현재 설정된 색상 값
 */
export const getComputedCSSVar = (varKey: ColorVarKey): string => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varKey)
    .trim();
};