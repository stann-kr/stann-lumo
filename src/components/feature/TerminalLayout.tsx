'use client';
import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useContent } from '../../contexts/ContentContext';
import { SITE_NAME, SITE_VERSION, TERMINAL_URL } from '../../constants/site';
import CursorGlow from '../home/CursorGlow';
import LiveClock from '../home/LiveClock';
import Scene3D from './Scene3D';

interface TerminalLayoutProps {
  children: ReactNode;
}

const TerminalLayout = ({ children }: TerminalLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { content, isLoading, isError } = useContent();

  // pathname 변경 = 네비게이션 완료 → 스피너 해제
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const NAV_ITEMS = [
    { label: t('nav_home'), path: '/' },
    { label: t('nav_about'), path: '/about' },
    { label: t('nav_music'), path: '/music' },
    { label: t('nav_events'), path: '/events' },
    { label: t('nav_gallery'), path: '/gallery' },
    { label: t('nav_contact'), path: '/contact' },
    { label: t('nav_link'), path: '/link' },
    { label: 'TERMINAL', path: TERMINAL_URL, external: true },
  ];

  const artistName = (() => {
    if (!Array.isArray(content.artistInfo)) return SITE_NAME;
    const item = content.artistInfo.find((i) => i.key === 'Name' || i.key === '이름');
    return item?.value || SITE_NAME;
  })();

  const handleNavClick = (path: string) => {
    if (path === pathname) return;
    setIsNavigating(true);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-transparent text-[var(--color-primary)] font-sans antialiased flex selection:bg-[var(--color-accent)] selection:text-white">
      {/* 전역 커서 글로우 (Sci-Fi 스타일 유지) */}
      <CursorGlow />

      {/* Desktop Sidebar (HUD Left Panel) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:border-[var(--color-muted)] lg:bg-[var(--color-bg-sidebar)]/80 lg:backdrop-blur-sm z-40">
        
        {/* HUD Top-Left Branding Container */}
        <div className="hud-crosshair p-8 border-b border-[var(--color-muted)] relative">
          <div className="absolute top-2 left-2 text-[8px] font-mono text-[var(--color-muted)] tracking-widest">
            SYS.ID: SL-01
          </div>
          <Link href="/" className="block mt-4 text-2xl font-bold tracking-[0.2em] text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors">
            {isLoading ? (
              <span className="opacity-0 select-none">—</span>
            ) : (
              artistName.split(' ').map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))
            )}
          </Link>
          <div className="mt-2 text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-widest">
            <span className="w-2 h-2 inline-block bg-[var(--color-accent)] mr-2 animate-pulse"></span>
            STATUS: ACTIVE
          </div>
        </div>

        {/* HUD Navigation */}
        <nav className="flex-1 p-6 overflow-y-auto">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item, index) => {
              const isActive = !item.external && (
                item.path === '/'
                  ? pathname === '/'
                  : pathname === item.path || pathname.startsWith(item.path + '/')
              );
              const numStr = (index + 1).toString().padStart(2, '0');

              return (
                <li key={item.path}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer group text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <span className="font-mono text-[9px] opacity-50">[{numStr}]</span>
                      <span className="font-mono text-xs tracking-widest uppercase">{item.label}</span>
                      <i className="ri-external-link-line text-[10px] opacity-0 group-hover:opacity-100 ml-auto transition-opacity"></i>
                    </a>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer relative transition-colors ${
                        isActive
                          ? 'text-[var(--color-accent)]'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-accent)]"></span>
                      )}
                      <span className="font-mono text-[9px] opacity-50">[{numStr}]</span>
                      <span className="font-mono text-xs tracking-widest uppercase">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* HUD Footer (Time & Version) */}
        <div className="p-6 border-t border-[var(--color-muted)] space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono text-[var(--color-muted)] uppercase tracking-widest">LOCAL TIME</span>
            <LiveClock className="text-xs font-mono text-[var(--color-primary)] tracking-widest tabular-nums font-bold" />
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-[var(--color-muted)] uppercase tracking-widest">VERSION</span>
              <span className="text-[10px] font-mono text-[var(--color-primary)]">{SITE_VERSION}</span>
            </div>
            
            {/* Language Toggle HUD */}
            <div className="flex items-center gap-1 border border-[var(--color-muted)] px-2 py-1 bg-black">
              <button
                onClick={() => setLanguage('en')}
                className={`text-[10px] font-mono tracking-widest px-1 transition-colors ${
                  language === 'en' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                EN
              </button>
              <span className="text-[10px] font-mono text-[var(--color-muted)]">|</span>
              <button
                onClick={() => setLanguage('ko')}
                className={`text-[10px] font-mono tracking-widest px-1 transition-colors ${
                  language === 'ko' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                KO
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top HUD Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-muted)]">
        <div className="flex items-center justify-between px-6 h-16 pt-[env(safe-area-inset-top)]">
          <Link href="/" className="text-lg font-bold font-sans tracking-[0.2em] text-[var(--color-primary)]">
            {isLoading ? '' : artistName}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex flex-col items-center justify-center gap-[4px] cursor-pointer"
            aria-label={mobileMenuOpen ? t('nav_close_menu') : t('nav_open_menu')}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`w-5 h-[1px] bg-[var(--color-primary)] transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}`}></span>
            <span className={`w-5 h-[1px] bg-[var(--color-primary)] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-5 h-[1px] bg-[var(--color-primary)] transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Nav Menu */}
        <nav
          className={`absolute top-full left-0 right-0 bg-[var(--color-bg)] border-b border-[var(--color-muted)] overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="py-4 px-6 space-y-2">
            {NAV_ITEMS.map((item, index) => {
              const isActive = !item.external && (
                item.path === '/'
                  ? pathname === '/'
                  : pathname === item.path || pathname.startsWith(item.path + '/')
              );
              const numStr = (index + 1).toString().padStart(2, '0');

              return (
                <li key={item.path}>
                  {item.external ? (
                     <a
                     href={item.path}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-3 py-3 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                   >
                     <span className="font-mono text-[10px] opacity-50">[{numStr}]</span>
                     <span className="font-mono text-sm tracking-widest uppercase">{item.label}</span>
                     <i className="ri-external-link-line text-xs ml-auto"></i>
                   </a>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`flex items-center gap-3 py-3 relative ${
                        isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                      }`}
                    >
                      {isActive && <span className="absolute left-[-24px] w-1 h-full bg-[var(--color-accent)]"></span>}
                      <span className="font-mono text-[10px] opacity-50">[{numStr}]</span>
                      <span className="font-mono text-sm tracking-widest uppercase">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          
          <div className="px-6 py-4 border-t border-[var(--color-muted)] flex justify-between items-center">
            <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest">LANG</span>
            <div className="flex gap-2">
              <button onClick={() => setLanguage('en')} className={`font-mono text-xs ${language==='en'?'text-[var(--color-accent)]':'text-[var(--color-muted)]'}`}>EN</button>
              <span className="font-mono text-[10px] text-[var(--color-muted)]">|</span>
              <button onClick={() => setLanguage('ko')} className={`font-mono text-xs ${language==='ko'?'text-[var(--color-accent)]':'text-[var(--color-muted)]'}`}>KO</button>
            </div>
          </div>
        </nav>
      </header>

      {/* 3D Background */}
      <Scene3D />

      {/* Main Content (HUD Viewport) */}
      <main className="flex-1 lg:ml-64 relative mobile-header-offset">
        {/* HUD Viewport Brackets at the corners of Main space */}
        <div className="hidden lg:block absolute top-8 left-8 w-4 h-4 border-t border-l border-[var(--color-muted)] pointer-events-none"></div>
        <div className="hidden lg:block absolute top-8 right-8 w-4 h-4 border-t border-r border-[var(--color-muted)] pointer-events-none"></div>
        <div className="hidden lg:block absolute bottom-8 left-8 w-4 h-4 border-b border-l border-[var(--color-muted)] pointer-events-none"></div>
        <div className="hidden lg:block absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[var(--color-muted)] pointer-events-none"></div>

        {isLoading || isNavigating ? (
          <div className="min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh] flex items-center justify-center">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-accent)] flex flex-col items-center gap-2">
              <div className="w-4 h-4 border border-[var(--color-accent)] border-t-transparent animate-spin"></div>
              <span className="animate-pulse">FETCHING DATA...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh] flex items-center justify-center">
            <div className="font-mono flex flex-col items-center gap-4 text-center px-8">
              <div className="text-[10px] tracking-[0.2em] text-[var(--color-muted)] uppercase">
                SYS.ERR — CONNECTION FAILED
              </div>
              <div className="w-8 h-[1px] bg-[var(--color-muted)]"></div>
              <p className="text-xs text-[var(--color-muted)] tracking-widest max-w-xs leading-relaxed">
                일시적인 서버 오류가 발생했습니다.<br />
                잠시 후 다시 시도해 주세요.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 border border-[var(--color-muted)] px-6 py-2 text-[10px] font-mono tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
              >
                RETRY
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh] p-4 md:p-8 lg:p-12 relative z-10"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default TerminalLayout;
