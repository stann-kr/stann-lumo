import { act, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps, ReactNode } from 'react';
import InfiniteList from './InfiniteList';
import MusicPageClient from '../public/MusicPageClient';

vi.mock('next/link', () => ({ default: (props: ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('./PageLayout', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));

const tracks = Array.from({ length: 25 }, (_, index) => ({
  id: String(index), title: `Track ${index}`, type: 'Mix', year: '2026', duration: '60:00', platform: 'SoundCloud', link: `https://soundcloud.com/track-${index}`,
}));

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

  it('automatically extends Music ten at a time, ignores duplicate signals and retains existing rows and focus', () => {
    render(<MusicPageClient tracks={tracks} musicMeta={{ title: 'Music', subtitle: '' }} />);
    const links = () => within(screen.getByRole('list', { name: 'Mixes' })).getAllByRole('link');
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
    expect(screen.queryByRole('button', { name: /^list_/ })).not.toBeInTheDocument();
  });

  it('holds while a control after the list has focus and resumes once focus returns to the list, with no key', async () => {
    render(<MusicPageClient tracks={tracks} musicMeta={{ title: 'Music', subtitle: '' }} />);
    const links = () => within(screen.getByRole('list', { name: 'Mixes' })).getAllByRole('link');
    screen.getByRole('link', { name: 'music_licensing' }).focus();
    act(() => observers.at(-1)!.intersect());
    expect(links()).toHaveLength(10);
    expect(screen.queryByRole('button', { name: /^list_/ })).not.toBeInTheDocument();
    links()[9]!.focus();
    await waitFor(() => expect(links()).toHaveLength(20));
    expect(links()[9]).toHaveFocus();
  });

  it('does not automatically append while a control after the list, a hidden tab or inert content needs to stay stable', () => {
    const view = render(<MusicPageClient tracks={tracks} musicMeta={{ title: 'Music', subtitle: '' }} />);
    const observer = observers.at(-1)!;
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
