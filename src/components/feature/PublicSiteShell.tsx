"use client";
import { useCallback, useEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import Link, { PublicNavigationContext } from './PublicLink';
import PublicPageLoading from './PublicPageLoading';
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../contexts/LanguageContext";
import { SITE_NAME, TERMINAL_URL, INSTAGRAM_URL, SOUNDCLOUD_URL } from "../../constants/site";
import LumoWordmark from "../base/LumoWordmark";
import styles from "./PublicSiteShell.module.css";
import { useShellMotion } from './useShellMotion';
import { PublicMotionInputContext, type MotionInput } from './publicMotion';

interface PublicSiteShellProps {
  children: ReactNode;
  artistName?: string;
}

const PublicSiteShell = ({ children, artistName = SITE_NAME }: PublicSiteShellProps) => {
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const mobileMenuOpen = mobileMenuPath === pathname;
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const shellRef = useRef<HTMLDivElement>(null);
  const motionInputRef = useRef<MotionInput>('pointer');
  useShellMotion(shellRef, pathname, mobileMenuOpen, motionInputRef);
  const mainRef = useRef<HTMLElement | null>(null);
  const brandRef = useRef<HTMLAnchorElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDialogRef = useRef<HTMLDivElement | null>(null);
  const previousPathnameRef = useRef(pathname);
  const shouldFocusMainRef = useRef(false);
  const wasMobileMenuOpenRef = useRef(false);
  const restoreMobileMenuFocusRef = useRef(true);

  const mainNavigationLabel = language === "ko" ? "주요 탐색" : "Primary navigation";
  const mobileNavigationLabel = language === "ko" ? "모바일 탐색" : "Mobile navigation";
  const skipLinkLabel = language === "ko" ? "본문으로 건너뛰기" : "Skip to main content";
  const newTabLabel = language === "ko" ? " (새 창)" : " (opens in a new tab)";

  useEffect(() => {
    const keyboard = () => { motionInputRef.current = 'keyboard'; };
    const pointer = () => { motionInputRef.current = 'pointer'; };
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('pointerdown', pointer, true);
    return () => {
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('pointerdown', pointer, true);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen && !isNavigating) return;
    const documentStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previous = { overflow: documentStyle.overflow, gutter: documentStyle.scrollbarGutter, bodyOverflow: bodyStyle.overflow };
    documentStyle.scrollbarGutter = 'stable';
    documentStyle.overflow = 'hidden';
    bodyStyle.overflow = 'hidden';
    return () => {
      documentStyle.overflow = previous.overflow;
      documentStyle.scrollbarGutter = previous.gutter;
      bodyStyle.overflow = previous.bodyOverflow;
    };
  }, [mobileMenuOpen, isNavigating]);

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    restoreMobileMenuFocusRef.current = restoreFocus;
    setMobileMenuPath(null);
  }, []);

  const navigate = useCallback((href: string, options?: { replace?: boolean; scroll?: boolean }) => {
    const destination = new URL(href, window.location.href);
    const sameDocument = destination.pathname === window.location.pathname && destination.search === window.location.search;
    closeMobileMenu(sameDocument);
    // React follows the router's actual commit, including interrupted navigation.
    startNavigation(() => {
      if (options?.replace) router.replace(href, { scroll: options.scroll });
      else router.push(href, { scroll: options?.scroll });
    });
  }, [closeMobileMenu, router]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    // Back/forward navigation must also release the modal background.
    restoreMobileMenuFocusRef.current = false;
    shouldFocusMainRef.current = true;
  }, [pathname]);

  useEffect(() => {
    if (!shouldFocusMainRef.current || isNavigating) return;

    const frame = window.requestAnimationFrame(() => {
      let anchor: HTMLElement | null = null;
      try { anchor = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch { /* Malformed fragments fall back to the main landmark. */ }
      // Preserve router/back scroll restoration and the archive's selected tile.
      const target = anchor && mainRef.current?.contains(anchor) ? anchor : mainRef.current;
      target?.focus({ preventScroll: true });
      shouldFocusMainRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isNavigating, pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      wasMobileMenuOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        mobileDialogRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (!wasMobileMenuOpenRef.current) return;

    wasMobileMenuOpenRef.current = false;
    const shouldRestoreFocus = restoreMobileMenuFocusRef.current;
    restoreMobileMenuFocusRef.current = true;
    if (!shouldRestoreFocus) return;

    const frame = window.requestAnimationFrame(() => {
      mobileMenuButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia("(min-width: 1200px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches && mobileMenuOpen) {
        closeMobileMenu(false);
        // The menu trigger disappears at desktop width; keep focus on visible navigation.
        brandRef.current?.focus();
      }
    };

    desktopBreakpoint.addEventListener("change", handleBreakpointChange);
    return () => desktopBreakpoint.removeEventListener("change", handleBreakpointChange);
  }, [closeMobileMenu, mobileMenuOpen]);

  // v5 canvas: the header names the artist's work in English in both languages; the wordmark is Home.
  const navItems = [
    { label: "Music", path: "/music" },
    { label: "Events", path: "/events" },
    { label: "Archive", path: "/archive" },
    { label: "About", path: "/about" },
    { label: "Press kit", path: "/press-kit" },
  ];
  const secondaryItems = [
    { label: "Contact", path: "/contact" },
    { label: "Links", path: "/link" },
  ];
  const isCurrent = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const handleMobileDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = mobileDialogRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
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

  const navigation = (label: string) => (
    <nav aria-label={label}>
      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link href={item.path} aria-current={isCurrent(item.path) ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
  const languageControls = (
    <div className={styles.languages}>
      <button type="button" onClick={() => setLanguage("ko")} aria-label="언어를 한국어로 전환" aria-pressed={language === "ko"}>KO</button>
      <button type="button" onClick={() => setLanguage("en")} aria-label="Switch language to English" aria-pressed={language === "en"}>EN</button>
    </div>
  );

  return (
    <PublicNavigationContext value={navigate}>
    <PublicMotionInputContext value={motionInputRef}>
    <div ref={shellRef} className={styles.shell}>
      <div inert={mobileMenuOpen || undefined} className={styles.document}>
        <a href="#main-content" className={styles.skipLink}>{skipLinkLabel}</a>
        <header className={styles.header}>
          <Link ref={brandRef} href="/" className={styles.brand} aria-label={artistName}><LumoWordmark className={styles.wordmark} title={artistName} /></Link>
          <div className={styles.desktopNav}>{navigation(mainNavigationLabel)}</div>
          <div className={styles.tools}>
            <div className={styles.desktopOnly}>{languageControls}</div>
            <Link href="/contact" className={styles.booking} aria-current={isCurrent("/contact") ? "page" : undefined}>Booking</Link>
            <button ref={mobileMenuButtonRef} type="button" className={styles.menuButton}
              onClick={(event) => { motionInputRef.current = event.detail === 0 ? 'keyboard' : 'pointer'; setMobileMenuPath(pathname); }} aria-label={t("nav_open_menu")}
              aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation-dialog">
              Menu
            </button>
          </div>
        </header>
        <main ref={mainRef} id="main-content" tabIndex={-1} aria-busy={isNavigating} className={styles.main}>
          <div inert={isNavigating || undefined} className={isNavigating ? styles.pendingContent : undefined}>{children}</div>
        </main>
        <footer inert={isNavigating || undefined} className={`${styles.footer} ${isNavigating ? styles.pendingContent : ''}`}>
          <span className={styles.copyright}>© {artistName} · Seoul</span>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram ↗<span className="sr-only">{newTabLabel}</span></a>
          <a href={SOUNDCLOUD_URL} target="_blank" rel="noopener noreferrer">SoundCloud ↗<span className="sr-only">{newTabLabel}</span></a>
          <Link href="/link">Links →</Link>
          <a href={TERMINAL_URL} target="_blank" rel="noopener noreferrer">Terminal ↗<span className="sr-only">{newTabLabel}</span></a>
        </footer>
        {isNavigating && <PublicPageLoading overlay />}
      </div>
      {mobileMenuOpen && (
        <div className={styles.menuLayer}>
          <button type="button" tabIndex={-1} className={styles.backdrop} onClick={() => closeMobileMenu()}
            aria-label={language === "ko" ? "모바일 메뉴 배경을 눌러 닫기" : "Close mobile navigation backdrop"} />
          <div ref={mobileDialogRef} id="mobile-navigation-dialog" role="dialog" aria-modal="true" aria-label={mobileNavigationLabel}
            className={styles.dialog} onKeyDown={handleMobileDialogKeyDown}>
            {/* Mirrors the header so the close control sits exactly where the menu trigger was. */}
            <div className={styles.dialogBar}>
              <span className={styles.brand} aria-hidden="true"><LumoWordmark className={styles.wordmark} title={artistName} /></span>
              <button type="button" className={styles.closeButton} onClick={() => closeMobileMenu()} aria-label={t("nav_close_menu")}>Close</button>
            </div>
            {navigation(mobileNavigationLabel)}
            <ul className={styles.secondaryList}>
              {secondaryItems.map((item) => <li key={item.path}><Link href={item.path} aria-current={isCurrent(item.path) ? "page" : undefined}>{item.label}</Link></li>)}
            </ul>
            <div className={styles.dialogControls}>{languageControls}<Link href="/contact" className={styles.booking}>Booking</Link></div>
          </div>
        </div>
      )}
    </div>
    </PublicMotionInputContext>
    </PublicNavigationContext>
  );
};

export default PublicSiteShell;
