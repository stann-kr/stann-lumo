'use client';
import { ReactNode } from 'react';
import TerminalLayout from '@/components/feature/TerminalLayout';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <TerminalLayout>{children}</TerminalLayout>;
}
