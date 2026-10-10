'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { PUBLIC_BATCH_SIZE, type PublicPage } from '@/capabilities/content/publicPagination';
import { observeInViewport } from '@/lib/observeInViewport';
import styles from './InfiniteList.module.css';

interface PagedListProps<T extends { id: string }> {
  total: number;
  label: string;
  className?: string;
  listRef?: RefObject<HTMLUListElement | null>;
  restoreCount?: number;
  onItemsRendered?: () => void;
  restoreFromHash?: boolean;
  loadPage: (offset: number, signal: AbortSignal) => Promise<PublicPage<T>>;
  renderItem: (item: T, index: number, visibleCount: number) => ReactNode;
  skeleton: ReactNode;
}

export default function PagedList<T extends { id: string }>({ total: initialTotal, label, className, listRef: suppliedRef, restoreCount = 0, restoreFromHash = false, onItemsRendered, loadPage, renderItem, skeleton }: PagedListProps<T>) {
  const { t } = useTranslation();
  const id = useId();
  const ownRef = useRef<HTMLUListElement>(null);
  const listRef = suppliedRef ?? ownRef;
  const sentinelRef = useRef<HTMLLIElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const focusIndex = useRef<number | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState<number | null>(initialTotal ? 0 : null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasMore = offset !== null;

  const load = useCallback(async (manual = false) => {
    if (offset === null || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    if (manual) focusIndex.current = items.length;
    setLoading(true);
    setFailed(false);
    try {
      const page = await loadPage(offset, controller.signal);
      if (controller.signal.aborted) return;
      if (page.nextOffset !== null && page.nextOffset <= offset) throw new Error('Invalid next page');
      setItems(previous => {
        const ids = new Set(previous.map(item => item.id));
        return [...previous, ...page.items.filter(item => !ids.has(item.id))];
      });
      setTotal(page.total);
      setOffset(page.nextOffset);
    } catch {
      if (!controller.signal.aborted) { setFailed(true); focusIndex.current = null; }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [offset, items.length, loadPage]);

  useEffect(() => () => { requestRef.current?.abort(); requestRef.current = null; }, []);

  useEffect(() => {
    if (!hasMore || loading || failed) return;
    // A detail return restores its previously visited depth; ordinary visits wait for the viewport.
    if (items.length < Math.min(restoreCount, total) && (!restoreFromHash || window.location.hash.startsWith('#archive-item-'))) { void load(); return; }
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    return observeInViewport(sentinel, () => {
      const active = document.activeElement;
      if (active && (sentinel.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
      void load();
    });
  }, [hasMore, loading, failed, items.length, restoreCount, restoreFromHash, total, load]);

  useLayoutEffect(() => {
    if (loading) return;
    if (focusIndex.current !== null && items.length > focusIndex.current) {
      const item = listRef.current?.children[focusIndex.current] as HTMLElement | undefined;
      focusIndex.current = null;
      const target = item?.querySelector<HTMLElement>('a[href], button, [tabindex="0"]') ?? item;
      target?.focus({ preventScroll: true });
      target?.scrollIntoView?.({ block: 'nearest', behavior: 'instant' });
    }
    onItemsRendered?.();
  }, [items.length, loading, listRef, onItemsRendered]);

  return <>
    <ul ref={listRef} id={id} tabIndex={-1} aria-label={label} aria-busy={loading} className={className}>
      {items.map((item, index) => <li key={item.id} tabIndex={-1}>{renderItem(item, index, items.length)}</li>)}
      {hasMore && Array.from({ length: Math.min(PUBLIC_BATCH_SIZE, Math.max(1, total - items.length)) }, (_, index) => (
        <li key={`pending-${index}`} ref={index === 0 ? sentinelRef : undefined} aria-hidden="true">{skeleton}</li>
      ))}
    </ul>
    {/* A list that fits in one batch needs no visible counter; screen readers still get the status. */}
    <div className={!hasMore && !failed && total <= PUBLIC_BATCH_SIZE ? 'sr-only' : styles.tail}>
      <p role="status" aria-atomic="true" className={styles.count}>
        {t(failed ? 'list_load_error' : loading ? 'list_loading' : hasMore ? 'list_visible_count' : 'list_complete_count', { count: items.length, total })}
      </p>
      {hasMore && <button type="button" aria-controls={id} aria-disabled={loading} className={styles.more} onClick={() => { void load(true); }}>
        {t(failed ? 'list_retry' : 'list_load_more')}
      </button>}
    </div>
  </>;
}
