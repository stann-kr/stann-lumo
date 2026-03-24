import type { CSSProperties } from 'react';
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
): CSSProperties => {
  return {
    borderColor: `color-mix(in srgb, var(${cssVariable}) ${opacity}%, transparent)`,
  };
};

/**
 * 공통 border 스타일 생성 함수 — Faint (15% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderFaint = (): CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-secondary) 15%, transparent)',
  };
};

/**
 * 공통 border 스타일 생성 함수 — Mid (30% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderMid = (): CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-secondary) 30%, transparent)',
  };
};

/**
 * 공통 border 스타일 생성 함수 — Accent (50% 투명도)
 * @returns 인라인 스타일 객체
 */
export const createBorderAccent = (): CSSProperties => {
  return {
    borderColor: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
  };
};
