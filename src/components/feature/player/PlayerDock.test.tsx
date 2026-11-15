import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { PlayerProvider } from './PlayerContext';
import PlayerDock from './PlayerDock';
import PlayTrackKey from './PlayTrackKey';

vi.mock('next/link', () => ({ default: (props: ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

const tresor = { id: 'tresor', title: 'Tresor', platform: 'SoundCloud', link: 'https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025' };
const hoer = { id: 'hoer', title: 'HÖR', platform: 'YouTube', link: 'https://www.youtube.com/live/cVK15qBeSHU' };
const frame = { id: 'frame', title: 'Frame Dragging', platform: 'Bandcamp', link: 'https://ameniiarecords.bandcamp.com/album/frame-dragging' };

function Page({ name, tracks }: { name: string; tracks: typeof tresor[] }) {
  return <main id="main-content" tabIndex={-1}><h1>{name}</h1>{tracks.map((track) => <PlayTrackKey key={track.id} track={track} />)}</main>;
}

describe('PlayerDock', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  });
  afterEach(() => { vi.unstubAllGlobals(); document.documentElement.style.removeProperty('--player-space'); });

  it('loads nothing until play, then keeps the same player while the page under it changes', async () => {
    const user = userEvent.setup();
    const view = render(<PlayerProvider><Page name="Music" tracks={[tresor, hoer]} /><PlayerDock /></PlayerProvider>);
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Music player' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Play — Tresor/ }));
    const dock = screen.getByRole('region', { name: 'Music player' });
    const iframe = within(dock).getByTitle('Tresor player');
    expect(iframe).toHaveAttribute('src', expect.stringMatching(/^https:\/\/w\.soundcloud\.com\/player\/\?url=/));
    expect(within(dock).getByRole('link', { name: 'Tresor details' })).toHaveAttribute('href', '/music/tresor');
    expect(screen.getByRole('button', { name: /^Playing — Tresor/ })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.style.getPropertyValue('--player-space')).toMatch(/^calc\(/);

    // Another page, and the same track pressed again there: the running player is untouched.
    view.rerender(<PlayerProvider><Page name="Events" tracks={[tresor]} /><PlayerDock /></PlayerProvider>);
    await user.click(screen.getByRole('button', { name: /Tresor/ }));
    expect(screen.getByTitle('Tresor player')).toBe(iframe);
  });

  it('switches tracks, lets only audio hosts collapse and hands focus back to the page on close', async () => {
    const user = userEvent.setup();
    render(<PlayerProvider><Page name="Music" tracks={[tresor, hoer, frame]} /><PlayerDock /></PlayerProvider>);

    await user.click(screen.getByRole('button', { name: /^Play — Frame Dragging/ }));
    const dock = () => screen.getByRole('region', { name: 'Music player' });
    expect(within(dock()).getByTitle('Frame Dragging player')).toHaveAttribute('src', expect.stringContaining('bandcamp.com/EmbeddedPlayer/album=2961344320/'));
    expect(dock()).toHaveAttribute('data-shape', 'strip');
    await user.click(within(dock()).getByRole('button', { name: 'Collapse player' }));
    expect(dock()).toHaveAttribute('data-collapsed', 'true');
    expect(within(dock()).getByRole('button', { name: 'Expand player' })).toHaveAttribute('aria-expanded', 'false');

    // YouTube must stay visible, so its dock opens expanded with no collapse key.
    await user.click(screen.getByRole('button', { name: /^Play — HÖR/ }));
    expect(within(dock()).getByTitle('HÖR player')).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/cVK15qBeSHU'));
    expect(dock()).toHaveAttribute('data-collapsed', 'false');
    expect(within(dock()).queryByRole('button', { name: /Collapse|Expand/ })).not.toBeInTheDocument();
    expect(within(dock()).getByRole('link', { name: /Listen on YouTube/ })).toHaveAttribute('target', '_blank');

    await user.click(within(dock()).getByRole('button', { name: 'Close player' }));
    expect(screen.queryByRole('region', { name: 'Music player' })).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(document.documentElement.style.getPropertyValue('--player-space')).toBe('');
  });

  it('offers no play key for a link without a player or outside the public shell', () => {
    render(<PlayerProvider><Page name="Music" tracks={[{ ...frame, id: 'x', link: 'https://ameniiarecords.bandcamp.com/album/unrecorded' }]} /></PlayerProvider>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    render(<Page name="Admin preview" tracks={[tresor]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
