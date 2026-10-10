'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './InfiniteList.module.css';

interface InfiniteListProps<T extends { id: string }> {
  items: readonly T[];
  pageSize: number;
  initialCount?: number;
  className?: string;
  label: string;
  listRef?: RefObject<HTMLUListElement | null>;
  renderItem: (item: T, index: number, visibleCount: number) => ReactNode;
}

/** Progressively mounts an already loaded public projection, without extra requests. */
export default function InfiniteList<T extends { id: string }>({ items, pageSize, initialCount = pageSize, className, label, listRef: suppliedRef, renderItem }: InfiniteListProps<T>) {
  const { t } = useTranslation();
  const id = useId();
  const ownRef = useRef<HTMLUListElement>(null);
  const listRef = suppliedRef ?? ownRef;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const focusIndex = useRef<number | null>(null);
  const [limit, setLimit] = useState(initialCount);
  const visibleCount = Math.min(limit, items.length);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || typeof IntersectionObserver === 'undefined') return;
    let consumed = false;
    const observer = new IntersectionObserver((entries) => {
      if (consumed || !entries.some((entry) => entry.isIntersecting) || document.hidden || sentinel.closest('[inert]')) return;
      const active = document.activeElement;
      // Do not move a focused load button, a following section, or footer out of reach.
      if (active && (sentinel.contains(active) || (sentinel.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING))) return;
      consumed = true;
      observer.disconnect();
      setLimit(visibleCount + pageSize);
    }, { rootMargin: '240px 0px' });
    observer.observe(sentinel);
    return () => { consumed = true; observer.disconnect(); };
  }, [hasMore, visibleCount, pageSize]);

  useLayoutEffect(() => {
    if (focusIndex.current === null) return;
    const item = listRef.current?.children[focusIndex.current] as HTMLElement | undefined;
    focusIndex.current = null;
    const target = item?.querySelector<HTMLElement>('a[href], button, [tabindex="0"]') ?? item;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({ block: 'nearest', behavior: 'instant' });
  }, [visibleCount, listRef]);

  return <>
    <ul ref={listRef} id={id} tabIndex={-1} aria-label={label} className={className}>
      {items.slice(0, visibleCount).map((item, index) => <li key={item.id} tabIndex={-1}>{renderItem(item, index, visibleCount)}</li>)}
    </ul>
    {items.length > pageSize && <div ref={sentinelRef} className={styles.tail}>
      <p role="status" aria-atomic="true" className={styles.count}>
        {t(hasMore ? 'list_visible_count' : 'list_complete_count', { count: visibleCount, total: items.length })}
      </p>
      {hasMore && <button type="button" aria-controls={id} className={styles.more} onClick={() => {
        focusIndex.current = visibleCount;
        setLimit(visibleCount + pageSize);
      }}>
        {t('list_load_more')}
      </button>}
    </div>}
  </>;
}
