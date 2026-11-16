import { describe, expect, it } from 'vitest';
import type { Performance } from '@/capabilities/events/events';
import { artistJsonLd, eventJsonLd, serializeJsonLd } from '@/capabilities/site/structuredData';

const event: Performance = {
  id: 'ra-1', date: '2026.11.28', venue: 'Faust', location: 'Seoul', title: 'TERMINAL [03]', status: 'Announced',
  raCountryName: 'South Korea', raEventLink: 'https://ra.co/events/1', raHasTickets: true,
};

describe('structured data', () => {
  it('describes the artist with its public profiles', () => {
    expect(artistJsonLd()).toMatchObject({
      '@context': 'https://schema.org', '@type': 'MusicGroup', name: 'STANN LUMO', url: 'https://lumo.stann.kr/',
      image: 'https://lumo.stann.kr/og.jpg',
    });
  });

  it('describes an event with its day, place, poster and ticket link', () => {
    expect(eventJsonLd(event, '/api/media/p?v=2')).toMatchObject({
      '@type': 'MusicEvent', name: 'TERMINAL [03]', url: 'https://lumo.stann.kr/events/ra-1', startDate: '2026-11-28',
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: 'Faust', address: { addressLocality: 'Seoul', addressCountry: 'South Korea' } },
      performer: { '@type': 'MusicGroup', name: 'STANN LUMO' },
      image: 'https://lumo.stann.kr/api/media/p?v=2',
      offers: { url: 'https://ra.co/events/1' },
    });
  });

  it('marks a cancelled event and offers no tickets for it', () => {
    const data = eventJsonLd({ ...event, status: 'Cancelled' });
    expect(data).toMatchObject({ eventStatus: 'https://schema.org/EventCancelled' });
    expect(data).not.toHaveProperty('offers');
    expect(data).not.toHaveProperty('image');
  });

  it('cannot close its script tag from CMS text', () => {
    const json = serializeJsonLd(eventJsonLd({ ...event, title: '</script><script>alert(1)</script>' }));
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>');
  });
});
