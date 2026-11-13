import type { Metadata } from 'next';
import ArchivePageClient from '@/components/public/ArchivePageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getArchiveCount, getArchivePage } from '@/capabilities/content/publicContent.server';
import { PUBLIC_BATCH_SIZE } from '@/capabilities/content/publicPagination';
import { archiveBrowseState } from '@/capabilities/media/archiveBrowsing';

export const metadata: Metadata = createPublicMetadata({ title: 'Archive', description: 'Photo and video archive of STANN LUMO', path: '/archive' });

/** Two batches fill the first screen of the desktop grid. */
const FIRST_SCREEN_ITEMS = PUBLIC_BATCH_SIZE * 2;

interface ArchivePageProps { searchParams: Promise<Record<string, string | string[] | undefined>>; }

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const query = await searchParams;
  const { sort, seed } = archiveBrowseState({ get: (name: string) => { const value = query[name]; return (Array.isArray(value) ? value[0] : value) ?? null; } });
  const total = await getArchiveCount();
  const page = total ? await getArchivePage({ sort, seed }, 0, FIRST_SCREEN_ITEMS) : undefined;
  return <ArchivePageClient total={total} initial={page && { sort, seed, page }} />;
}
