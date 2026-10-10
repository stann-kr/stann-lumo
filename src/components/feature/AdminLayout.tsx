'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { adminLoginHref, getAdminSessionState, requestLogout } from '@/capabilities/auth/auth.client';
import { ADMIN_UNAUTHORIZED_EVENT } from '@/capabilities/auth/adminSessionEvents';
import { useContent } from '@/contexts/ContentContext';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import styles from './AdminLayout.module.css';

/** 편집 중 세션 재검증 주기 (ms) — 5분. 창으로 돌아올 때와 401 응답 때도 바로 확인한다. */
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

const NAV_GROUPS = [
  { label: '콘텐츠', items: [
    { label: '공연', path: '/admin/events', publicPath: '/events' },
    { label: '아카이브', path: '/admin/archive', publicPath: '/archive' },
    { label: '음악', path: '/admin/music', publicPath: '/music' },
  ] },
  { label: '사이트', items: [
    { label: '홈', path: '/admin/home', publicPath: '/' },
    { label: '소개', path: '/admin/about', publicPath: '/about' },
    { label: '연락처', path: '/admin/contact', publicPath: '/contact' },
    { label: '링크', path: '/admin/link', publicPath: '/link' },
    { label: '디자인 참조', path: '/admin/theme', publicPath: '/' },
  ] },
];

/**
 * 편집 중 세션 만료를 감지한다. 저장하지 않은 변경이 없으면 현재 화면으로 돌아오는 로그인으로 보내고,
 * 변경이 있으면 화면을 유지한 채 다시 로그인할 방법을 안내한다. 응답이 없을 때는 아무것도 바꾸지 않는다.
 */
function useSessionExpiry(isDirty: boolean, pathname: string) {
  const router = useRouter();
  const [expired, setExpired] = useState(false);
  const latest = useRef({ isDirty, pathname });

  useEffect(() => { latest.current = { isDirty, pathname }; }, [isDirty, pathname]);

  useEffect(() => {
    let active = true;
    let pending = false;
    const check = async () => {
      if (pending) return;
      pending = true;
      const session = await getAdminSessionState();
      pending = false;
      if (!active) return;
      if (session === 'authenticated') setExpired(false);
      else if (session === 'unauthenticated') {
        if (latest.current.isDirty) setExpired(true);
        else router.replace(adminLoginHref(latest.current.pathname));
      }
    };
    const checkWhenVisible = () => { if (document.visibilityState === 'visible') void check(); };
    const onUnauthorized = () => { void check(); };
    const interval = window.setInterval(() => { void check(); }, SESSION_CHECK_INTERVAL);
    document.addEventListener('visibilitychange', checkWhenVisible);
    window.addEventListener('focus', checkWhenVisible);
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkWhenVisible);
      window.removeEventListener('focus', checkWhenVisible);
      window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [router]);

  return expired;
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { currentEditLanguage, setCurrentEditLanguage } = useContent();
  const { isDirty, requestExit } = useAdminEditGuard();
  const sessionExpired = useSessionExpiry(isDirty, pathname);
  const currentPage = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.path === pathname);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (pathname === path) { setMenuOpen(false); return; }
    requestExit(() => { setMenuOpen(false); router.push(path); });
  };

  const logout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      await requestLogout();
      router.push('/admin');
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 다시 시도해 주세요.');
    } finally { setIsLoggingOut(false); }
  };

  return (
    <div className={styles.admin} onKeyDown={(event) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <a className={styles.skip} href="#admin-content">편집 영역으로 건너뛰기</a>
      <aside className={styles.sidebar} data-open={menuOpen} id="admin-navigation">
        <div className={styles.brand}>STANN LUMO<span>콘텐츠 관리</span></div>
        <nav aria-label="관리자 메뉴" className={styles.navigation}>
          {NAV_GROUPS.map((group) => <div key={group.label} className={styles.group}>
            <p>{group.label}</p>
            {group.items.map((item) => <Link key={item.path} href={item.path}
              aria-current={pathname === item.path ? 'page' : undefined}
              onClick={(event) => navigate(event, item.path)}>{item.label}</Link>)}
          </div>)}
        </nav>
        <div className={styles.footer}>
          <Link href="/" onClick={(event) => navigate(event, '/')}>사이트 보기</Link>
          <button type="button" disabled={isLoggingOut} onClick={() => requestExit(() => { void logout(); })}>
            {isLoggingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
          {logoutError && <p role="alert">{logoutError}</p>}
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.toolbar}>
          <div className={styles.location}>
            <button ref={menuButton} type="button" className={styles.menuToggle}
              aria-expanded={menuOpen} aria-controls="admin-navigation"
              onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '메뉴 닫기' : '메뉴'}</button>
            <span>관리자</span><span aria-hidden="true">/</span><strong>{currentPage?.label ?? '콘텐츠'}</strong>
          </div>
          <div className={styles.tools}>
            {/* A new tab keeps the editor and its unsaved draft in place while checking the public page. */}
            <a className={styles.publicLink} href={currentPage?.publicPath ?? '/'} target="_blank" rel="noopener noreferrer">
              공개 화면<span className="sr-only"> (새 창)</span>
            </a>
            <label className={styles.language}>
              <span>편집 언어</span>
              <select value={currentEditLanguage} onChange={(event) => {
                const language = event.target.value as 'ko' | 'en';
                if (language !== currentEditLanguage) requestExit(() => setCurrentEditLanguage(language));
              }}>
                <option value="ko">한국어</option><option value="en">English</option>
              </select>
            </label>
          </div>
        </header>
        {sessionExpired && (
          <div role="alert" className={styles.sessionNotice}>
            <p><strong>로그인이 만료되었습니다.</strong> 저장하지 않은 변경 사항은 이 화면에 그대로 있습니다. 새 창에서 다시 로그인한 뒤 이 화면으로 돌아와 저장해 주세요.</p>
            <a href={adminLoginHref(pathname)} target="_blank" rel="noopener noreferrer">새 창에서 로그인</a>
          </div>
        )}
        <main id="admin-content" tabIndex={-1} className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminEditGuardProvider><AdminLayoutContent>{children}</AdminLayoutContent></AdminEditGuardProvider>;
}
