import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // archive page 동적 컬럼/gap 클래스 (buildContainerClasses에서 런타임 조합)
    'columns-1', 'columns-2', 'columns-3', 'columns-4', 'columns-5',
    'md:columns-1', 'md:columns-2', 'md:columns-3', 'md:columns-4', 'md:columns-5',
    'lg:columns-1', 'lg:columns-2', 'lg:columns-3', 'lg:columns-4', 'lg:columns-5',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5',
    'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5',
    'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5',
    'gap-1', 'gap-3', 'gap-6',
    'mb-1', 'mb-3', 'mb-6',
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['Orbit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // CSS 변수 기반 동적 테마 색상
        theme: {
          primary:    'var(--color-primary)',
          secondary:  'var(--color-secondary)',
          accent:     'var(--color-accent)',
          muted:      'var(--color-muted)',
          bg:         'var(--color-bg)',
          'bg-sidebar': 'var(--color-bg-sidebar)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;