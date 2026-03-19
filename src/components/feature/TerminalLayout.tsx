'use client';
import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { useContent } from '../../contexts/ContentContext';
import { createColorMixStyle } from '../../utils/colorMix';
import { COLOR_VARS } from '../../constants/colors';
import { TRANSITION } from '../../constants/styles';
import { SITE_NAME, SITE_VERSION, TERMINAL_URL } from '../../constants/site';
import CursorGlow from '../home/CursorGlow';
import LiveClock from '../home/LiveClock';

interface TerminalLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Music', path: '/music' },
  { label: 'Events', path: '/events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
  { label: 'Link', path: '/link' },
  { label: 'TERMINAL', path: TERMINAL_URL, external: true },
];

const TerminalLayout = ({ children }: TerminalLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const { content } = useContent();

  const artistName = (() => {
    if (!Array.isArray(content.artistInfo)) return SITE_NAME;
    const item = content.artistInfo.find((i) => i.key === 'Name' || i.key === '이름');
    return item?.value || SITE_NAME;
  })();

  const handleNavClick = (path: string) => {
    if (path === pathname) return;
    setMobileMenuOpen(false);
  };

  const borderStyle = createColorMixStyle(COLOR_VARS.SECONDARY, 15);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-secondary)] font-mono flex">
      {/* 전역 커서 글로우 — 모든 페이지에 적용 */}
      <CursorGlow />

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:bg-[var(--color-bg-sidebar)]"
        style={borderStyle}
      >
        {/* Logo/Brand */}
        <div className="p-8 border-b" style={borderStyle}>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] tracking-wider">
            {artistName.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = !item.external && pathname === item.path;
              return (
                <li key={item.path}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-4 py-3 cursor-pointer whitespace-nowrap relative group flex items-center justify-between text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5"
                      style={{ transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
                    >
                      <span className="text-sm tracking-widest uppercase">{item.label}</span>
                      <i className="ri-external-link-line text-xs opacity-50 group-hover:opacity-100" style={{ transition: `opacity ${TRANSITION.DURATION.DEFAULT}` }}></i>
                    </a>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`block px-4 py-3 cursor-pointer whitespace-nowrap relative group ${
                        isActive
                          ? 'text-[var(--color-primary)] bg-[var(--color-secondary)]/10'
                          : 'text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
                      }`}
                      style={{ transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-secondary)]"></span>
                      )}
                      <span className="text-sm tracking-widest uppercase">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info — 시계 + 언어 전환 */}
        <div className="p-6 border-t space-y-3" style={borderStyle}>
          {/* ONLINE + 시계 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-pulse"></span>
              <span className="tracking-widest">ONLINE</span>
            </div>
            <LiveClock className="text-xs font-mono text-[var(--color-secondary)]/50 tracking-widest tabular-nums" />
          </div>
          {/* 버전 + 언어 전환 */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-secondary)]/25">{SITE_VERSION}</p>
            <div className="flex items-center gap-1 rounded px-2 py-1" style={borderStyle}>
              <button
                onClick={toggleLanguage}
                className={`text-xs tracking-widest cursor-pointer px-1 ${
                  language === 'en' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]/30'
                }`}
                style={{ transition: `color ${TRANSITION.DURATION.DEFAULT}` }}
              >
                EN
              </button>
              <span className="text-xs text-[var(--color-secondary)]/30">|</span>
              <button
                onClick={toggleLanguage}
                className={`text-xs tracking-widest cursor-pointer px-1 ${
                  language === 'ko' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]/30'
                }`}
                style={{ transition: `color ${TRANSITION.DURATION.DEFAULT}` }}
              >
                KO
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-sidebar)]/95 backdrop-blur-sm border-b"
        style={borderStyle}
      >
        <div className="flex items-center justify-between px-6 h-16">
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-wider">
            {artistName}
          </h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-[var(--color-secondary)] ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}></span>
            <span className={`w-6 h-0.5 bg-[var(--color-secondary)] ${mobileMenuOpen ? 'opacity-0' : ''}`} style={{ transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}></span>
            <span className={`w-6 h-0.5 bg-[var(--color-secondary)] ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <nav
          className={`absolute top-full left-0 right-0 bg-[var(--color-bg-sidebar)] border-b ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          style={{ ...borderStyle, transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
        >
          <ul className="py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = !item.external && pathname === item.path;
              return (
                <li key={item.path}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-6 py-4 cursor-pointer flex items-center justify-between text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5"
                      style={{ transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
                    >
                      <span className="text-sm tracking-widest uppercase">{item.label}</span>
                      <i className="ri-external-link-line text-xs opacity-50"></i>
                    </a>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`block px-6 py-4 cursor-pointer ${
                        isActive
                          ? 'text-[var(--color-primary)] bg-[var(--color-secondary)]/10'
                          : 'text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
                      }`}
                      style={{
                        ...(isActive ? { borderLeft: '2px solid var(--color-secondary)' } : {}),
                        transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}`
                      }}
                    >
                      <span className="text-sm tracking-widest uppercase">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          {/* 모바일 언어 전환 */}
          <div className="px-6 py-4 border-t" style={borderStyle}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-secondary)]/50 tracking-widest">LANGUAGE</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleLanguage}
                  className={`text-xs tracking-widest cursor-pointer ${
                    language === 'en' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]/30'
                  }`}
                  style={{ transition: `color ${TRANSITION.DURATION.DEFAULT}` }}
                >
                  EN
                </button>
                <span className="text-xs text-[var(--color-secondary)]/30">/</span>
                <button
                  onClick={toggleLanguage}
                  className={`text-xs tracking-widest cursor-pointer ${
                    language === 'ko' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary)]/30'
                  }`}
                  style={{ transition: `color ${TRANSITION.DURATION.DEFAULT}` }}
                >
                  KO
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div
          key={pathname}
          className="min-h-screen p-6 md:p-12 lg:p-16 animate-fadeIn"
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default TerminalLayout;
