'use client';

import Link from 'next/link';

/*
 * Last-resort boundary. It replaces the root layout, so the site stylesheet, tokens and language context are not
 * available; the v5 fallback plate (PublicFallback.module.css) is restated here with its literal token values.
 * It still renders inside the app router, so a client link home leaves the failed path and resets this boundary.
 */
const css = `
body { margin: 0; min-height: 100svh; padding: 10px; box-sizing: border-box; background: #000; color: #fff;
  font-family: Inter, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif; }
.fallback { display: flex; flex-direction: column; justify-content: flex-end; gap: 18px; min-height: 60svh; padding: 28px 24px; background: #141414; }
.code { display: flex; align-items: center; gap: 8px; margin: 0; font: 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .14em; color: #ff4d6a; }
.code::before { content: ''; width: 8px; height: 8px; background: #ff0033; }
.fallback h1 { margin: 0; max-width: 16ch; font-weight: 900; font-size: clamp(2.5rem, 7vw, 6rem); line-height: .9; letter-spacing: -.045em; text-transform: uppercase; overflow-wrap: anywhere; }
.fallback p { margin: 0; max-width: 60ch; line-height: 1.5; color: #c4c4c4; }
.actions { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 8px; }
.actions a, .actions button { display: inline-flex; align-items: center; min-height: 48px; padding: 0 20px; border: 0; background: #262626; color: #fff;
  font-family: inherit; font-weight: 700; font-size: .8125rem; letter-spacing: .06em; text-transform: uppercase; text-decoration: none; cursor: pointer; }
.actions a:hover, .actions button:hover { background: #fff; color: #000; }
.actions :focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (max-width: 640px) { .fallback { padding: 22px 16px; } }
`;

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <style>{css}</style>
        <main className="fallback" role="alert">
          <p className="code">Error</p>
          <h1>Something went wrong.</h1>
          <p lang="ko">문제가 생겨 화면을 표시하지 못했습니다. 다시 시도하거나 홈으로 돌아가 주세요.</p>
          <div className="actions">
            <button type="button" onClick={() => reset()}>Try again</button>
            <Link href="/">Return home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
