/**
 * SaveButton Props 정의
 */
interface SaveButtonProps {
  /** 클릭 시 호출될 콜백 함수 */
  onClick: () => void;
  /** 저장 중 상태 여부 */
  isSaving: boolean;
  /** 저장 외 사유로 버튼을 비활성화할지 여부 */
  disabled?: boolean;
  /** 버튼 텍스트 (기본값: 'SAVE CHANGES') */
  text?: string;
  /** 저장 중 텍스트 (기본값: 'SAVING...') */
  savingText?: string;
  /** 저장할 변경이 있을 때만 강조 색으로 표시 (기본값: true) */
  emphasized?: boolean;
  /** 페이지 단축키(⌘S / Ctrl+S)로도 저장된다는 것을 알린다 */
  keyShortcuts?: boolean;
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
  disabled = false,
  text = '변경 사항 저장',
  savingText = '저장 중…',
  emphasized = true,
  keyShortcuts = false,
}: SaveButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving || disabled}
      aria-busy={isSaving}
      aria-keyshortcuts={keyShortcuts ? 'Meta+S Control+S' : undefined}
      title={keyShortcuts ? '⌘S / Ctrl+S' : undefined}
      data-emphasized={emphasized}
      className={`px-8 py-3 border tracking-wider text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer ${emphasized
        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)] enabled:hover:bg-[var(--color-primary)] enabled:hover:border-[var(--color-primary)]'
        : 'border-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)] text-[var(--color-secondary)] enabled:hover:text-[var(--color-primary)]'}`}
    >
      {isSaving ? savingText : text}
    </button>
  );
};

export default SaveButton;
