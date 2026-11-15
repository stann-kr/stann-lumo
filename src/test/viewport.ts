import { act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

interface Watch { target?: Element; live: boolean; intersect: () => void }

/** Replaces IntersectionObserver with one the test drives, so a paged list loads only when its end is reached. */
export function stubViewport() {
  const watches: Watch[] = [];
  vi.stubGlobal('IntersectionObserver', class {
    private readonly watch: Watch;
    constructor(callback: IntersectionObserverCallback) {
      this.watch = { live: true, intersect: () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) };
      watches.push(this.watch);
    }
    observe(target: Element) { this.watch.target = target; }
    unobserve() {}
    disconnect() { this.watch.live = false; }
    takeRecords() { return []; }
  });
  return {
    /**
     * Scrolls the pending end of the paged list inside `scope` into view. After a page lands, the list re-arms its end
     * in an effect, so this waits for that watch instead of failing when it is called a tick too early.
     */
    async reachListEnd(scope: Element = document.body) {
      const watch = await waitFor(() => {
        const found = [...watches].reverse().find(entry => entry.live && entry.target?.matches('[data-pending]') && scope.contains(entry.target));
        if (!found) throw new Error('No list end is waiting for the viewport');
        return found;
      });
      act(() => watch.intersect());
    },
  };
}
