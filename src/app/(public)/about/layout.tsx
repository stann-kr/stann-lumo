import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'About',
  description: 'STANN LUMO — Seoul-based techno artist, DJ & producer',
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
