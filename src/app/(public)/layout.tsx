import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PublicSiteShell from '@/components/feature/PublicSiteShell';
import { getPublicShellProjection, getRequestLocale } from '@/capabilities/content/publicContent.server';

export const metadata: Metadata = {
  title: {
    template: '%s | STANN LUMO',
    default: 'STANN LUMO',
  },
  description: 'TECHNO / SEOUL — Official website of STANN LUMO',
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  const shell = await getPublicShellProjection(locale);

  return (
    <PublicSiteShell artistName={shell.artistName}>
      {children}
    </PublicSiteShell>
  );
}
