import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Music',
  description: 'Tracks and releases by STANN LUMO — Seoul techno',
};

export default function MusicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
