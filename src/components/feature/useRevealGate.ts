'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Longest a page waits for its first-screen media before it is shown anyway. The CSS failsafe in the shell is slightly longer. */
export const REVEAL_GATE_CAP_MS = 2000;
const POLL_MS = 50;
/** LoadingImage frames report their own state; list skeletons mark themselves with data-pending. */
const PENDING_SELECTOR = '[data-load-state="loading"], [data-pending]';
/** The route loading fallback streamed ahead of a slow page; the real first screen has not arrived yet. */
const ROUTE_FALLBACK_SELECTOR = '[data-route-loading]';

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
 * Whether the script has taken the reveal over from the CSS failsafe. The failsafe exists for no-JS and stalled
 * scripts; once the page is hydrated the gate's own cap bounds the wait, so the page is not shown at 2.6s with its
 * first-screen images still arriving one by one. If the failsafe already showed the page before hydration, the hold
 * waits for the reveal: hiding the visible page again would make it flicker.
 */
function useScriptHold(rootRef: RefObject<HTMLElement | null>, revealed: boolean): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held) return;
    const content = rootRef.current?.firstElementChild;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the failsafe state is only readable in the browser.
    if (revealed || (content && getComputedStyle(content).opacity === '0')) setHeld(true);
  }, [held, revealed, rootRef]);
  return held;
}

/**
 * Holds a newly rendered page until the media on its first screen has arrived, so the page appears whole
 * instead of as an empty layout that fills in image by image. Returns whether the current path may be shown.
 * The state is keyed by path: a new path is hidden in the same render that commits it.
 */
export function useRevealGate(rootRef: RefObject<HTMLElement | null>, pathname: string): { revealed: boolean; held: boolean } {
  const [revealedPath, setRevealedPath] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let started = performance.now();
    let timer = 0;
    const check = () => {
      // The cap measures the wait for media, so it starts when the streamed page replaces the fallback.
      if (root.querySelector(ROUTE_FALLBACK_SELECTOR)) {
        started = performance.now();
        timer = window.setTimeout(check, POLL_MS);
        return;
      }
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

  const revealed = revealedPath === pathname;
  return { revealed, held: useScriptHold(rootRef, revealed) };
}
