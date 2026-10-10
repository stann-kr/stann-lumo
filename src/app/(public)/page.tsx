import type { Metadata } from 'next';
import HomePageClient from '@/components/public/HomePageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getHomeProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  const projection = await getHomeProjection(await getRequestLocale());
  return createPublicMetadata({
    title: 'STANN LUMO',
    description: projection.pageMeta.home.navTitle || 'TECHNO / SEOUL — Official website of STANN LUMO',
    path: '/',
  });
}

export default async function HomePage() {
  const projection = await getHomeProjection(await getRequestLocale());

  return (
    <HomePageClient
      previews={projection.previews}
      artistInfo={projection.artistInfo}
      homeMeta={projection.pageMeta.home}
      homeSections={projection.homeSections}
      terminalInfo={projection.terminalInfo}
    />
  );
}
