import { BORDER } from '../constants/styles';
import type { ColorVarKey } from '../constants/colors';

/**
 * CSS color-mix 함수를 사용한 인라인 스타일 생성
 * @param cssVariable - CSS 변수명 (예: '--color-secondary')
 * @param opacity - 투명도 (0-100)
 * @returns 인라인 스타일 객체
 */
export const createColorMixStyle = (
  cssVariable: ColorVarKey,
  opacity: number
): React.CSSProperties => {
  return {
    borderColor: `color-mix(in srgb, var(${cssVariable}) ${opacity}%, transparent)`,
  };
};

/**
 * 여러 CSS 속성에 color-mix 적용
 * @param cssVariable - CSS 변수명
 * @param opacity - 투명도
 * @param properties - 적용할 CSS 속성 배열
 * @returns 인라인 스타일 객체
 */
export const createMultiColorMixStyle = (
  cssVariable: ColorVarKey,
  opacity: number,
  properties: Array<'borderColor' | 'backgroundColor' | 'color'>
): React.CSSProperties => {
  const colorValue = `color-mix(in srgb, var(${cssVariable}) ${opacity}%, transparent)`;
  const style: React.CSSProperties = {};

  properties.forEach((prop) => {
    style[prop] = colorValue;
  });

  return style;
};

/**
 * border 스타일 생성 (color-mix 포함)
 * @param cssVariable - CSS 변수명
 * @param opacity - 투명도 (0-1)
 * @param width - border 두께 키 (기본값: 'THIN')
 * @returns 인라인 스타일 객체
 */
export const createBorderStyle = (
  cssVariable: ColorVarKey,
  opacity: keyof typeof BORDER.OPACITY = 'LIGHT',
  width: keyof typeof BORDER.WIDTH = 'THIN'
): React.CSSProperties => {
  return {
    borderWidth: BORDER.WIDTH[width],
    borderStyle: 'solid',
    borderColor: `color-mix(in srgb, var(${cssVariable}) ${BORDER.OPACITY[opacity] * 100}%, transparent)`,
  };
};

/**
 * 공통 border 스타일 생성 함수 — Faint (15% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderFaint = (): React.CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-secondary) 15%, transparent)',
  };
};

/**
 * 공통 border 스타일 생성 함수 — Mid (30% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderMid = (): React.CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-secondary) 30%, transparent)',
  };
};

/**
 * 공통 border 스타일 생성 함수 — Strong (50% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderStrong = (): React.CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-secondary) 50%, transparent)',
  };
};

/**
 * 공통 border 스타일 생성 함수 — Muted (10% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderMuted = (): React.CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-secondary) 10%, transparent)',
  };
};

/**
 * 공통 border 스타일 생성 함수 — Accent (50% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderAccent = (): React.CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
  };
};