import { ReactNode } from 'react';
import SaveButton from './SaveButton';
import { useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import styles from './AdminSectionHeader.module.css';

/**
 * AdminSectionHeader 컴포넌트 Props
 */
interface AdminSectionHeaderProps {
  /** 페이지 제목 */
  title: string;
  /** 설명 텍스트 (선택 사항) */
  description?: string;
  /** 저장 버튼 표시 여부 (기본값: true) */
  showSaveButton?: boolean;
  /** 저장 버튼 클릭 핸들러 */
  onSave?: () => void;
  /** 저장 중 상태 */
  isSaving?: boolean;
  /** 저장 외 사유로 저장 버튼을 비활성화할지 여부 */
  isSaveDisabled?: boolean;
  /** 추가 액션 버튼 (선택 사항) - action과 actions 모두 지원 */
  action?: ReactNode;
  actions?: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * Admin 페이지 헤더 패턴 통합 컴포넌트
 * 
 * @description
 * 모든 admin 페이지에서 동일한 flex justify-between 헤더 구조 반복 패턴을 통합
 * h1 + 설명 + 저장버튼 레이아웃 제공
 * 
 * @example
 * ```tsx
 * <AdminSectionHeader 
 *   title="Home Page Settings"
 *   description="Manage your homepage content"
 *   onSave={handleSave}
 *   isSaving={isSaving}
 * />
 * ```
 */
export default function AdminSectionHeader({
  title,
  description,
  showSaveButton = true,
  onSave,
  isSaving = false,
  isSaveDisabled = false,
  action,
  actions,
  className = '',
}: AdminSectionHeaderProps) {
  const actionContent = actions || action;
  const { isDirty } = useAdminEditGuard();
  
  return (
    <div className={`${styles.header} ${className}`}>
      <div>
        <h1
          style={{ color: 'var(--color-primary)' }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{ color: 'var(--color-secondary)' }}
          >
            {description}
          </p>
        )}
      </div>
      <div className={styles.actions}>
        {showSaveButton && onSave && <span className={styles.status} data-dirty={isDirty} role="status">
          {isSaving ? '저장 중…' : isDirty ? '저장 전' : '변경 사항 없음'}
        </span>}
        {actionContent}
        {showSaveButton && onSave && (
          <SaveButton
            onClick={onSave}
            isSaving={isSaving}
            disabled={isSaveDisabled}
          />
        )}
      </div>
    </div>
  );
}
