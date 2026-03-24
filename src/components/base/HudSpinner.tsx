'use client';

/**
 * HUD 스타일 로딩 스피너 — TerminalLayout의 페이지 전환 스피너와 동일한 디자인
 * 상세 페이지 내부 데이터 로딩 시 사용
 */
const HudSpinner = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-accent)] flex flex-col items-center gap-2">
      <div className="w-4 h-4 border border-[var(--color-accent)] border-t-transparent animate-spin"></div>
      <span className="animate-pulse">FETCHING DATA...</span>
    </div>
  </div>
);

export default HudSpinner;
