import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PublicSiteShell from '@/components/feature/PublicSiteShell';
import { getPublicShellProjection, getRequestLocale, hasUpcomingDate } from '@/capabilities/content/publicContent.server';

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
    // The menu's NEXT lamp streams in after the shell (not awaited), so the read never holds the page.
    <PublicSiteShell artistName={shell.artistName} nextDate={hasUpcomingDate()}>
      {children}
    </PublicSiteShell>
  );
}
