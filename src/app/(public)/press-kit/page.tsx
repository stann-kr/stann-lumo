import type { Metadata } from 'next';
import PressKitPageClient from '@/components/public/PressKitPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';

export const metadata: Metadata = createPublicMetadata({
  title: 'Press kit',
  description: 'STANN LUMO press kit — biography, stages, press photos, logo and booking contact',
  path: '/press-kit',
});

export default function PressKitPage() {
  return <PressKitPageClient />;
}
