import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PressKitPageClient from './PressKitPageClient';

const mocks = vi.hoisted(() => ({ language: 'en' as 'en' | 'ko' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language, setLanguage: vi.fn() }) }));

describe('PressKitPageClient', () => {
  beforeEach(() => { mocks.language = 'en'; });

  it('serves the official kit files from same-origin downloads', () => {
    render(<PressKitPageClient />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Press kit');
    const photos = within(screen.getByRole('region', { name: 'Press photos' }));
    expect(photos.getAllByRole('link').map((link) => [link.getAttribute('href'), link.hasAttribute('download')])).toEqual([
      ['/press/download/stann-lumo-photo-front.jpg', true],
      ['/press/download/stann-lumo-photo.jpg', true],
      ['/press/download/stann-lumo-photo-profile.png', true],
    ]);
    const logo = within(screen.getByRole('region', { name: 'Logo' }));
    expect(logo.getAllByRole('link')).toHaveLength(8);
    expect(logo.getByRole('link', { name: 'Download White SVG' })).toHaveAttribute('href', '/press/download/logo/StannLumo_Logo_White.svg');
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
  });
});
