const PageFallback = () => (
  <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
    <span className="text-[var(--color-secondary)]/50 font-mono text-sm tracking-widest animate-pulse">
      LOADING...
    </span>
  </div>
);

export default PageFallback;
