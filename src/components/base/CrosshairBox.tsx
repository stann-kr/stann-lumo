import { ReactNode } from 'react';

interface CrosshairBoxProps {
  children: ReactNode;
  className?: string;
}

export default function CrosshairBox({ children, className = '' }: CrosshairBoxProps) {
  return (
    <div className={`hud-crosshair border border-[var(--color-muted)] p-4 ${className}`}>
      {children}
    </div>
  );
}
