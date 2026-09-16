'use client';

import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { requestLogout } from '@/capabilities/auth/auth.client';
import { useContent } from '@/contexts/ContentContext';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import styles from './AdminLayout.module.css';

const NAV_GROUPS = [
  { label: '콘텐츠', items: [
    { label: '공연', path: '/admin/events' },
    { label: '아카이브', path: '/admin/archive' },
    { label: '음악', path: '/admin/music' },
  ] },
  { label: '사이트', items: [
    { label: '홈', path: '/admin/home' },
    { label: '소개', path: '/admin/about' },
    { label: '연락처', path: '/admin/contact' },
    { label: '링크', path: '/admin/link' },
    { label: '디자인 참조', path: '/admin/theme' },
  ] },
];

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { currentEditLanguage, setCurrentEditLanguage } = useContent();
  const { requestExit } = useAdminEditGuard();
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
          <label className={styles.language}>
            <span>편집 언어</span>
            <select value={currentEditLanguage} onChange={(event) => {
              const language = event.target.value as 'ko' | 'en';
              if (language !== currentEditLanguage) requestExit(() => setCurrentEditLanguage(language));
            }}>
              <option value="ko">한국어</option><option value="en">English</option>
            </select>
          </label>
        </header>
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
