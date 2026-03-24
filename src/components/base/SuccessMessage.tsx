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
      className="bg-[var(--color-accent)]/20 border p-4"
      style={createBorderAccent()}
    >
      <p className="text-sm text-[var(--color-primary)] tracking-wider flex items-center gap-2">
        <i className="ri-check-line"></i>
        {message}
      </p>
    </div>
  );
};

export default SuccessMessage;