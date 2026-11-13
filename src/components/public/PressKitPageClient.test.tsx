import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PressKitPageClient from './PressKitPageClient';

const mocks = vi.hoisted(() => ({ language: 'en' as 'en' | 'ko', setLanguage: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language, setLanguage: mocks.setLanguage }) }));

describe('PressKitPageClient', () => {
  beforeEach(() => { mocks.language = 'en'; mocks.setLanguage.mockClear(); });

  it('serves the official kit files from same-origin downloads', () => {
    render(<PressKitPageClient />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Stann\s*Lumo$/);
    expect(screen.getByRole('link', { name: 'STANN LUMO' })).toHaveAttribute('href', '/');
    const zip = screen.getByRole('link', { name: /Download all/ });
    expect(zip).toHaveAttribute('href', '/press/download/stann-lumo-press-kit.zip');
    expect(zip).toHaveAttribute('download');
    expect(zip).toHaveTextContent('ZIP 7.0MB');
    const bio = within(screen.getByRole('region', { name: 'Biography' }));
    expect(bio.getByRole('link', { name: /^KO \.txt/ })).toHaveAttribute('href', '/press/download/stann-lumo-bio-ko.txt');
    expect(bio.getByRole('link', { name: /^EN \.txt/ })).toHaveAttribute('href', '/press/download/stann-lumo-bio-en.txt');
    const photos = within(screen.getByRole('region', { name: 'Press photos' }));
    expect(photos.getAllByRole('link').map((link) => [link.getAttribute('href'), link.hasAttribute('download')])).toEqual([
      ['/press/download/stann-lumo-photo-front.jpg', true],
      ['/press/download/stann-lumo-photo.jpg', true],
      ['/press/download/stann-lumo-photo-profile.png', true],
    ]);
    const logo = within(screen.getByRole('region', { name: 'Logo' }));
    expect(logo.getAllByRole('link')).toHaveLength(8);
    expect(logo.getByRole('link', { name: 'Download White SVG' })).toHaveAttribute('href', '/press/download/logo/StannLumo_Logo_White.svg');
    const video = within(screen.getByRole('region', { name: 'Performance video' }));
    const clips = video.getAllByRole('link');
    expect(clips).toHaveLength(12);
    expect(clips.every((link) => link.hasAttribute('download') && link.getAttribute('href')!.startsWith('/press/video/stann-lumo-'))).toBe(true);
    expect(video.getByRole('link', { name: 'Download HÖR, Berlin clip 04 (33.8MB)' })).toHaveAttribute('href', '/press/video/stann-lumo-hor-berlin-4.mp4');
    expect(screen.getAllByRole('link', { name: 'KO PDF' })[0]).toHaveAttribute('href', '/press/download/stann-lumo-press-kit-ko.pdf');
    const contact = within(screen.getByRole('region', { name: 'Booking · Press' }));
    expect(contact.getByRole('link', { name: 'Email booking →' })).toHaveAttribute('href', expect.stringMatching(/^mailto:contact@stann\.kr\?subject=/));
  });

  it('switches bio length, follows the site language and copies with a status message', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mocks.language = 'ko';
    render(<PressKitPageClient />);
    const bio = within(screen.getByRole('region', { name: 'Biography' }));
    expect(bio.getByRole('button', { name: 'Full' })).toHaveAttribute('aria-pressed', 'true');
    expect(bio.getByText(/Tresor와 HÖR/)).toBeVisible();
    await user.click(bio.getByRole('button', { name: 'Short' }));
    expect(bio.queryByText(/Tresor와 HÖR/)).not.toBeInTheDocument();
    await user.click(bio.getByRole('button', { name: '바이오 복사' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^Stann Lumo는 서울 기반의/));
    expect(screen.getByRole('status')).toHaveTextContent('복사했습니다.');
    expect(screen.getAllByText('국내 페스티벌')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '언어를 한국어로 전환' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Switch language to English' }));
    expect(mocks.setLanguage).toHaveBeenCalledWith('en');
  });
});
