"use client";
import { useCallback, useEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import Link, { PublicNavigationContext } from './PublicLink';
import PublicPageLoading from './PublicPageLoading';
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../contexts/LanguageContext";
import { SITE_NAME, TERMINAL_URL, HUB_URL } from "../../constants/site";
import SignalNet from "../base/SignalNet";
import styles from "./PublicSiteShell.module.css";
import { useShellMotion } from './useShellMotion';
import { PublicMotionInputContext, type MotionInput } from './publicMotion';
import PublicAmbientBackground from './ambient/PublicAmbientBackground';

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

  const navItems = [
    { label: t("nav_home"), path: "/" },
    { label: t("nav_about"), path: "/about" },
    { label: t("nav_music"), path: "/music" },
    { label: t("nav_events"), path: "/events" },
    { label: t("nav_gallery"), path: "/archive" },
    { label: t("nav_contact"), path: "/contact" },
    { label: t("nav_link"), path: "/link" },
  ];

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
            <Link href={item.path}
              aria-current={(item.path === "/" ? pathname === "/" : pathname === item.path || pathname.startsWith(item.path + "/")) ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
  const languageControls = (
    <div className={styles.languages}>
      <button type="button" onClick={() => setLanguage("en")} aria-label="Switch language to English" aria-pressed={language === "en"}>EN</button>
      <button type="button" onClick={() => setLanguage("ko")} aria-label="언어를 한국어로 전환" aria-pressed={language === "ko"}>KO</button>
    </div>
  );

  return (
    <PublicNavigationContext value={navigate}>
    <PublicMotionInputContext value={motionInputRef}>
    <div ref={shellRef} className={styles.shell}>
      <PublicAmbientBackground paused={mobileMenuOpen} />
      <div inert={mobileMenuOpen || undefined} className={styles.document}>
        <a href="#main-content" className={styles.skipLink}>{skipLinkLabel}</a>
        <header className={styles.header}>
          <Link ref={brandRef} href="/" className={styles.brand}>{artistName}</Link>
          <div className={styles.desktopNav}>{navigation(mainNavigationLabel)}{languageControls}</div>
          <button ref={mobileMenuButtonRef} type="button" className={styles.menuButton}
            onClick={(event) => { motionInputRef.current = event.detail === 0 ? 'keyboard' : 'pointer'; setMobileMenuPath(pathname); }} aria-label={t("nav_open_menu")}
            aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation-dialog">
            {language === "ko" ? "메뉴" : "Menu"}<span aria-hidden="true">+</span>
          </button>
        </header>
        <main ref={mainRef} id="main-content" tabIndex={-1} aria-busy={isNavigating} className={styles.main}>
          <div inert={isNavigating || undefined} className={isNavigating ? styles.pendingContent : undefined}>{children}</div>
        </main>
        <footer inert={isNavigating || undefined} className={`${styles.footer} ${isNavigating ? styles.pendingContent : ''}`}>
          <SignalNet />
          <div className={styles.externalLinks}>
            <a href={HUB_URL} target="_blank" rel="noopener noreferrer">HUB<span className="sr-only">{language === "ko" ? " (새 창)" : " (opens in a new tab)"}</span></a>
            <a href={TERMINAL_URL} target="_blank" rel="noopener noreferrer">TERMINAL<span className="sr-only">{language === "ko" ? " (새 창)" : " (opens in a new tab)"}</span></a>
          </div>
        </footer>
        {isNavigating && <PublicPageLoading overlay />}
      </div>
      {mobileMenuOpen && (
        <div className={styles.menuLayer}>
          <button type="button" tabIndex={-1} className={styles.backdrop} onClick={() => closeMobileMenu()}
            aria-label={language === "ko" ? "모바일 메뉴 배경을 눌러 닫기" : "Close mobile navigation backdrop"} />
          <div ref={mobileDialogRef} id="mobile-navigation-dialog" role="dialog" aria-modal="true" aria-label={mobileNavigationLabel}
            className={styles.dialog} onKeyDown={handleMobileDialogKeyDown}>
            {navigation(mobileNavigationLabel)}
            <div className={styles.dialogControls}>
              <button type="button" onClick={() => closeMobileMenu()}>{t("nav_close_menu")}</button>
              {languageControls}
            </div>
          </div>
        </div>
      )}
    </div>
    </PublicMotionInputContext>
    </PublicNavigationContext>
  );
};

export default PublicSiteShell;
