import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Booking and contact information for STANN LUMO',
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
