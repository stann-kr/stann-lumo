'use client';
import { createContext, useContext, useCallback, useEffect, useSyncExternalStore, ReactNode } from 'react';
import i18n from '../i18n';

type Language = 'en' | 'ko';

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

function getSnapshot(): Language {
  const saved = localStorage.getItem('app_language');
  return saved === 'ko' || saved === 'en' ? saved : 'en';
}

function getServerSnapshot(): Language {
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // i18next를 언어 상태에 동기화 (setState 아님 — 외부 라이브러리 API 호출)
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('app_language', lang);
    // storage 이벤트는 같은 탭에서 자동 발생하지 않으므로 수동 트리거
    window.dispatchEvent(new StorageEvent('storage', { key: 'app_language', newValue: lang }));
  }, []);

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
