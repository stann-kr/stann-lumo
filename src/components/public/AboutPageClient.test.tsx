import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SITE_ABOUT_SECTIONS, SITE_ARTIST_INFO } from '@/capabilities/content/siteContent';
import AboutPageClient from './AboutPageClient';

describe('AboutPageClient', () => {
  it('reads the biography as separate paragraphs and leads with its quote only once', () => {
    render(<AboutPageClient artistInfo={SITE_ARTIST_INFO} aboutSections={SITE_ABOUT_SECTIONS} />);

    const [{ items }] = SITE_ABOUT_SECTIONS;
    const quote = items![0].quote;
    expect(screen.getAllByText(quote)).toHaveLength(1);

    const biography = screen.getByRole('region', { name: 'BIOGRAPHY' });
    const paragraphs = biography.querySelectorAll('p');
    expect(paragraphs).toHaveLength(4);
    expect(paragraphs[0]).toHaveTextContent(/^Seoul-based DJ Stann Lumo delivers tracks/);
    expect(paragraphs[3]).toHaveTextContent(/Berlin, Glasgow, and Mongolia\.$/);
    expect(within(biography).queryByRole('blockquote')).not.toBeInTheDocument();
  });
});
