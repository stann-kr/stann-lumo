import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EventsPageClient from '@/components/public/EventsPageClient';
import EventDetailPageClient from '@/components/public/EventDetailPageClient';
import type { Performance } from '@/capabilities/events/events';
import { performanceSchedule, performanceToday } from '@/capabilities/events/events';
import type { GalleryPhoto } from '@/capabilities/media/media';

vi.mock('next/link', () => ({ default: ({ ...props }: React.ComponentProps<'a'> & { prefetch?: boolean }) => {
  delete props.prefetch;
  return <a {...props} />;
} }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

const event: Performance = { id: 'event', date: '2999-01-01', title: 'A long event title that remains available in full', venue: 'Venue', status: 'Cancelled', lineup: 'STANN LUMO', raEventLink: 'https://ra.co/events/123' };
const meta = { title: 'Events', subtitle: '', upcomingTitle: 'Upcoming', pastTitle: 'Past' };

function renderEvents(records: Performance[]) {
  const schedule = performanceSchedule(records);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const params = new URL(url, 'http://localhost').searchParams;
    const items = schedule[params.get('section') as 'upcoming' | 'past'];
    const offset = Number(params.get('offset'));
    return Response.json({ success: true, data: { items: items.slice(offset, offset + 4), total: items.length, nextOffset: offset + 4 < items.length ? offset + 4 : null } });
  }));
  return render(<EventsPageClient eventsMeta={meta} schedule={{ today: performanceToday(), upcoming: schedule.upcoming.length, past: schedule.past.length }} />);
}
async function loadRegion(region: HTMLElement, count: number) {
  fireEvent.click(within(region).getByRole('button', { name: 'list_load_more' }));
  await waitFor(() => expect(within(region).getAllByRole('link')).toHaveLength(count));
}

describe('public events', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('uses the Seoul calendar and orders upcoming dates forward and past dates backward', () => {
    expect(performanceToday(new Date('2026-09-08T15:01:00Z'))).toBe('2026-09-09');
    const dates = ['2026.09.25', '2026-09-12', '2026-08-01', '2026-09-08'];
    const records = dates.map((date) => ({ ...event, id: date, date }));
    const { upcoming, past } = performanceSchedule(records, '2026-09-09');
    expect(upcoming.map((item) => item.date)).toEqual(['2026-09-12', '2026.09.25']);
    expect(past.map((item) => item.date)).toEqual(['2026-09-08', '2026-08-01']);
    expect(records.map((item) => item.date)).toEqual(dates);
  });

  it('keeps past cancellations while hiding stale announcements and the RA All area label', async () => {
    renderEvents([
      { ...event, id: 'past', date: '2020-01-01', status: 'Announced', location: 'All', raCountryName: 'South Korea' },
      { ...event, id: 'cancelled', date: '2020-02-01' },
    ]);
    const past = screen.getByRole('region', { name: 'Past 2' });
    await loadRegion(past, 2);
    expect(within(past).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/events/cancelled', '/events/past']);
    expect(within(past).queryByText('Announced')).not.toBeInTheDocument();
    expect(within(past).queryByText('All')).not.toBeInTheDocument();
    expect(within(past).getByText('Cancelled')).toBeVisible();
    expect(within(past).getByText('South Korea')).toBeVisible();
  });
  it('loads sections on demand and appends a bounded batch without moving existing links', async () => {
    const past = Array.from({ length: 11 }, (_, index) => ({ ...event, id: `past-${index}`, title: `Past ${index}`, date: '2020-01-01', status: 'Announced' as const }));
    renderEvents([event, ...past]);
    expect(fetch).not.toHaveBeenCalled();
    const upcoming = screen.getByRole('region', { name: 'Upcoming 1' });
    await loadRegion(upcoming, 1);
    expect(within(upcoming).getByRole('link')).toHaveAttribute('href', '/events/event');
    expect(within(upcoming).getByText(event.title)).toBeVisible();
    expect(within(upcoming).getByText('Cancelled')).toBeVisible();
    expect(within(upcoming).queryByRole('img')).not.toBeInTheDocument();
    const pastRegion = screen.getByRole('region', { name: 'Past 11' });
    expect(within(pastRegion).queryAllByRole('link')).toHaveLength(0);
    await loadRegion(pastRegion, 4);
    const first = within(pastRegion).getAllByRole('link')[0];
    await loadRegion(pastRegion, 8);
    expect(within(pastRegion).getAllByRole('link')[0]).toBe(first);
    await loadRegion(pastRegion, 11);
    expect(within(pastRegion).getAllByRole('link')[8]).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'list_load_more' })).not.toBeInTheDocument();
  });

  it('keeps essential event facts and the real external URL with or without a poster', () => {
    const { rerender } = render(<EventDetailPageClient event={event} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(event.title);
    const facts = screen.getByRole('complementary', { name: 'Event information' });
    expect(within(facts).getByText('Cancelled')).toBeVisible();
    expect(within(facts).getByRole('link')).toHaveAttribute('href', event.raEventLink);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(<EventDetailPageClient event={event} posterPhoto={{ id: 'poster', altText: 'Event poster' } as GalleryPhoto} />);
    expect(screen.getByRole('img', { name: 'Event poster' })).toHaveAttribute('src', '/api/media/poster?v=2');
    expect(screen.getByText('STANN LUMO')).toBeVisible();
  });

  it('extends upcoming and past lists independently', async () => {
    const records = (future: boolean) => Array.from({ length: 11 }, (_, index) => ({ ...event, id: `${future}-${index}`, date: future ? '2999-01-01' : '2020-01-01' }));
    renderEvents([...records(true), ...records(false)]);
    const upcoming = screen.getByRole('region', { name: 'Upcoming 11' });
    const past = screen.getByRole('region', { name: 'Past 11' });
    await loadRegion(upcoming, 4);
    expect(within(past).queryAllByRole('link')).toHaveLength(0);
    await loadRegion(past, 4);
    await loadRegion(upcoming, 8);
    expect(within(past).getAllByRole('link')).toHaveLength(4);
  });
});
