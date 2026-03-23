import { ReactNode } from 'react';

interface HudMetaProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

export default function HudMeta({ children, className = '', label }: HudMetaProps) {
  return (
    <div className={`font-mono text-[10px] sm:text-xs tracking-[0.15em] text-[var(--color-muted)] uppercase flex items-center gap-2 ${className}`}>
      {label && <span className="opacity-70">[{label}]</span>}
      <span>{children}</span>
    </div>
  );
}
