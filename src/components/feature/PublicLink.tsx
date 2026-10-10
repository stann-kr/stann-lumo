'use client';

import { createContext, useCallback, useContext, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type NavigationOptions = { replace?: boolean; scroll?: boolean };
type Navigate = (href: string, options?: NavigationOptions) => void;

export const PublicNavigationContext = createContext<Navigate | null>(null);

export function usePublicNavigation() {
  const navigate = useContext(PublicNavigationContext);
  const router = useRouter();
  return useCallback<Navigate>((href, options) => {
    if (navigate) navigate(href, options);
    else if (options?.replace) router.replace(href, { scroll: options.scroll });
    else if (options?.scroll !== undefined) router.push(href, { scroll: options.scroll });
    else router.push(href);
  }, [navigate, router]);
}

export default function PublicLink({ href, onNavigate, replace, scroll, ...props }: ComponentProps<typeof Link>) {
  const navigate = useContext(PublicNavigationContext);
  return <Link {...props} href={href} replace={replace} scroll={scroll} onNavigate={(event) => {
    let cancelled = false;
    onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
    // Next owns modifier keys, downloads, external URLs, and prefetching.
    if (cancelled || !navigate || typeof href !== 'string') return;
    event.preventDefault();
    navigate(href, { replace, scroll });
  }} />;
}
