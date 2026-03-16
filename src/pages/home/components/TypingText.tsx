import { useState, useEffect, useRef } from 'react';

interface TypingTextProps {
  /** 타이핑할 텍스트 */
  text: string;
  /** 타이핑 속도 (ms) */
  speed?: number;
  /** 시작 딜레이 (ms) */
  delay?: number;
  className?: string;
  /** 타이핑 완료 후 커서 표시 여부 */
  showCursor?: boolean;
  onComplete?: () => void;
}

/**
 * 터미널 스타일 타이핑 애니메이션 컴포넌트
 * 텍스트를 한 글자씩 순차 출력하며 onComplete 호출
 */
const TypingText = ({
  text,
  speed = 60,
  delay = 0,
  className = '',
  showCursor = false,
  onComplete,
}: TypingTextProps) => {
  const safeText = text ?? '';
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);

    const interval = setInterval(() => {
      if (indexRef.current < safeText.length) {
        setDisplayed(safeText.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, safeText, speed, onComplete]);

  return (
    <span className={className} style={{ whiteSpace: 'pre-line' }}>
      {displayed}
      {(!done || showCursor) && (
        <span className="animate-pulse text-[var(--color-accent)]">█</span>
      )}
    </span>
  );
};

export default TypingText;
