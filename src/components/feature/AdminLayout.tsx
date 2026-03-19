'use client';
import { useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useContent } from '../../contexts/ContentContext';
import { createColorMixStyle } from '../../utils/colorMix';
import { COLOR_VARS } from '../../constants/colors';
import { TRANSITION } from '../../constants/styles';

interface AdminLayoutProps {
  children: ReactNode;
}

const ADMIN_NAV_ITEMS = [
  { label: 'HOME', path: '/admin/home' },
  { label: 'ABOUT', path: '/admin/about' },
  { label: 'MUSIC', path: '/admin/music' },
  { label: 'EVENTS', path: '/admin/events' },
  { label: 'GALLERY', path: '/admin/gallery' },
  { label: 'CONTACT', path: '/admin/contact' },
  { label: 'LINK', path: '/admin/link' },
  { label: 'THEME', path: '/admin/theme' },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { currentEditLanguage, setCurrentEditLanguage } = useContent();

  const handleNavClick = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  const handleBackToSite = () => {
    router.push('/');
  };

  const borderStyle = createColorMixStyle(COLOR_VARS.SECONDARY, 15);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-secondary)] font-mono flex">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:bg-[var(--color-bg)]"
        style={borderStyle}
      >
        {/* Logo/Brand */}
        <div className="p-8 border-b" style={borderStyle}>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] tracking-wider">
            ADMIN
          </h1>
          <p className="text-xs text-[var(--color-accent)] mt-2 tracking-widest">CONTENT MANAGEMENT</p>

          {/* Edit Language Indicator */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)]/60 tracking-wider">EDITING:</span>
            <div className="inline-flex items-center gap-1 bg-[var(--color-secondary)]/5 px-2 py-1 rounded">
              <button
                onClick={() => setCurrentEditLanguage('en')}
                className={`px-2 py-0.5 text-xs tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                  currentEditLanguage === 'en'
                    ? 'text-[var(--color-accent)] font-bold'
                    : 'text-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]/70'
                }`}
              >
                EN
              </button>
              <span className="text-[var(--color-secondary)]/30">|</span>
              <button
                onClick={() => setCurrentEditLanguage('ko')}
                className={`px-2 py-0.5 text-xs tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                  currentEditLanguage === 'ko'
                    ? 'text-[var(--color-accent)] font-bold'
                    : 'text-[var(--color-secondary)]/40 hover:text-[var(--color-secondary)]/70'
                }`}
              >
                KO
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <ul className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full text-left px-4 py-3 cursor-pointer whitespace-nowrap relative group ${
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-secondary)]/10'
                        : 'text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
                    }`}
                    style={{ transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-secondary)]"></span>
                    )}
                    <span className="text-sm tracking-widest">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t space-y-2" style={borderStyle}>
          <button
            onClick={handleBackToSite}
            className="w-full px-4 py-2 text-sm tracking-widest text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 cursor-pointer whitespace-nowrap"
            style={{ transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
          >
            <i className="ri-arrow-left-line mr-2"></i>
            BACK TO SITE
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm tracking-widest text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 cursor-pointer whitespace-nowrap"
            style={{ transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
          >
            <i className="ri-logout-box-line mr-2"></i>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b"
        style={borderStyle}
      >
        <div className="flex items-center justify-between px-6 h-16">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-wider">
              ADMIN
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--color-muted)]/60 tracking-wider">EDITING:</span>
              <button
                onClick={() => setCurrentEditLanguage(currentEditLanguage === 'en' ? 'ko' : 'en')}
                className="text-xs text-[var(--color-accent)] font-bold tracking-widest cursor-pointer"
              >
                {currentEditLanguage.toUpperCase()}
              </button>
            </div>
          </div>
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
          className={`absolute top-full left-0 right-0 bg-[var(--color-bg)] border-b ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          style={{ ...borderStyle, transition: `${TRANSITION.DURATION.MEDIUM} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
        >
          <ul className="py-4">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full text-left px-6 py-4 cursor-pointer ${
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-secondary)]/10'
                        : 'text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
                    }`}
                    style={{
                      ...(isActive ? { borderLeft: '2px solid var(--color-secondary)' } : {}),
                      transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}`
                    }}
                  >
                    <span className="text-sm tracking-widest">{item.label}</span>
                  </button>
                </li>
              );
            })}
            <li className="mt-4 pt-4 border-t" style={borderStyle}>
              <button
                onClick={handleBackToSite}
                className="w-full text-left px-6 py-3 text-sm tracking-widest text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 cursor-pointer whitespace-nowrap"
                style={{ transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
              >
                <i className="ri-arrow-left-line mr-2"></i>
                BACK TO SITE
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-6 py-3 text-sm tracking-widest text-[var(--color-secondary)]/70 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 cursor-pointer whitespace-nowrap"
                style={{ transition: `${TRANSITION.DURATION.DEFAULT} ${TRANSITION.TIMING.EASE_IN_OUT}` }}
              >
                <i className="ri-logout-box-line mr-2"></i>
                LOGOUT
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="min-h-screen p-6 md:p-12 lg:p-16">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
