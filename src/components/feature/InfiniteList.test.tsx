import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps, ReactNode } from 'react';
import InfiniteList from './InfiniteList';
import MusicPageClient from '../public/MusicPageClient';
import AboutPageClient from '../public/AboutPageClient';

vi.mock('next/link', () => ({ default: (props: ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('./PageLayout', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));

const tracks = Array.from({ length: 25 }, (_, index) => ({
  id: String(index), title: `Track ${index}`, type: 'Mix', year: '2026', duration: '60:00', platform: 'SoundCloud', link: `https://soundcloud.com/track-${index}`,
}));

function InfiniteMusicFixture() {
  return <><InfiniteList items={tracks} pageSize={10} label="Music" renderItem={(track) => <a href={track.link}>{track.title}</a>} />
    <a href="/contact">music_licensing</a></>;
}

describe('infinite public lists', () => {
  const observers: { intersect: () => void; disconnect: ReturnType<typeof vi.fn> }[] = [];
  beforeEach(() => {
    observers.length = 0;
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.stubGlobal('IntersectionObserver', class {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(callback: IntersectionObserverCallback) {
        observers.push({ disconnect: this.disconnect, intersect: () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) });
      }
    });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('automatically extends a finite list ten at a time, ignores duplicate signals and retains existing rows and focus', () => {
    render(<InfiniteMusicFixture />);
    const links = () => within(screen.getByRole('list', { name: 'Music' })).getAllByRole('link');
    expect(links()).toHaveLength(10);
    const first = links()[0]!;
    first.focus();
    const initial = observers.at(-1)!;
    act(() => { initial.intersect(); initial.intersect(); });
    expect(links()).toHaveLength(20);
    expect(initial.disconnect).toHaveBeenCalled();
    expect(links()[0]).toBe(first);
    expect(first).toHaveFocus();
    act(() => observers.at(-1)!.intersect());
    expect(links()).toHaveLength(25);
    expect(new Set(links().map(link => link.getAttribute('href'))).size).toBe(25);
    expect(screen.getByRole('status')).toHaveTextContent('list_complete_count');
    expect(screen.queryByRole('button', { name: 'list_load_more' })).not.toBeInTheDocument();
  });

  it('supports manual loading without IntersectionObserver and focuses the first new item through the last batch', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<InfiniteMusicFixture />);
    const links = () => within(screen.getByRole('list', { name: 'Music' })).getAllByRole('link');
    fireEvent.click(screen.getByRole('button', { name: 'list_load_more' }));
    expect(links()[10]).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'list_load_more' }));
    expect(links()[20]).toHaveFocus();
    expect(links()).toHaveLength(25);
  });

  it('does not automatically append while controls, footer, hidden tabs or inert content need to stay stable', () => {
    const view = render(<InfiniteMusicFixture />);
    const more = screen.getByRole('button', { name: 'list_load_more' });
    const observer = observers.at(-1)!;
    more.focus();
    act(() => observer.intersect());
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    screen.getByRole('link', { name: 'music_licensing' }).focus();
    act(() => observer.intersect());
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    (document.activeElement as HTMLElement).blur();
    view.container.setAttribute('inert', '');
    act(() => observer.intersect());
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    view.container.removeAttribute('inert');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => observer.intersect());
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    act(() => observer.intersect());
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
  });

  it('disconnects and ignores queued callbacks from the previous list when the collection changes', () => {
    const row = (item: typeof tracks[number]) => <a href={item.link}>{item.title}</a>;
    const view = render(<InfiniteList key="first" items={tracks} pageSize={10} label="Tracks" renderItem={row} />);
    const previous = observers.at(-1)!;
    view.rerender(<InfiniteList key="second" items={tracks} pageSize={10} label="Tracks" renderItem={row} />);
    act(() => previous.intersect());
    expect(previous.disconnect).toHaveBeenCalled();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    view.unmount();
    expect(observers.at(-1)!.disconnect).toHaveBeenCalled();
  });
});

describe('screen-sized public pages', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it.each([[false, 9], [true, 5]] as const)('keeps every recording reachable in compact=%s pages without appending rows', (compact, pageSize) => {
    vi.stubGlobal('matchMedia', () => ({ matches: compact, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const view = render(<MusicPageClient tracks={tracks} musicMeta={{ title: 'Music', subtitle: '' }} />);
    const links = () => within(screen.getByRole('list', { name: 'Music' })).getAllByRole('link');
    expect(links()).toHaveLength(pageSize);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    const seen = links().map(link => link.getAttribute('href'));
    while (!(screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByRole('region', { name: 'Music' })).toHaveFocus();
      expect(links().length).toBeLessThanOrEqual(pageSize);
      seen.push(...links().map(link => link.getAttribute('href')));
    }
    expect(seen).toEqual(tracks.map(track => track.link));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    view.rerender(<MusicPageClient tracks={tracks.slice(0, 3)} musicMeta={{ title: 'Music', subtitle: '' }} />);
    expect(links()).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('preserves biography paragraphs and quotations across readable pages', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<AboutPageClient artistInfo={[]} aboutSections={[
      { id: 'bio', order: 0, title: 'Biography', type: 'philosophy-items', items: [{ id: 'bio-text', quote: 'Redundant biography label', description: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph.' }] },
      { id: 'quote', order: 1, title: 'Approach', type: 'philosophy-items', items: [{ id: 'quote-text', quote: 'A real quotation.', description: 'Its original context.' }] },
    ]} />);
    expect(screen.getByText('First paragraph.')).toBeVisible();
    expect(screen.getByText('Second paragraph.')).toBeVisible();
    expect(screen.queryByText('Third paragraph.')).not.toBeInTheDocument();
    expect(screen.queryByText('Redundant biography label')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Third paragraph.')).toBeVisible();
    expect(screen.getByText('Fourth paragraph.')).toBeVisible();
    expect(screen.getByRole('region', { name: 'about_title' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('A real quotation.')).toBeVisible();
    expect(screen.getByText('Its original context.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
