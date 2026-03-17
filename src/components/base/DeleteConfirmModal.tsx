import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  show: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 어드민 삭제 확인 모달 컴포넌트
 * - 삭제 작업 확인 UI 재사용
 * - 일관된 스타일 및 버튼 동작 제공
 */
const DeleteConfirmModal = ({
  show,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-secondary)] tracking-wider">
        {t('msg_confirm_delete_item', { name: itemName })}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-900/30 text-red-400 text-sm tracking-wider hover:bg-red-900/50 transition-colors whitespace-nowrap cursor-pointer"
        >
          {t('msg_confirm_delete_action')}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-sm tracking-wider hover:bg-[var(--color-secondary)]/20 transition-colors whitespace-nowrap cursor-pointer"
        >
          {t('btn_cancel')}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
