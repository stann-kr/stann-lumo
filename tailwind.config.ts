import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        terminal: {
          bg: '#0a0a0a',
          cyan: '#00d9ff',
          magenta: '#ff6b9d',
          green: '#00ff88',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;