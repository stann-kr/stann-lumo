'use client';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { adminLoginHref, getAdminSessionState, type AdminSessionState } from '@/capabilities/auth/auth.client';
import styles from './ProtectedRoute.module.css';

/**
 * 어드민 진입 시 세션을 한 번 확인한다.
 * - 서버가 미인증이라고 답하면 현재 화면으로 돌아올 수 있게 로그인으로 보낸다.
 * - 응답을 받지 못하면(오프라인·서버 오류) 로그인으로 보내지 않고 다시 시도할 수 있게 한다.
 * 편집 중 만료 감지는 편집 상태를 아는 AdminLayout이 맡는다.
 */
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [state, setState] = useState<'checking' | 'ready' | 'unreachable'>('checking');

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const applySession = useCallback((session: AdminSessionState) => {
    if (session === 'authenticated') setState('ready');
    else if (session === 'unauthenticated') router.replace(adminLoginHref(pathnameRef.current));
    else setState('unreachable');
  }, [router]);

  useEffect(() => {
    let active = true;
    void getAdminSessionState().then((session) => { if (active) applySession(session); });
    return () => { active = false; };
  }, [applySession]);

  if (state === 'ready') return children;
  if (state === 'unreachable') {
    return (
      <main className={styles.gate}>
        <section role="alert" className={styles.panel}>
          <p className={styles.brand}>STANN LUMO</p>
          <h1>관리자 화면에 연결하지 못했습니다.</h1>
          <p>네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>
          <button type="button" onClick={() => { setState('checking'); void getAdminSessionState().then(applySession); }}>다시 시도</button>
        </section>
      </main>
    );
  }
  return <p role="status" aria-live="polite" className="sr-only">로그인 상태를 확인하는 중…</p>;
};

export default ProtectedRoute;
