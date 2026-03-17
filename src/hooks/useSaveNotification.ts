import { useState, useCallback, useEffect, useRef } from 'react';
import type { SaveNotificationReturn } from '../types/admin';

/**
 * 저장 알림 표시 로직 훅
 * 
 * 저장 성공 시 일정 시간 동안 알림 메시지를 표시하고 자동으로 숨김
 * 
 * @param duration - 알림 표시 시간 (밀리초, 기본값: 3000ms)
 * @returns 알림 상태 및 핸들러 객체
 * 
 * @example
 * ```tsx
 * const { showSuccess, showNotification } = useSaveNotification(3000);
 * 
 * // 저장 성공 시
 * const handleSave = () => {
 *   updateContent(data);
 *   showNotification();
 * };
 * 
 * // 조건부 렌더링
 * {showSuccess && <SuccessMessage />}
 * ```
 */
export function useSaveNotification(duration: number = 3000): SaveNotificationReturn & {
  isVisible: boolean;
} {
  const [showSuccess, setShowSuccess] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 알림 표시 트리거
   * - 기존 타이머가 있으면 취소하고 새로 시작
   * - 지정된 시간 후 자동으로 알림 숨김
   */
  const showNotification = useCallback(() => {
    // 기존 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowSuccess(true);
    timeoutRef.current = setTimeout(() => {
      setShowSuccess(false);
    }, duration);
  }, [duration]);

  /**
   * 컴포넌트 언마운트 시 타이머 정리
   * - 메모리 누수 방지
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    showSuccess,
    isVisible: showSuccess,
    showNotification,
    triggerSave: showNotification,
  };
}