import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { Suspense, useEffect, useState } from 'react';
import PublicSiteShell from './PublicSiteShell';
import PublicLink from './PublicLink';
import PublicPageLoading from './PublicPageLoading';
import { createAmbientRenderer, type AmbientRenderer } from './ambient/ambientRenderer';
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

vi.mock('../base/SignalNet', () => ({ default: () => null }));
vi.mock('./ambient/ambientRenderer', () => ({ createAmbientRenderer: vi.fn(() => null) }));

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
    vi.mocked(createAmbientRenderer).mockReset().mockReturnValue(null);
    desktopBreakpointListeners.clear();
    matchMedia.mockClear();
    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('scrollTo', vi.fn());
  });

  it('provides a skip link and exposes the current route to assistive technology', () => {
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('link', { name: /ARCHIVE$/ })).toHaveAttribute('aria-current', 'page');
  });

  it('traps mobile navigation focus and restores the trigger after closing it', async () => {
    const user = userEvent.setup();
    render(<PublicSiteShell><h1>Archive</h1></PublicSiteShell>);

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    await user.click(menuButton);

    const dialog = await screen.findByRole('dialog', { name: 'Mobile navigation' });
    const firstLink = within(dialog).getByRole('link', { name: /HOME$/ });
    await waitFor(() => expect(firstLink).toHaveFocus());

    const lastControl = within(dialog).getByRole('button', { name: '언어를 한국어로 전환' });
    lastControl.focus();
    await user.tab();
    expect(firstLink).toHaveFocus();

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

  it('keeps the ambient renderer running through loading after a mobile link closes', async () => {
    const user = userEvent.setup();
    const renderer = { resize: vi.fn(), render: vi.fn<AmbientRenderer['render']>(), dispose: vi.fn() };
    vi.mocked(createAmbientRenderer).mockReturnValue(renderer);
    const { container, resolve } = renderPendingNavigation();
    const canvas = container.querySelector('canvas');
    await waitFor(() => expect(renderer.render).toHaveBeenCalled());
    const initialTime = renderer.render.mock.lastCall![0];
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'MUSIC' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading page');
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('heading', { name: '/archive' }).closest('[inert]')).not.toBeNull();
    expect(document.documentElement.style.overflow).toBe('hidden');
    renderer.render.mockClear();
    await waitFor(() => expect(renderer.render.mock.lastCall?.[0]).toBeGreaterThan(initialTime));
    expect(renderer.dispose).not.toHaveBeenCalled();

    await act(async () => { resolve(); });
    expect(await screen.findByRole('heading', { name: '/music' })).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(document.documentElement.style.overflow).toBe('');
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(createAmbientRenderer).toHaveBeenCalledTimes(1);
  });

  it('allows a newer destination to replace a pending content link without a stale loading screen', async () => {
    const user = userEvent.setup();
    const { resolve } = renderPendingNavigation();
    await user.click(screen.getByRole('link', { name: 'Open music from content' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading page');
    await user.click(screen.getByRole('link', { name: 'ABOUT' }));
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
    fireEvent.click(screen.getByRole('link', { name: 'MUSIC' }), { ctrlKey: true });
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
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'HOME' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(main.closest('[inert]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    unmount();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('restores readable content when motion is reduced and releases only its own animations on unmount', async () => {
    const changePreference = installMotionPreference();

    const { container, unmount } = render(<PublicSiteShell>
      <HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={sections} terminalInfo={{ url: '', description: '' }} />
    </PublicSiteShell>);
    const unrelated = ScrollTrigger.create({ trigger: document.body });
    try {
      expect(screen.getByRole('heading', { level: 1, name: 'STANN LUMO' })).toBeInTheDocument();
      expect(ScrollTrigger.getAll()).toEqual([unrelated]);
      const intro = screen.getByText('Explore');
      act(() => { gsap.getTweensOf(intro)[0]?.pause(0); });
      fireEvent.keyDown(screen.getByRole('link', { name: 'STANN LUMO' }), { key: 'PageDown' });
      expect(intro).toBeVisible();
      expect(gsap.getTweensOf(intro, true)).toHaveLength(0);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Archive' }));
      screen.getByRole('link', { name: /Open archive/ }).focus();
      expect(screen.getByRole('link', { name: /Open archive/ })).toBeVisible();

      await changePreference(true);
      await waitFor(() => expect(ScrollTrigger.getAll()).toEqual([unrelated]));
      expect(screen.getByRole('link', { name: /Open archive/ })).toBeVisible();
      const headingLines = container.querySelectorAll<HTMLElement>('[data-heading-line]');
      expect(headingLines).toHaveLength(1);
      for (const line of headingLines) {
        expect(line.style.transform).toBe('');
      }

      await changePreference(false);
      await waitFor(() => expect(ScrollTrigger.getAll()).toEqual([unrelated]));
      unmount();
      expect(ScrollTrigger.getAll()).toEqual([unrelated]);
    } finally {
      unmount();
      unrelated.kill();
    }
  });
});

const sections = ['About', 'Music', 'Events', 'Archive', 'Contact', 'Link'].map((title) => ({
  title, description: `${title} description`, path: `/${title.toLowerCase()}`, icon: '',
}));

describe('Home panels', () => {
  it('keeps CMS order and separates keyboard expansion from route links', async () => {
    const user = userEvent.setup();
    render(<HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={sections} previews={{ tracks: [{ id: 'track', title: 'Real track', type: 'Original', year: '2026', platform: 'Bandcamp', link: 'https://music.example/track' }], events: [], photos: [{ id: 'poster', caption: 'Real poster', altText: 'Poster' }] }} terminalInfo={{ url: '', description: '' }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STANN LUMO');
    expect(screen.getAllByRole('button').map((button) => button.textContent?.replace(/[+−]/g, ''))).toEqual(['About', 'Music', 'Events', 'Archive']);
    expect(screen.getByRole('link', { name: /All recordings/ })).toHaveAttribute('href', '/music');
    expect(screen.getByText('Real track')).toBeVisible();
    expect(screen.getByRole('link', { name: /music_listen_on/ })).toHaveAttribute('href', 'https://music.example/track');
    expect(screen.queryByRole('link', { name: /Open archive/ })).not.toBeInTheDocument();
    const archive = screen.getByRole('button', { name: 'Archive' });
    archive.focus();
    await user.keyboard('{Enter}');
    expect(archive).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Open archive/ })).toHaveAttribute('href', '/archive');
    expect(screen.getByRole('link', { name: 'Real poster' })).toHaveAttribute('href', '/archive/poster');
    expect(screen.getByRole('img', { name: 'Poster' })).toHaveAttribute('src', '/api/media/poster?v=2');
    expect(screen.queryByRole('link', { name: /All recordings/ })).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(archive).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Open archive/ })).not.toBeInTheDocument();
    for (const title of ['Contact', 'Link']) expect(screen.getByRole('link', { name: new RegExp(title === 'Link' ? '^Link$' : `${title} ${title} description`) })).toHaveAttribute('href', `/${title.toLowerCase()}`);
  });

  it('animates pointer category changes, accepts the latest choice and finishes before keyboard navigation', async () => {
    installMotionPreference();
    const { container } = render(<PublicSiteShell>
      <HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={sections} terminalInfo={{ url: '', description: '' }} />
    </PublicSiteShell>);
    await waitFor(() => expect(container.querySelector('[data-motion]')).toHaveAttribute('data-motion', 'on'));

    fireEvent.click(screen.getByRole('button', { name: 'About' }), { detail: 1 });
    const about = screen.getByRole('link', { name: 'Read biography' });
    const entry = gsap.getTweensOf(about)[0];
    expect(entry).toBeDefined();
    expect(Number(gsap.getProperty(about, 'opacity'))).toBeLessThan(1);
    act(() => { entry.parent?.progress(0.4); });

    fireEvent.click(screen.getByRole('button', { name: 'Music' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }), { detail: 1 });
    expect(screen.getByRole('button', { name: 'Archive' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('link', { name: /All recordings/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Read biography/ })).not.toBeInTheDocument();
    expect(entry.isActive()).toBe(false);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Archive' }), { key: 'Tab' });
    expect(screen.getByRole('link', { name: 'Open archive' })).toBeVisible();
    expect(gsap.getTweensOf(screen.getByRole('link', { name: 'Open archive' }), true)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'About' }), { detail: 0 });
    expect(about).toBeVisible();
    expect(gsap.getTweensOf(about, true)).toHaveLength(0);
    expect(screen.getByRole('link', { name: /Read biography/ })).toBeVisible();
    for (const panel of container.querySelectorAll<HTMLElement>('[data-expanded]')) {
      expect(panel.style.width).toBe('');
      expect(panel.style.height).toBe('');
      expect(panel.style.flex).toBe('');
      expect(panel.querySelector<HTMLElement>('[data-panel-edge]')?.style.transform).toBe('');
      expect(panel.querySelector<HTMLElement>('[data-panel-heading]')?.style.width).toBe('');
    }
    expect(container.querySelector<HTMLElement>('[data-home-panels]')?.style.height).toBe('');
  });

  it('settles a running category transition when motion is reduced and keeps subsequent choices readable', async () => {
    const changePreference = installMotionPreference();
    const { container } = render(<HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={sections} terminalInfo={{ url: '', description: '' }} />);
    await waitFor(() => expect(container.querySelector('[data-motion]')).toHaveAttribute('data-motion', 'on'));
    fireEvent.click(screen.getByRole('button', { name: 'About' }), { detail: 1 });
    expect(gsap.getTweensOf(screen.getByRole('link', { name: 'Read biography' })).length).toBeGreaterThan(0);

    await changePreference(true);
    expect(screen.getByRole('link', { name: 'Read biography' })).toBeVisible();
    expect(gsap.getTweensOf(screen.getByRole('link', { name: 'Read biography' }), true)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Events' }), { detail: 1 });
    expect(screen.getByRole('link', { name: 'All events' })).toBeVisible();
    expect(screen.getByRole('link', { name: /All events/ })).toBeVisible();
    expect(gsap.getTweensOf(screen.getByRole('link', { name: 'All events' }), true)).toHaveLength(0);
  });

  it('preserves actual Terminal fields, URL and optional embed without inventing home items', () => {
    render(<HomePageClient artistInfo={[]} homeMeta={{ navTitle: 'Explore' }} homeSections={[]} terminalInfo={{
      url: 'https://terminal.example', description: 'Live interface',
      customFields: [{ id: 'one', fieldKey: 'Set', fieldValue: 'Live', fieldType: 'badge', sortOrder: 0 }],
      style: { fontSize: 'md', animationSpeed: 'normal', promptText: '>', showEmbed: true, embedHeight: '420px' },
    }} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terminal/ })).toHaveAttribute('href', 'https://terminal.example');
    expect(screen.getByTitle('Terminal')).toHaveAttribute('src', 'https://terminal.example');
    expect(screen.getByTitle('Terminal')).toHaveStyle({ height: '420px' });
  });
});
