import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import styles from './AdminDialog.module.css';

interface DeleteConfirmModalProps {
  show: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 어드민 삭제 확인 모달 컴포넌트
 * - 삭제 작업 확인 UI 재사용
 * - 관리자 화면은 방문자 언어 설정과 관계없이 한국어로 표시한다
 */
const DeleteConfirmModal = ({
  show,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!show) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      const trigger = previousFocusRef.current;
      previousFocusRef.current = null;
      window.requestAnimationFrame(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, [show]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') return;
    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!buttons || buttons.length === 0) return;

    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!show) return null;

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId}>항목 삭제</h2>
        <p id={descriptionId}>“{itemName}”을(를) 삭제할까요?</p>
        <div className={styles.actions}>
          <button ref={cancelButtonRef} type="button" onClick={onCancel}>취소</button>
          <button type="button" onClick={onConfirm} className={styles.leave}>삭제</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
