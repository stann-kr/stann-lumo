import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '콘텐츠 관리 | STANN LUMO',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
