import type { Metadata } from 'next';
import HomePageClient from '@/components/public/HomePageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { artistJsonLd, websiteJsonLd } from '@/capabilities/site/structuredData';
import { SITE_DESCRIPTION } from '@/constants/site';
import JsonLd from '@/components/public/JsonLd';
import { getHomeProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  return createPublicMetadata({
    title: 'STANN LUMO',
    description: SITE_DESCRIPTION,
    path: '/',
  });
}

export default async function HomePage() {
  const projection = await getHomeProjection(await getRequestLocale());

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={artistJsonLd()} />
      <HomePageClient previews={projection.previews} artistInfo={projection.artistInfo} />
    </>
  );
}
