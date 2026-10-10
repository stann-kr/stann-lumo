import type { Metadata } from 'next';
import ArchivePageClient from '@/components/public/ArchivePageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getArchiveCount } from '@/capabilities/content/publicContent.server';

export const metadata: Metadata = createPublicMetadata({ title: 'Archive', description: 'Photo and video archive of STANN LUMO', path: '/archive' });

export default async function ArchivePage() {
  return <ArchivePageClient total={await getArchiveCount()} />;
}
