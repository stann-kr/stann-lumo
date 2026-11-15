import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps, ReactNode } from 'react';
import { PlayerProvider } from '@/components/feature/player/PlayerContext';
import PlayerDock from '@/components/feature/player/PlayerDock';
import MusicDetailPageClient from './MusicDetailPageClient';

vi.mock('next/link', () => ({ default: (props: ComponentProps<'a'>) => <a {...props} /> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => ({ music_title: 'Music' })[key] ?? key }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/feature/PageLayout', () => ({ default: ({ title, eyebrow, children }: { title: string; eyebrow: ReactNode; children: ReactNode }) => <main id="main-content" tabIndex={-1}>{eyebrow}<h1>{title}</h1>{children}</main> }));

const mix = { id: 'mix', title: 'Faust Live', type: 'DJ Mix', duration: '0:00', year: '2025', platform: 'SoundCloud', link: 'https://soundcloud.com/stannlumo/faust', recordedOn: '2025-01-10', tracklist: 'A - One\nB - Two' };
const release = { id: 'rel', title: 'Pole Position', type: 'Original', duration: '6:12', year: '2019', platform: 'Bandcamp', link: 'https://ameniiarecords.bandcamp.com/album/pole-position' };

describe('MusicDetailPageClient', () => {
  it('lists the facts and tracklist, plays in the site player and keeps the host as an outbound key', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const user = userEvent.setup();
    render(<PlayerProvider><MusicDetailPageClient track={mix} previous={null} next={release} /><PlayerDock /></PlayerProvider>);

    expect(screen.getByRole('heading', { level: 1, name: 'Faust Live' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Music' })).toHaveAttribute('href', '/music');
    const facts = screen.getByRole('complementary', { name: 'Track information' });
    expect(within(facts).getByText('2025.01.10')).toBeInTheDocument();
    expect(within(facts).queryByText('Length')).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Tracklist' })).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /^SoundCloud ↗.*Faust Live/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /Next →.*Pole Position/ })).toHaveAttribute('href', '/music/rel');

    await user.click(screen.getByRole('button', { name: 'Play — Faust Live' }));
    expect(within(screen.getByRole('region', { name: 'Music player' })).getByTitle('Faust Live player')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Playing — Faust Live' })).toHaveAttribute('aria-pressed', 'true');
    vi.unstubAllGlobals();
  });

  it('keeps only the outbound key for a release the player cannot load', () => {
    render(<PlayerProvider><MusicDetailPageClient track={{ ...release, link: 'https://ameniiarecords.bandcamp.com/album/unrecorded' }} previous={mix} next={null} /></PlayerProvider>);
    expect(screen.queryByRole('button', { name: /Play/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Bandcamp ↗/ })).toHaveAttribute('href', 'https://ameniiarecords.bandcamp.com/album/unrecorded');
    expect(screen.getByText('6:12')).toBeInTheDocument();
  });
});
