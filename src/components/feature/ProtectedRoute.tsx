'use client';
import { useEffect, useCallback, useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';

/** 세션 재검증 주기 (ms) — 5분 */
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * 어드민 세션 쿠키 검증 기반 라우트 보호 컴포넌트
 *
 * - 초기 마운트: /api/auth/session 유효성 확인
 * - 이후 5분 간격 주기적 재검증 → 만료 시 /admin 자동 리다이렉트
 * - 미인증 시 /admin 으로 리다이렉트
 */
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const verifySession = useCallback(
    async (isInitial = false): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/session');
        const data = (await res.json()) as { success: boolean; data?: { authenticated: boolean } };
        if (data.data?.authenticated) {
          if (isInitial) {
            setAuthenticated(true);
            setChecked(true);
          }
          return true;
        }
      } catch {
        // 네트워크 오류 — 세션 상태 불명확, 초기 체크 시에만 리다이렉트
      }
      router.replace('/admin');
      return false;
    },
    [router],
  );

  // 초기 세션 확인
  useEffect(() => {
    let cancelled = false;
    verifySession(true).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [verifySession]);

  // 주기적 세션 재검증 (만료 감지)
  useEffect(() => {
    if (!authenticated) return;

    const intervalId = setInterval(() => {
      verifySession(false);
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [authenticated, verifySession]);

  if (!checked || !authenticated) return null;
  return children;
};

export default ProtectedRoute;
