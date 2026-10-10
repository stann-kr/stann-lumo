interface SuccessMessageProps {
  message: string;
  show: boolean;
}

import { createBorderAccent } from '../../utils/colorMix';

/**
 * 어드민 성공 메시지 컴포넌트
 * - 저장 완료 알림 표시
 * - 일관된 스타일 및 아이콘 제공
 */
const SuccessMessage = ({ message, show }: SuccessMessageProps) => {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="bg-[var(--color-accent)]/20 border p-4"
      style={createBorderAccent()}
    >
      <p className="text-sm text-[var(--color-primary)] tracking-wider">
        {message}
      </p>
    </div>
  );
};

export default SuccessMessage;
