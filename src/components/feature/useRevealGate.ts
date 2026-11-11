'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Longest a page waits for its first-screen media before it is shown anyway. The CSS failsafe in the shell is slightly longer. */
export const REVEAL_GATE_CAP_MS = 2000;
const POLL_MS = 50;
/** LoadingImage frames report their own state; list skeletons mark themselves with data-pending. */
const PENDING_SELECTOR = '[data-load-state="loading"], [data-pending]';

function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
}

function isFirstScreenSettled(root: HTMLElement): boolean {
  for (const image of root.querySelectorAll('img')) {
    if (image.closest('[data-load-state]')) continue;
    // An unsized image measures 0×0 until it loads; its container says whether it is on screen.
    if (!image.complete && isInViewport(image.parentElement ?? image)) return false;
  }
  for (const element of root.querySelectorAll(PENDING_SELECTOR)) {
    if (isInViewport(element)) return false;
  }
  return true;
}

/**
 * Holds a newly rendered page until the media on its first screen has arrived, so the page appears whole
 * instead of as an empty layout that fills in image by image. Returns whether the current path may be shown.
 * The state is keyed by path: a new path is hidden in the same render that commits it.
 */
export function useRevealGate(rootRef: RefObject<HTMLElement | null>, pathname: string): boolean {
  const [revealedPath, setRevealedPath] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const started = performance.now();
    let timer = 0;
    const check = () => {
      if (isFirstScreenSettled(root) || performance.now() - started >= REVEAL_GATE_CAP_MS) {
        setRevealedPath(pathname);
        return;
      }
      timer = window.setTimeout(check, POLL_MS);
    };
    // One tick lets viewport observers request the visible images before the first check.
    timer = window.setTimeout(check, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, rootRef]);

  return revealedPath === pathname;
}
