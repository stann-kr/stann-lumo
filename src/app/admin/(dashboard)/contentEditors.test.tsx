import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import AdminMusicPage from './music/page';

const mocks = vi.hoisted(() => ({
  tracks: vi.fn(), meta: vi.fn(), cover: vi.fn(), removeCover: vi.fn(), updateContent: vi.fn(), updateTrackMedia: vi.fn(),
}));
const content = {
  tracks: [
    { id: 'first', title: 'First track', type: 'Original', duration: '6:00', year: '2025', platform: 'Bandcamp', link: 'https://example.com/first' },
    { id: 'second', title: 'Second mix', type: 'DJ Mix', duration: '60:00', year: '2026', platform: 'SoundCloud', link: 'https://example.com/mix' },
  ],
  artistInfo: [{ id: 'artist', key: 'Name', value: 'Artist' }],
  aboutSections: [
    { id: 'bio', title: 'Biography', type: 'paragraphs', order: 4, paragraphs: ['First paragraph', 'Second paragraph'] },
    { id: 'statement', title: 'Statement', type: 'philosophy-items', order: 8, items: [{ id: 'quote', quote: 'Quote', description: 'Description' }] },
  ],
  contactInfo: [{ label: 'Email', value: 'hello@example.com', icon: 'ri-mail-line' }],
  eventsInfo: { contactEmail: 'booking@example.com', responseTime: '48 hours', setDurations: ['60 minutes'], technicalRequirements: ['Mixer'] },
  linkPlatforms: [
    { id: 'one', platform: 'Bandcamp', url: 'https://example.com/music', description: 'Releases', icon: 'ri-bandcamp-line' },
    { id: 'two', platform: 'SoundCloud', url: 'https://example.com/mixes', description: 'Mixes', icon: 'ri-soundcloud-line' },
  ],
  terminalInfo: { url: 'https://terminal.example.com', description: 'Terminal', style: { promptText: '$' } },
  pageMeta: {
    music: { title: 'Music', subtitle: 'Tracks' },
    contact: { title: 'Contact', subtitle: 'Get in touch', directTitle: 'Direct', bookingTitle: 'Booking', guestbookTitle: 'Legacy guestbook' },
    link: { title: 'Links', subtitle: 'Elsewhere', terminalTitle: 'Terminal' },
  },
};
const allContent = { en: content, ko: content };
vi.mock('@/contexts/ContentContext', () => ({ useContent: () => ({ allContent, currentEditLanguage: 'en', isLoading: false, updateContent: mocks.updateContent, updateTrackMedia: mocks.updateTrackMedia }) }));
vi.mock('@/capabilities/content/contentAdmin.client', () => ({
  updateTracks: mocks.tracks, updatePageMeta: mocks.meta, uploadTrackCover: mocks.cover, deleteTrackCover: mocks.removeCover,
}));

function DirtyState() { const { isDirty } = useAdminEditGuard(); return <output data-testid="dirty">{String(isDirty)}</output>; }
function Editor({ children }: { children: React.ReactNode }) { return <AdminEditGuardProvider>{children}<DirtyState /></AdminEditGuardProvider>; }
const save = () => fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));

beforeEach(() => {
  vi.clearAllMocks();
  for (const mock of Object.values(mocks)) mock.mockResolvedValue({ success: true });
});

describe('Content editing workflows', () => {
  it('keeps filtered music edits on the source item and saves the complete ordered list', async () => {
    render(<Editor><AdminMusicPage /></Editor>);
    fireEvent.change(screen.getByLabelText('음악 검색'), { target: { value: 'Second' } });
    fireEvent.change(screen.getByLabelText('종류'), { target: { value: 'DJ Mix' } });
    expect(screen.queryByRole('button', { name: 'First track 편집' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second mix 위로 이동' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Second mix 편집' }));
    fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: 'Renamed mix' } });
    expect(screen.getByLabelText('음악 제목')).toHaveValue('Renamed mix');
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [content.tracks[0], { ...content.tracks[1], title: 'Renamed mix' }], content.tracks));
    // Unchanged page settings are not rewritten (they replace every page's text for the language).
    expect(mocks.meta).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
  });

  it('keeps the selected music editor on the same item after reordering', async () => {
    render(<Editor><AdminMusicPage /></Editor>);
    fireEvent.click(screen.getByRole('button', { name: 'Second mix 편집' }));
    fireEvent.click(screen.getByRole('button', { name: 'Second mix 위로 이동' }));
    expect(screen.getByLabelText('음악 제목')).toHaveValue('Second mix');
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [content.tracks[1], content.tracks[0]], content.tracks));
  });

  it('saves the tracklist and recording date with the list and holds cover uploads until the list is saved', async () => {
    mocks.cover.mockResolvedValue({ success: true, data: { coverImageId: 'cover-new', trackId: 'second' } });
    render(<Editor><AdminMusicPage /></Editor>);
    fireEvent.click(screen.getByRole('button', { name: 'Second mix 편집' }));
    const upload = screen.getByLabelText('Second mix 커버 업로드');
    expect(upload).toBeEnabled();
    fireEvent.change(upload, { target: { files: [new File(['x'], 'c.webp', { type: 'image/webp' })] } });
    await waitFor(() => expect(mocks.cover).toHaveBeenCalledWith('second', expect.any(File)));
    await waitFor(() => expect(mocks.updateTrackMedia).toHaveBeenCalledWith([{ id: 'second', coverImageId: 'cover-new' }]));
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');

    fireEvent.change(screen.getByLabelText('트랙리스트 (한 줄에 한 곡)'), { target: { value: 'A — One\nB — Two' } });
    fireEvent.change(screen.getByLabelText('녹음 날짜'), { target: { value: '2026-10-31' } });
    expect(screen.getByLabelText('Second mix 커버 업로드')).toBeDisabled();
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [content.tracks[0], { ...content.tracks[1], tracklist: 'A — One\nB — Two', recordedOn: '2026-10-31' }], content.tracks));
  });
});
