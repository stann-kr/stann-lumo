import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { SITE_URL } from '@/capabilities/site/publicMetadata';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Previews (workers.dev, local servers) must never compete with the public domain in search results.
  if ((await headers()).get('host') !== SITE_URL.host) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: ['/', '/api/media/'], disallow: ['/admin', '/api/'] },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
