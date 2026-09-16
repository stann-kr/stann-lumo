'use client';

import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ScreenPages.module.css';

const compactQuery = '(max-width: 699px), (max-height: 699px)';
function subscribe(listener: () => void) {
  const media = window.matchMedia?.(compactQuery);
  media?.addEventListener('change', listener);
  return () => media?.removeEventListener('change', listener);
}
const compactSnapshot = () => window.matchMedia?.(compactQuery).matches ?? true;
const serverSnapshot = () => true;

interface ScreenPagesProps<T> {
  items: readonly T[];
  pageSize: number;
  compactPageSize: number;
  label: string;
  renderPage: (items: readonly T[], offset: number) => ReactNode;
}

/** Explicit pages keep a finite collection readable without growing the document. */
export default function ScreenPages<T>({ items, pageSize, compactPageSize, label, renderPage }: ScreenPagesProps<T>) {
  const compact = useSyncExternalStore(subscribe, compactSnapshot, serverSnapshot);
  const { language } = useLanguage();
  const [start, setStart] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const focusPage = useRef(false);
  const contentId = useId();
  const size = compact ? compactPageSize : pageSize;
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.floor(start / size), pageCount - 1);
  const offset = page * size;

  useLayoutEffect(() => {
    if (!focusPage.current) return;
    focusPage.current = false;
    contentRef.current?.focus({ preventScroll: true });
  }, [start]);

  function changePage(next: number) {
    focusPage.current = true;
    setStart(next * size);
  }

  return <div className={styles.pages}>
    <div id={contentId} ref={contentRef} className={styles.content} role="region" aria-label={label} tabIndex={-1}>
      {renderPage(items.slice(offset, offset + size), offset)}
    </div>
    {pageCount > 1 && <nav className={styles.controls} aria-label={language === 'ko' ? `${label} 페이지` : `${label} pages`}>
      <button type="button" aria-controls={contentId} disabled={page === 0} onClick={() => changePage(page - 1)}>{language === 'ko' ? '이전' : 'Previous'}</button>
      <span role="status" aria-live="polite" aria-atomic="true">{page + 1} / {pageCount}</span>
      <button type="button" aria-controls={contentId} disabled={page === pageCount - 1} onClick={() => changePage(page + 1)}>{language === 'ko' ? '다음' : 'Next'}</button>
    </nav>}
  </div>;
}
