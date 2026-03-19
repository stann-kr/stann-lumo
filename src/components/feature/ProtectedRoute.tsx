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

  // setState 없이 인증 여부만 반환 — 상태 변경은 호출자 책임
  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session');
      const data = (await res.json()) as { success: boolean; data?: { authenticated: boolean } };
      return !!data.data?.authenticated;
    } catch {
      // 네트워크 오류 — 인증 불명확
      return false;
    }
  }, []);

  // 초기 세션 확인
  useEffect(() => {
    let cancelled = false;
    verifySession().then((isAuth) => {
      if (cancelled) return;
      if (isAuth) {
        setAuthenticated(true);
        setChecked(true);
      } else {
        router.replace('/admin');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [verifySession, router]);

  // 주기적 세션 재검증 (만료 감지)
  useEffect(() => {
    if (!authenticated) return;

    const intervalId = setInterval(() => {
      verifySession().then((isAuth) => {
        if (!isAuth) router.replace('/admin');
      });
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [authenticated, verifySession, router]);

  if (!checked || !authenticated) return null;
  return children;
};

export default ProtectedRoute;
