import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from './Providers';
import { getDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'STANN LUMO',
  description: 'TECHNO / SEOUL',
};

const DEFAULT_THEME = {
  primary:   '#00ff00',
  secondary: '#ffffff',
  accent:    '#00ff00',
  muted:     '#666666',
  bg:        '#000000',
  bg_sidebar:'#000000',
};

interface ThemeRow {
  primary: string; secondary: string; accent: string;
  muted: string; bg: string; bg_sidebar: string;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // D1에서 테마 색상 직접 조회 — 첫 방문 포함 플래시 완전 제거
  let theme = DEFAULT_THEME;
  try {
    const db = getDB();
    const row = await db?.prepare('SELECT primary, secondary, accent, muted, bg, bg_sidebar FROM theme_colors WHERE id = 1').first<ThemeRow>();
    if (row) theme = row;
  } catch { /* DB 미사용 환경 — 기본값 유지 */ }

  const themeCSS = `
    :root {
      --color-primary:    ${theme.primary};
      --color-secondary:  ${theme.secondary};
      --color-accent:     ${theme.accent};
      --color-muted:      ${theme.muted};
      --color-bg:         ${theme.bg};
      --color-bg-sidebar: ${theme.bg_sidebar ?? theme.bg};
    }
  `.trim();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css" />
        {/* SSR 시점에 DB 테마 색상을 직접 주입 — 첫 방문 포함 플래시 제거 */}
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
        {/* localStorage 캐시로 hydration 전 즉시 덮어쓰기 (SSR 값과 동일하지만 빠름) */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var d=JSON.parse(localStorage.getItem('stann_content_multilang')||'null');
            var l=localStorage.getItem('app_language')||'en';
            var c=d&&d[l]&&d[l].themeColors;
            if(c){var r=document.documentElement;
              r.style.setProperty('--color-primary',c.primary);
              r.style.setProperty('--color-secondary',c.secondary);
              r.style.setProperty('--color-accent',c.accent);
              r.style.setProperty('--color-muted',c.muted);
              r.style.setProperty('--color-bg',c.bg);
              r.style.setProperty('--color-bg-sidebar',c.bgSidebar||c.bg);}
          }catch(e){}
        ` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
