'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import styles from '@/components/base/AdminDialog.module.css';

interface PendingExit {
  action: () => void;
}

export interface AdminEditGuardContextValue {
  isDirty: boolean;
  setDirty: (isDirty: boolean) => void;
  requestExit: (action: () => void) => void;
}

const AdminEditGuardContext = createContext<AdminEditGuardContextValue | undefined>(undefined);

/**
 * 어드민 편집 화면의 저장되지 않은 변경을 한 곳에서 관리한다.
 * 페이지는 현재 편집 상태만 등록하고, 실제 이탈 여부는 shell이 이 훅을 통해 요청한다.
 */
export const AdminEditGuardProvider = ({ children }: { children: ReactNode }) => {
  const [isDirty, setDirty] = useState(false);
  const [pendingExit, setPendingExit] = useState<PendingExit | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!pendingExit) return;

    const frame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingExit]);

  const requestExit = useCallback((action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPendingExit({ action });
  }, [isDirty]);

  const cancelExit = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    setPendingExit(null);

    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  }, []);

  const confirmExit = useCallback(() => {
    const action = pendingExit?.action;
    triggerRef.current = null;
    setDirty(false);
    setPendingExit(null);
    action?.();
  }, [pendingExit]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelExit();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <AdminEditGuardContext.Provider value={{ isDirty, setDirty, requestExit }}>
      {children}
      {pendingExit && (
        <div className={styles.backdrop}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-unsaved-changes-title"
            aria-describedby="admin-unsaved-changes-description"
            className={styles.dialog}
            onKeyDown={handleDialogKeyDown}
          >
            <h2 id="admin-unsaved-changes-title">저장하지 않은 변경 사항</h2>
            <p id="admin-unsaved-changes-description">
              저장하지 않은 변경 사항이 있습니다. 저장하지 않고 이동할까요?
            </p>
            <div className={styles.actions}>
              <button ref={cancelButtonRef} type="button" onClick={cancelExit}>
                계속 편집하기
              </button>
              <button type="button" onClick={confirmExit} className={styles.leave}>
                저장하지 않고 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminEditGuardContext.Provider>
  );
};

export const useAdminEditGuard = () => {
  const context = useContext(AdminEditGuardContext);
  if (!context) {
    throw new Error('useAdminEditGuard must be used within AdminEditGuardProvider');
  }
  return context;
};
