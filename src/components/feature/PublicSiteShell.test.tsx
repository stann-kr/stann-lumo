import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { Suspense, useEffect, useState } from 'react';
import PublicSiteShell from './PublicSiteShell';
import PublicLink from './PublicLink';
import PublicPageLoading from './PublicPageLoading';
import HomePageClient from '../public/HomePageClient';

const mocks = vi.hoisted(() => ({
  language: 'en' as 'en' | 'ko',
  pathname: '/archive',
  setLanguage: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => mocks.router,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, onNavigate, ...props }: React.ComponentProps<'a'> & { onNavigate?: (event: { preventDefault: () => void }) => void; replace?: boolean; scroll?: boolean }) => {
    delete props.replace;
    delete props.scroll;
    return (
    <a href={href} {...props} onClick={(event) => {
      props.onClick?.(event);
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || props.target === '_blank' || props.download || !href?.startsWith('/')) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      onNavigate?.({ preventDefault: () => {} });
    }}>{children}</a>
    );
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      nav_about: 'ABOUT',
      nav_archive: 'ARCHIVE',
      nav_close_menu: 'Close menu',
      nav_contact: 'CONTACT',
      nav_events: 'EVENTS',
      nav_gallery: 'ARCHIVE',
      nav_home: 'HOME',
      nav_link: 'LINK',
      nav_music: 'MUSIC',
      nav_open_menu: 'Open menu',
    })[key] ?? key,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: mocks.language,
    setLanguage: mocks.setLanguage,
  }),
}));


const desktopBreakpointListeners = new Set<(event: MediaQueryListEvent) => void>();
const matchMedia = vi.fn(() => ({
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
    if (type === 'change' && typeof listener === 'function') {
      desktopBreakpointListeners.add(listener as (event: MediaQueryListEvent) => void);
    }
  },
  matches: false,
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
    if (type === 'change' && typeof listener === 'function') {
      desktopBreakpointListeners.delete(listener as (event: MediaQueryListEvent) => void);
    }
  },
}));

function installMotionPreference() {
  let isReduced = false;
  const queries = new Map<string, Set<(event: MediaQueryListEvent) => void>>();
  const matches = (query: string) => query.includes('no-preference') ? !isReduced
    : query.includes('prefers-reduced-motion: reduce') ? isReduced
    : query.includes('min-width') || query.includes('pointer: fine');
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!queries.has(query)) queries.set(query, new Set());
    const listeners = queries.get(query)!;
    return {
      media: query,
      get matches() { return matches(query); },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
      addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    };
  });
  const changePreference = async (value: boolean) => {
    await act(async () => {
      // Native media changes happen in distinct browser tasks; GSAP debounces them.
      await new Promise((resolve) => setTimeout(resolve, 20));
      isReduced = value;
      for (const [query, listeners] of queries) {
        for (const listener of listeners) listener({ matches: matches(query), media: query } as MediaQueryListEvent);
      }
    });
  };
  return changePreference;
}

function renderPendingNavigation() {
  let ready = false;
  let resolve!: () => void;
  const response = new Promise<void>((done) => { resolve = () => { ready = true; done(); }; });
  function Content({ href }: { href: string }) {
    if (href === '/music' && !ready) throw response;
    return <><h1>{href}</h1><PublicLink href="/music">Open music from content</PublicLink></>;
  }
  function NavigationFixture() {
    const [href, setHref] = useState('/archive');
    useEffect(() => { mocks.router.push.mockImplementation(setHref); }, []);
    return <PublicSiteShell><Content href={href} /></PublicSiteShell>;
  }
  return { ...render(<Suspense fallback="Initial loading"><NavigationFixture /></Suspense>), resolve };
}

describe('PublicSiteShell public navigation', () => {
  beforeEach(() => {
    mocks.language = 'en';
    mocks.pathname = '/archive';
    mocks.setLanguage.mockReset();
    mocks.router.push.mockReset();
    mocks.router.replace.mockReset();
    desktopBreakpointListeners.clear();
    matchMedia.mockClear();
    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('scrollTo', vi.fn());
  });

  it('provides a skip link and exposes the current route to assistive technology', () => {
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: 'Archive' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Music' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Booking' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Press kit' })).toHaveAttribute('href', '/press-kit');
  });

  it('leaves the site menu out of the press kit, which brings its own header', () => {
    mocks.pathname = '/press-kit';
    render(<PublicSiteShell><h1>Stann Lumo</h1></PublicSiteShell>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });

  it('traps mobile navigation focus and restores the trigger after closing it', async () => {
    const user = userEvent.setup();
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    await user.click(menuButton);

    const dialog = await screen.findByRole('dialog', { name: 'Mobile navigation' });
    const firstLink = within(dialog).getByRole('link', { name: 'Music' });
    await waitFor(() => expect(firstLink).toHaveFocus());

    const lastControl = within(dialog).getByRole('link', { name: 'Booking' });
    lastControl.focus();
    await user.tab();
    const closeButton = within(dialog).getByRole('button', { name: 'Close menu' });
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(lastControl).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());

    await user.click(menuButton);
    await screen.findByRole('dialog', { name: 'Mobile navigation' });
    await user.click(screen.getByRole('button', { name: 'Close mobile navigation backdrop' }));
    await waitFor(() => expect(menuButton).toHaveFocus());

    await user.click(menuButton);
    await screen.findByRole('dialog', { name: 'Mobile navigation' });
    act(() => {
      for (const listener of desktopBreakpointListeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('link', { name: 'STANN LUMO' })).toHaveFocus());
    screen.getByRole('main').focus();
    act(() => {
      for (const listener of desktopBreakpointListeners) listener({ matches: true } as MediaQueryListEvent);
    });
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('moves focus to main content after a public route transition', async () => {
    const { rerender } = render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    mocks.pathname = '/music';
    rerender(<PublicSiteShell><h1>Music</h1></PublicSiteShell>);

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('keeps an archive return anchor focused without resetting the restored scroll position', async () => {
    const { rerender } = render(<PublicSiteShell><h1>Detail</h1></PublicSiteShell>);
    mocks.pathname = '/archive/first';
    rerender(<PublicSiteShell><h1>Detail</h1></PublicSiteShell>);
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
    window.history.replaceState(null, '', '/archive#archive-item-first');
    mocks.pathname = '/archive';
    rerender(<PublicSiteShell><PublicLink id="archive-item-first" href="/archive/first">Selected image</PublicLink></PublicSiteShell>);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Selected image' })).toHaveFocus());
    expect(window.scrollTo).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
  });

  it('keeps the loading state and inert background after a mobile link closes', async () => {
    const user = userEvent.setup();
    const { container, resolve } = renderPendingNavigation();
    // v5 removes the ambient canvas and SignalNet from the public shell.
    expect(container.querySelector('canvas')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Music' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading page');
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('heading', { name: '/archive' }).closest('[inert]')).not.toBeNull();
    expect(document.documentElement.style.overflow).toBe('hidden');

    await act(async () => { resolve(); });
    expect(await screen.findByRole('heading', { name: '/music' })).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('allows a newer destination to replace a pending content link without a stale loading screen', async () => {
    const user = userEvent.setup();
    const { resolve } = renderPendingNavigation();
    await user.click(screen.getByRole('link', { name: 'Open music from content' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading page');
    await user.click(screen.getByRole('link', { name: 'About' }));
    expect(await screen.findByRole('heading', { name: '/about' })).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await act(async () => { resolve(); });
    expect(screen.getByRole('heading', { name: '/about' })).toBeVisible();
  });

  it('preserves modified, external, and cancelled link navigation and localizes the route fallback', async () => {
    const { rerender } = render(<PublicSiteShell>
      <PublicLink href="/music" onNavigate={(event) => event.preventDefault()}>Cancelled</PublicLink>
      <PublicLink href="https://example.com" target="_blank">External</PublicLink>
    </PublicSiteShell>);
    fireEvent.click(screen.getByRole('link', { name: 'Music' }), { ctrlKey: true });
    fireEvent.click(screen.getByRole('link', { name: 'External' }));
    fireEvent.click(screen.getByRole('link', { name: 'Cancelled' }));
    expect(mocks.router.push).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    mocks.language = 'ko';
    rerender(<PublicSiteShell><PublicPageLoading /></PublicSiteShell>);
    expect(screen.getByRole('status')).toHaveTextContent('페이지 불러오는 중');
  });

  it('keeps background content inert and locks document scrolling only while the mobile dialog is open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);
    const main = screen.getByRole('main');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(main.closest('[inert]')).not.toBeNull();
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'Music' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(main.closest('[inert]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps the home readable when motion is reduced and releases only its own animations on unmount', async () => {
    const changePreference = installMotionPreference();
    gsap.registerPlugin(ScrollTrigger);
    const { unmount } = render(<PublicSiteShell><HomePageClient artistInfo={[]} previews={previews()} /></PublicSiteShell>);
    const unrelated = ScrollTrigger.create({ trigger: document.body });
    try {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STANNLUMO');
      fireEvent.keyDown(screen.getByRole('link', { name: 'STANN LUMO' }), { key: 'PageDown' });
      await changePreference(true);
      await waitFor(() => expect(ScrollTrigger.getAll()).toEqual([unrelated]));
      expect(screen.getByRole('link', { name: 'PRESS KIT →' })).toBeVisible();
      expect(gsap.getTweensOf(screen.getByRole('heading', { level: 1 }), true)).toHaveLength(0);
      await changePreference(false);
      unmount();
      expect(ScrollTrigger.getAll()).toEqual([unrelated]);
    } finally {
      unmount();
      unrelated.kill();
    }
  });
});

type Previews = NonNullable<React.ComponentProps<typeof HomePageClient>['previews']>;
const event = (id: string, date: string, extra: Partial<Previews['events'][number]> = {}): Previews['events'][number] => ({
  id, title: `Night ${id}`, date, venue: 'Faust', location: 'Seoul', status: 'Announced', ...extra,
});
const previews = (overrides: Partial<Previews> = {}): Previews => ({
  tracks: [
    { id: 'release', title: 'Frame Dragging', type: 'Release', year: '2024', platform: 'Bandcamp', link: 'https://music.example/frame', duration: '0:00' },
    { id: 'mix', title: 'Tresor Berlin', type: 'DJ Mix', year: '2025', platform: 'SoundCloud', link: 'https://music.example/tresor', duration: '1:58:24' },
  ],
  events: [],
  pastEvents: [],
  photos: [{ id: 'poster', caption: 'Real poster', altText: 'Poster' }],
  platforms: [],
  ...overrides,
});

describe('Home v5', () => {
  beforeEach(() => {
    mocks.language = 'en';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-11T03:00:00Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  it('leads with the artist, the latest mix and booking without inventing missing data', () => {
    render(<HomePageClient artistInfo={[]} previews={previews()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STANNLUMO');
    const mix = screen.getByRole('region', { name: 'Latest mix' });
    expect(within(mix).getByText('Tresor Berlin')).toBeVisible();
    // Type, year and length share one line under the player screen; the host is named beside it.
    expect(within(mix).getByText('DJ Mix · 2025 · 1:58:24')).toBeVisible();
    expect(within(mix).getByRole('link', { name: /Listen on SoundCloud/ })).toHaveAttribute('href', 'https://music.example/tresor');
    // The plate's two keys: the artist's SoundCloud and the full music page.
    expect(within(mix).getByRole('link', { name: /^SoundCloud ↗.*opens in a new tab/ })).toHaveAttribute('href', 'https://soundcloud.com/stannlumo');
    expect(within(mix).getByRole('link', { name: 'All mixes →' })).toHaveAttribute('href', '/music');
    const cards = within(screen.getByRole('list', { name: 'Mixes and releases' })).getAllByRole('link');
    expect(cards.map((card) => card.getAttribute('href'))).toEqual(['https://music.example/frame', 'https://music.example/tresor']);
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
    const booking = screen.getByRole('region', { name: 'Booking' });
    expect(within(booking).getByRole('link', { name: 'PRESS KIT →' })).toHaveAttribute('href', '/press-kit');
    expect(within(booking).getByRole('link', { name: 'Send inquiry →' })).toHaveAttribute('href', '/contact');
    expect(within(booking).getByRole('link', { name: 'contact@stann.kr' })).toHaveAttribute('href', 'mailto:contact@stann.kr');
    expect(screen.getByRole('link', { name: 'Real poster' })).toHaveAttribute('href', '/archive/poster');
    expect(screen.getByRole('img', { name: 'Poster' })).toHaveAttribute('src', '/api/media/poster?v=2&w=640');
  });

  it('signals the next date with a countdown and only offers tickets that exist', () => {
    render(<HomePageClient artistInfo={[]} previews={previews({ events: [
      event('a', '2026-11-17', { time: '23:00', raEventLink: 'https://ra.example/a', raHasTickets: true }),
      event('b', '2026-12-06', { raEventLink: 'https://ra.example/b', raHasTickets: false }),
      event('c', '2026-12-31', { status: 'TBA' }),
    ] })} />);
    expect(screen.getByText(/Next · D-06/)).toBeVisible();
    expect(screen.getByText('2026-11-17 23:00')).toBeVisible();
    const dates = screen.getByRole('region', { name: 'Dates' });
    expect(within(dates).getAllByRole('link', { name: /TICKETS/ })).toHaveLength(1);
    expect(within(dates).getByRole('link', { name: /TICKETS/ })).toHaveAttribute('href', 'https://ra.example/a');
    expect(within(dates).getByRole('link', { name: 'INFO →' })).toHaveAttribute('href', '/events/b');
    expect(within(dates).getByText('TBA')).toBeVisible();
  });

  it('turns an empty schedule into a follow prompt with recent past dates', () => {
    mocks.language = 'ko';
    render(<HomePageClient artistInfo={[]} previews={previews({ pastEvents: [event('old', '2026-09-25', { raEventLink: 'https://ra.example/old', raHasTickets: true })] })} />);
    expect(screen.queryByText(/Next · D-/)).not.toBeInTheDocument();
    expect(screen.getByText('예정된 공연이 없습니다.')).toBeVisible();
    expect(screen.getByRole('link', { name: /다음 일정 소식 받기/ })).toHaveAttribute('href', 'https://www.instagram.com/stannlumo/');
    const dates = screen.getByRole('region', { name: 'Dates' });
    expect(within(dates).queryByRole('link', { name: /TICKETS/ })).not.toBeInTheDocument();
    expect(within(dates).getByRole('link', { name: 'INFO →' })).toHaveAttribute('href', '/events/old');
  });
});
