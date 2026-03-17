'use client';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="absolute bottom-0 text-9xl md:text-[12rem] font-black text-[var(--color-secondary)]/5 select-none pointer-events-none z-0">
        404
      </h1>
      <div className="relative z-10">
        <h1 className="text-xl md:text-2xl font-semibold mt-6 text-[var(--color-primary)]">PAGE NOT FOUND</h1>
        <p className="mt-2 text-base text-[var(--color-secondary)]/50 font-mono">{pathname}</p>
        <p className="mt-4 text-lg md:text-xl text-[var(--color-secondary)]/30">The requested path does not exist.</p>
      </div>
    </div>
  );
}
