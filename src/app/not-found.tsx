import PublicSiteShell from '@/components/feature/PublicSiteShell';
import PublicNotFound from '@/components/public/PublicNotFound';
import { getPublicShellProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export const dynamic = 'force-dynamic';

/**
 * Unknown addresses get the full site navigation while still answering with a real 404 status
 * (the public route group streams through its loading boundary, which would turn it into a 200).
 */
export default async function NotFoundPage() {
  const locale = await getRequestLocale();
  const shell = await getPublicShellProjection(locale).catch(() => ({ artistName: undefined }));
  return (
    <PublicSiteShell artistName={shell.artistName}>
      <PublicNotFound isKorean={locale === 'ko'} />
    </PublicSiteShell>
  );
}
