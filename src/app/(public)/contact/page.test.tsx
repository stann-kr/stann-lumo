import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContactPageClient from '@/components/public/ContactPageClient';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('contact addresses', () => {
  it.each(['artist@example.test', 'booking@example.test'])('preserves the booking address %s without duplicating an identical email action', (bookingAddress) => {
    render(<ContactPageClient contactMeta={{ title: 'Contact', subtitle: 'GUESTBOOK & DIRECT CONTACT', guestbookTitle: '', directTitle: '', bookingTitle: '' }}
      contactInfo={[{ label: 'Artist', value: 'artist@example.test', icon: '' }]}
      bookingInfo={{ contactEmail: bookingAddress, responseTime: 'Within a week', setDurations: ['90 minutes'], technicalRequirements: ['Mixer'] }} />);
    const mailLinks = screen.getAllByRole('link');
    expect(mailLinks.map((link) => link.getAttribute('href'))).toEqual(bookingAddress === 'artist@example.test' ? ['mailto:artist@example.test'] : ['mailto:artist@example.test', 'mailto:booking@example.test']);
    expect(screen.getByText('Within a week')).toBeVisible();
    expect(screen.getByText('90 minutes')).toBeVisible();
    expect(screen.queryByText('GUESTBOOK & DIRECT CONTACT')).not.toBeInTheDocument();
    expect(screen.getAllByText('artist@example.test')).toHaveLength(1);
  });
});
