import PublicNotFound from '@/components/public/PublicNotFound';
import { getRequestLocale } from '@/capabilities/content/publicContent.server';

/** A missing event or archive item keeps the public shell that its layout already rendered. */
export default async function PublicSectionNotFound() {
  return <PublicNotFound isKorean={(await getRequestLocale()) === 'ko'} />;
}
