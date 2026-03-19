/**
 * Display Settings CSS 클래스 매핑 유틸
 *
 * Tailwind JIT 주의: 동적 문자열 (`gap-${n}`) 사용 금지.
 * 반드시 이 파일의 매핑 상수를 통해 완성된 클래스명을 사용.
 */

export const PADDING_MAP: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const GAP_MAP: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export const SPACE_Y_MAP: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
};

export const MAX_WIDTH_MAP: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
};

export const GRID_COLS_MAP: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export const MD_GRID_COLS_MAP: Record<1 | 2 | 3 | 4, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};
