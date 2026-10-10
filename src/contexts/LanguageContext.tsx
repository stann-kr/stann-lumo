'use client';
import { createContext, useContext, useCallback, useEffect, useSyncExternalStore, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import i18n from '../i18n';

export type Language = 'en' | 'ko';
const LANGUAGE_COOKIE = 'stann_lumo_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ──────────────────────────────────────────
// 외부 스토어: localStorage 'app_language' 키
// useSyncExternalStore 패턴으로 SSR 안전성 + setState-in-effect 회피
// ──────────────────────────────────────────
function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/**
 * 첫 방문 언어 결정 (STANN OS 공통 규칙, 설계 §6-5).
 * 우선순위: 저장값 > 브라우저 언어(ko 계열만 ko) > en 폴백(lumo 고유 — 국제 청중).
 */
function getSnapshot(): Language {
  const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]+)`));
  if (cookieMatch?.[1] === 'ko' || cookieMatch?.[1] === 'en') return cookieMatch[1];
  // Storage can throw when the visitor blocks site data; the cookie and browser language still decide.
  let saved: string | null = null;
  try { saved = localStorage.getItem('app_language'); } catch { /* fall through */ }
  if (saved === 'ko' || saved === 'en') return saved;
  const nav = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : 'en';
}

export function LanguageProvider({ children, initialLanguage = 'en' }: { children: ReactNode; initialLanguage?: Language }) {
  const router = useRouter();
  const getServerSnapshot = useCallback(() => initialLanguage, [initialLanguage]);
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // i18next를 언어 상태에 동기화 (setState 아님 — 외부 라이브러리 API 호출)
  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    if (!document.cookie.includes(`${LANGUAGE_COOKIE}=${language}`)) {
      document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
      router.refresh();
    }
  }, [language, router]);

  const setLanguage = useCallback((lang: Language) => {
    try { localStorage.setItem('app_language', lang); } catch { /* the cookie below still carries the choice */ }
    document.cookie = `${LANGUAGE_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
    // storage 이벤트는 같은 탭에서 자동 발생하지 않으므로 수동 트리거
    window.dispatchEvent(new StorageEvent('storage', { key: 'app_language', newValue: lang }));
    router.refresh();
  }, [router]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
