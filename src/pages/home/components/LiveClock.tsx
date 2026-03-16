import { useState, useEffect } from 'react';

/**
 * 실시간 시계 컴포넌트
 * 서울 시간 기준으로 HH:MM:SS 형식 출력
 */
const LiveClock = ({ className = '' }: { className?: string }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const seoulTime = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setTime(seoulTime);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      {time}
    </span>
  );
};

export default LiveClock;
