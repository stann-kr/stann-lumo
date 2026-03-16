import type {
  Track,
  Performance,
  LinkPlatform,
  ContactItem,
} from './content';

/**
 * 폼 필드 변경 핸들러 타입
 */
export type FieldChangeHandler = (field: string, value: string) => void;

/**
 * 배열 항목 변경 핸들러 타입
 */
export type ArrayItemChangeHandler<T> = (index: number, field: keyof T, value: string) => void;

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
 * 저장 핸들러 타입
 */
export type SaveHandler = () => void;

/**
 * 삭제 확인 상태 타입
 */
export interface DeleteConfirmState {
  isOpen: boolean;
  index: number | null;
}

/**
 * 리스트 에디터 반환 타입
 */
export interface ListEditorReturn<T> {
  items: T[];
  handleAdd: ArrayItemAddHandler<T>;
  handleUpdate: ArrayItemChangeHandler<T>;
  handleDelete: ArrayItemDeleteHandler;
  handleReorder: ArrayItemReorderHandler;
}

/**
 * 어드민 폼 반환 타입
 */
export interface AdminFormReturn<T> {
  formData: T;
  isSaved: boolean;
  handleFieldChange: FieldChangeHandler;
  handleSave: SaveHandler;
}

/**
 * 삭제 확인 반환 타입
 */
export interface DeleteConfirmReturn {
  confirmState: DeleteConfirmState;
  openConfirm: (index: number) => void;
  closeConfirm: () => void;
  confirmDelete: () => void;
}

/**
 * 저장 알림 반환 타입
 */
export interface SaveNotificationReturn {
  showSuccess: boolean;
  triggerSave: () => void;
}

/**
 * 트랙 에디터 타입
 */
export type TrackEditor = ListEditorReturn<Track>;

/**
 * 공연 에디터 타입
 */
export type PerformanceEditor = ListEditorReturn<Performance>;

/**
 * 링크 에디터 타입
 */
export type LinkEditor = ListEditorReturn<LinkPlatform>;

/**
 * 연락처 에디터 타입
 */
export type ContactEditor = ListEditorReturn<ContactItem>;