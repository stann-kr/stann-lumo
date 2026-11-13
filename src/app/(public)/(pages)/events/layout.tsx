import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming and past performances by STANN LUMO',
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
