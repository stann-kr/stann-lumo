import { ReactNode } from 'react';

interface ViewportFrameProps {
  children: ReactNode;
  className?: string;
}

export default function ViewportFrame({ children, className = '' }: ViewportFrameProps) {
  return (
    <div className={`hud-bracket pl-3 pr-3 py-2 ${className}`}>
      {children}
    </div>
  );
}
