import { useState, useCallback } from 'react';
import type { DeleteConfirmReturn } from '../types/admin';

/**
 * 삭제 확인 상태 관리 훅
 * 
 * 삭제 작업 전 사용자 확인을 받기 위한 모달 상태를 관리함
 * 
 * @returns 삭제 확인 모달 상태 및 핸들러 객체
 * 
 * @example
 * ```tsx
 * const { isOpen, pendingIndex, openConfirm, closeConfirm, confirmDelete } = useDeleteConfirm();
 * 
 * // 삭제 버튼 클릭 시
 * <button onClick={() => openConfirm(index)}>Delete</button>
 * 
 * // 확인 버튼 클릭 시
 * <button onClick={() => confirmDelete(actualDeleteFunction)}>Confirm</button>
 * ```
 */
export function useDeleteConfirm(): DeleteConfirmReturn & {
  pendingIndex: number | null;
  isOpen: boolean;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  /**
   * 삭제 확인 모달 열기
   * @param index - 삭제 대상 항목의 인덱스
   */
  const openConfirm = useCallback((index: number) => {
    setPendingIndex(index);
    setIsOpen(true);
  }, []);

  /**
   * 삭제 확인 모달 닫기
   * - 모달 상태 및 대기 중인 인덱스 초기화
   */
  const closeConfirm = useCallback(() => {
    setIsOpen(false);
    setPendingIndex(null);
  }, []);

  /**
   * 삭제 확인 처리
   * @param deleteCallback - 실제 삭제를 수행할 콜백 함수
   * 
   * 사용자가 확인 버튼을 클릭하면 전달받은 콜백 함수를 실행하고 모달을 닫음
   */
  const confirmDelete = useCallback((deleteCallback?: (index: number) => void) => {
    if (deleteCallback && pendingIndex !== null) {
      deleteCallback(pendingIndex);
    }
    closeConfirm();
  }, [pendingIndex, closeConfirm]);

  return {
    confirmState: {
      isOpen,
      index: pendingIndex,
    },
    pendingIndex,
    isOpen,
    openConfirm,
    closeConfirm,
    confirmDelete,
  };
}