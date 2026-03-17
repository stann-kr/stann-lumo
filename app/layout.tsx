import type { Metadata } from 'next';
import './globals.css';
import Providers from './Providers';

export const metadata: Metadata = {
  title: 'STANN LUMO',
  description: 'TECHNO / SEOUL',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css" />
        {/* CSS 변수 hydration 깜빡임 방지 — 테마색을 SSR 전에 즉시 적용 */}
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
