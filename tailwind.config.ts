import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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