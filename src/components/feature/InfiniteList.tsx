'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { observeInViewport } from '@/lib/observeInViewport';
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

/** Progressively mounts an already loaded public projection as the list end nears, without extra requests or a key. */
export default function InfiniteList<T extends { id: string }>({ items, pageSize, initialCount = pageSize, className, label, listRef: suppliedRef, renderItem }: InfiniteListProps<T>) {
  const { t } = useTranslation();
  const ownRef = useRef<HTMLUListElement>(null);
  const listRef = suppliedRef ?? ownRef;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(initialCount);
  const visibleCount = Math.min(limit, items.length);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || typeof IntersectionObserver === 'undefined') return;
    return observeInViewport(sentinel, () => {
      const active = document.activeElement;
      // A focused section after the list stays where it is; mounting resumes once focus moves (observeInViewport).
      if (active && (sentinel.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
      setLimit(visibleCount + pageSize);
    }, '240px 0px');
  }, [hasMore, visibleCount, pageSize]);

  return <>
    <ul ref={listRef} tabIndex={-1} aria-label={label} className={className}>
      {items.slice(0, visibleCount).map((item, index) => <li key={item.id} tabIndex={-1}>{renderItem(item, index, visibleCount)}</li>)}
    </ul>
    {items.length > pageSize && <div ref={sentinelRef} className={styles.tail}>
      <p role="status" aria-atomic="true" className={styles.count}>
        {t(hasMore ? 'list_visible_count' : 'list_complete_count', { count: visibleCount, total: items.length })}
      </p>
    </div>}
  </>;
}
