import type { Metadata } from 'next';
import MusicPageClient from '@/components/public/MusicPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getMusicProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  const projection = await getMusicProjection(await getRequestLocale());
  return createPublicMetadata({
    title: projection.pageMeta.music.title || 'Music',
    description: projection.pageMeta.music.subtitle || 'Tracks and releases by STANN LUMO — Seoul techno',
    path: '/music',
  });
}

export default async function MusicPage() {
  const projection = await getMusicProjection(await getRequestLocale());
  return <MusicPageClient musicMeta={projection.pageMeta.music} tracks={projection.tracks} />;
}
