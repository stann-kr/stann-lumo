/**
 * 배열 항목 추가 핸들러 타입
 */
export type ArrayItemAddHandler<T> = (item: T) => void;

/**
 * 배열 항목 삭제 핸들러 타입
 */
export type ArrayItemDeleteHandler = (index: number) => void;

/**
 * 배열 항목 순서 변경 핸들러 타입
 */
export type ArrayItemReorderHandler = (fromIndex: number, toIndex: number) => void;

/**
 * 삭제 확인 상태 타입
 */
export interface DeleteConfirmState {
  isOpen: boolean;
  index: number | null;
}

/**
 * 리스트 에디터 반환 타입 (useListEditor hook 반환값과 일치)
 */
export interface ListEditorReturn<T> {
  items: T[];
  addItem: ArrayItemAddHandler<T>;
  updateItem: (index: number, updatedItem: T) => void;
  deleteItem: ArrayItemDeleteHandler;
  reorderItem: ArrayItemReorderHandler;
  setItems: (items: T[]) => void;
  editingIndex: number | null;
  startEditing: (index: number) => void;
  stopEditing: () => void;
  replaceItems: (newItems: T[]) => void;
}

/**
 * 삭제 확인 반환 타입
 */
export interface DeleteConfirmReturn {
  confirmState: DeleteConfirmState;
  openConfirm: (index: number) => void;
  closeConfirm: () => void;
  confirmDelete: (deleteCallback?: (index: number) => void) => void;
}

/**
 * 저장 알림 반환 타입 (useSaveNotification hook 반환값과 일치)
 */
export interface SaveNotificationReturn {
  showSuccess: boolean;
  isVisible: boolean;
  triggerSave: () => void;
  showNotification: () => void;
}
