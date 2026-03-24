'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 커스텀 스크롤바 — position:fixed로 렌더링되어 페이지 전환 AnimatePresence와 완전히 독립
 * 네이티브 스크롤바는 globals.css에서 display:none 처리됨
 */
const CustomScrollbar = () => {
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;

      if (scrollable <= 0) {
        setThumbHeight(0);
        return;
      }

      const ratio = clientHeight / scrollHeight;
      const thumbH = Math.max(ratio * clientHeight, 32); // 최소 32px
      const maxTop = clientHeight - thumbH;
      const top = (scrollTop / scrollable) * maxTop;

      setThumbHeight(thumbH);
      setThumbTop(top);
    };

    const onScroll = () => {
      update();
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    const onResize = () => update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (thumbHeight === 0) return null;

  return (
    <div
      className="fixed right-0 top-0 h-full z-[9999] pointer-events-none"
      style={{ width: '3px' }}
      aria-hidden="true"
    >
      <div
        className="absolute w-full transition-opacity duration-300"
        style={{
          top: thumbTop,
          height: thumbHeight,
          backgroundColor: 'var(--color-muted)',
          opacity: visible ? 0.8 : 0,
        }}
      />
    </div>
  );
};

export default CustomScrollbar;
