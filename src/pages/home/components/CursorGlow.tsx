import { useEffect, useRef } from 'react';

/**
 * 마우스 커서 위치를 추적하여 글로우 효과를 렌더링하는 컴포넌트
 * 부모 요소 기준 상대 좌표로 동작
 */
const CursorGlow = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      glowRef.current.style.left = `${e.clientX}px`;
      glowRef.current.style.top = `${e.clientY}px`;
      glowRef.current.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      if (!glowRef.current) return;
      glowRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-0 rounded-full"
      style={{
        width: '400px',
        height: '400px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 70%)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
};

export default CursorGlow;
