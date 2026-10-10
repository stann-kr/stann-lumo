/** Activate once visible, resuming after a hidden tab or inert navigation layer is released. */
export function observeInViewport(target: Element, activate: () => boolean | void): () => void {
  let intersecting = false;
  let stopped = false;
  const mutations = new MutationObserver(() => attempt());
  const observer = new IntersectionObserver(entries => {
    intersecting = entries.some(entry => entry.isIntersecting);
    attempt();
  }, { rootMargin: '0px', threshold: 0 });
  const stop = () => {
    stopped = true;
    observer.disconnect();
    mutations.disconnect();
    document.removeEventListener('visibilitychange', attempt);
  };
  function attempt() {
    if (stopped || !intersecting || document.hidden) return;
    const inert = target.closest('[inert]');
    mutations.disconnect();
    if (inert) { mutations.observe(inert, { attributes: true, attributeFilter: ['inert'] }); return; }
    if (activate() !== false) stop();
  }
  observer.observe(target);
  document.addEventListener('visibilitychange', attempt);
  return stop;
}
