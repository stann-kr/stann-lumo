/**
 * Activate once visible, resuming after a hidden tab or inert navigation layer is released.
 * `activate` may return false to decline for now (a list declines while focus sits after it); it is asked again
 * on the next intersection, visibility or focus change, so nothing waits on a key press.
 */
export function observeInViewport(target: Element, activate: () => boolean | void, rootMargin = '0px'): () => void {
  let intersecting = false;
  let stopped = false;
  let watchingFocus = false;
  let focusTimer: number | undefined;
  const mutations = new MutationObserver(() => attempt());
  const observer = new IntersectionObserver(entries => {
    intersecting = entries.some(entry => entry.isIntersecting);
    attempt();
  }, { rootMargin, threshold: 0 });
  // focusout and focusin run back to back; read where focus settled on the next task.
  const afterFocusMove = () => { window.clearTimeout(focusTimer); focusTimer = window.setTimeout(attempt, 0); };
  const stop = () => {
    stopped = true;
    observer.disconnect();
    mutations.disconnect();
    window.clearTimeout(focusTimer);
    document.removeEventListener('visibilitychange', attempt);
    document.removeEventListener('focusin', afterFocusMove);
    document.removeEventListener('focusout', afterFocusMove);
  };
  function attempt() {
    if (stopped || !intersecting || document.hidden) return;
    const inert = target.closest('[inert]');
    mutations.disconnect();
    if (inert) { mutations.observe(inert, { attributes: true, attributeFilter: ['inert'] }); return; }
    if (activate() !== false) { stop(); return; }
    if (watchingFocus) return;
    watchingFocus = true;
    document.addEventListener('focusin', afterFocusMove);
    document.addEventListener('focusout', afterFocusMove);
  }
  observer.observe(target);
  document.addEventListener('visibilitychange', attempt);
  return stop;
}
