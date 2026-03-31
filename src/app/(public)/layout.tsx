import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import TerminalLayout from '@/components/feature/TerminalLayout';

export const metadata: Metadata = {
  title: {
    template: '%s | STANN LUMO',
    default: 'STANN LUMO',
  },
  description: 'TECHNO / SEOUL — Official website of STANN LUMO',
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <TerminalLayout>{children}</TerminalLayout>;
}
