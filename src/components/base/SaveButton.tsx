/**
 * SaveButton Props 정의
 */
interface SaveButtonProps {
  /** 클릭 시 호출될 콜백 함수 */
  onClick: () => void;
  /** 저장 중 상태 여부 */
  isSaving: boolean;
  /** 버튼 텍스트 (기본값: 'SAVE CHANGES') */
  text?: string;
  /** 저장 중 텍스트 (기본값: 'SAVING...') */
  savingText?: string;
}

/**
 * 저장 버튼 컴포넌트
 * 
 * 저장 작업을 트리거하는 통일된 버튼을 제공함
 * - 저장 중 상태 표시
 * - 저장 중 비활성화 처리
 * - CSS 변수 기반 테마 색상 적용
 * 
 * @example
 * ```tsx
 * <SaveButton
 *   onClick={handleSave}
 *   isSaving={isSaving}
 * />
 * ```
 */
const SaveButton = ({
  onClick,
  isSaving,
  text = 'SAVE CHANGES',
  savingText = 'SAVING...',
}: SaveButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      className="px-8 py-3 bg-[var(--color-accent)] text-[var(--color-bg)] tracking-wider text-sm hover:bg-[var(--color-primary)] transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
    >
      {isSaving ? savingText : text}
    </button>
  );
};

export default SaveButton;