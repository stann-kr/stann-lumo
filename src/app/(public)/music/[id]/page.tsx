import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MusicDetailPageClient from '@/components/public/MusicDetailPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getRequestLocale, getTrackDetail } from '@/capabilities/content/publicContent.server';
import { trackCoverUrl } from '@/capabilities/media/trackArt';

interface MusicDetailPageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: MusicDetailPageProps): Promise<Metadata> {
  const detail = await getTrackDetail((await params).id, await getRequestLocale());
  if (!detail) return createPublicMetadata({ title: 'Track not found', description: 'The requested STANN LUMO track is unavailable.', path: '/music' });
  const { track } = detail;
  const cover = trackCoverUrl(track);
  return createPublicMetadata({
    title: track.title,
    description: [track.type, track.platform, track.year].filter(Boolean).join(' · ') || 'Music by STANN LUMO',
    path: `/music/${encodeURIComponent(track.id)}`,
    ...(cover && { image: { url: cover, alt: `${track.title} cover` } }),
  });
}

export default async function MusicDetailPage({ params }: MusicDetailPageProps) {
  const detail = await getTrackDetail((await params).id, await getRequestLocale());
  if (!detail) notFound();
  return <MusicDetailPageClient {...detail} />;
}
