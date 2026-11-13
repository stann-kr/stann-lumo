import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Links',
  description: 'Social media and platform links for STANN LUMO',
};

export default function LinkLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
