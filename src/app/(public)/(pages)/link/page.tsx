import type { Metadata } from 'next';
import LinkPageClient from '@/components/public/LinkPageClient';
import { createPublicMetadata } from '@/capabilities/site/publicMetadata';
import { getLinkProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export async function generateMetadata(): Promise<Metadata> {
  const projection = await getLinkProjection(await getRequestLocale());
  return createPublicMetadata({
    title: projection.pageMeta.link.title || 'Links',
    description: projection.pageMeta.link.subtitle || 'Social media and platform links for STANN LUMO',
    path: '/link',
  });
}

export default async function LinkPage() {
  const projection = await getLinkProjection(await getRequestLocale());
  return (
    <LinkPageClient
      linkMeta={projection.pageMeta.link}
      linkPlatforms={projection.linkPlatforms}
      terminalInfo={projection.terminalInfo}
    />
  );
}
