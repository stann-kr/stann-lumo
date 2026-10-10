import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArchiveDetailPageClient from '@/components/public/ArchiveDetailPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getArchiveDetail, getArchivePhotos } from '@/capabilities/content/publicContent.server';
import { archiveBrowseState, archiveDetailContext } from '@/capabilities/media/archiveBrowsing';
import { getPublicImageUrl, type GalleryPhoto } from '@/capabilities/media/media';

interface ArchiveDetailPageProps { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>; }

function shareImage(photo: GalleryPhoto): { url: string; alt?: string } | undefined {
  const alt = photo.altText || photo.caption || undefined;
  if (photo.mediaType === 'image') return { url: getPublicImageUrl(photo.id), alt };
  if (photo.mediaType === 'video_youtube' && photo.videoThumbnailUrl) return { url: photo.videoThumbnailUrl, alt };
  return undefined;
}

export async function generateMetadata({ params }: ArchiveDetailPageProps): Promise<Metadata> {
  const detail = await getArchiveDetail((await params).id);
  if (!detail) return createPublicMetadata({ title: 'Archive item not found', description: 'The requested STANN LUMO archive item is unavailable.', path: '/archive' });
  const image = shareImage(detail.photo);
  return createPublicMetadata({
    title: detail.photo.caption || detail.photo.altText || 'Archive',
    description: detail.photo.caption || 'Photo and video archive of STANN LUMO',
    path: `/archive/${detail.photo.id}`,
    ...(image && { image }),
  });
}

export default async function ArchiveDetailPage({ params, searchParams }: ArchiveDetailPageProps) {
  const query = await searchParams;
  const browse = archiveBrowseState({ get: (key) => typeof query[key] === 'string' ? query[key] : null });
  const detail = archiveDetailContext(await getArchivePhotos(), (await params).id, browse);
  if (!detail) notFound();
  return <ArchiveDetailPageClient {...detail} />;
}
