import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import AdminMusicPage from './music/page';
import AdminAboutPage from './about/page';
import AdminContactPage from './contact/page';
import AdminLinkPage from './link/page';

const mocks = vi.hoisted(() => ({
  tracks: vi.fn(), meta: vi.fn(), artist: vi.fn(), sections: vi.fn(), contacts: vi.fn(), events: vi.fn(), links: vi.fn(), terminal: vi.fn(), updateContent: vi.fn(),
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
vi.mock('@/contexts/ContentContext', () => ({ useContent: () => ({ allContent, currentEditLanguage: 'en', isLoading: false, updateContent: mocks.updateContent }) }));
vi.mock('@/capabilities/content/contentAdmin.client', () => ({
  updateTracks: mocks.tracks, updatePageMeta: mocks.meta, updateArtistInfo: mocks.artist,
  updateAboutSections: mocks.sections, updateContactInfo: mocks.contacts, updateLinkPlatforms: mocks.links,
}));
vi.mock('@/capabilities/events/eventsAdmin.client', () => ({ updateEventsInfo: mocks.events }));
vi.mock('@/capabilities/site/siteConfig.client', () => ({ updateTerminalInfo: mocks.terminal }));

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
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [content.tracks[0], { ...content.tracks[1], title: 'Renamed mix' }]));
    expect(mocks.meta).toHaveBeenCalledWith('en', content.pageMeta);
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
  });

  it('keeps the selected music editor on the same item after reordering', async () => {
    render(<Editor><AdminMusicPage /></Editor>);
    fireEvent.click(screen.getByRole('button', { name: 'Second mix 편집' }));
    fireEvent.click(screen.getByRole('button', { name: 'Second mix 위로 이동' }));
    expect(screen.getByLabelText('음악 제목')).toHaveValue('Second mix');
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [content.tracks[1], content.tracks[0]]));
  });

  it('keeps text when changing About format and normalizes the reordered sections', async () => {
    render(<Editor><AdminAboutPage /></Editor>);
    fireEvent.click(screen.getByRole('button', { name: 'Biography 편집' }));
    fireEvent.change(screen.getByLabelText('섹션 형식'), { target: { value: 'philosophy-items' } });
    expect(screen.getByLabelText('설명 1')).toHaveValue('First paragraph');
    expect(screen.getByLabelText('설명 2')).toHaveValue('Second paragraph');
    fireEvent.change(screen.getByLabelText('섹션 형식'), { target: { value: 'paragraphs' } });
    expect(screen.getByLabelText('문단 1')).toHaveValue('First paragraph');
    fireEvent.click(screen.getByRole('button', { name: 'Biography 아래로 이동' }));
    save();
    await waitFor(() => expect(mocks.sections).toHaveBeenCalledWith('en', [
      { ...content.aboutSections[1], order: 0 },
      { ...content.aboutSections[0], order: 1, items: undefined },
    ]));
  });

  it('edits labeled booking rows while preserving hidden contact presentation values', async () => {
    render(<Editor><AdminContactPage /></Editor>);
    fireEvent.change(screen.getByLabelText('연락처 1 내용'), { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '공연 시간 추가' }));
    fireEvent.change(screen.getByLabelText('공연 시간 2'), { target: { value: '90 minutes' } });
    fireEvent.click(screen.getByRole('button', { name: '기술 요구사항 1 삭제' }));
    save();
    await waitFor(() => expect(mocks.contacts).toHaveBeenCalledWith('en', [{ ...content.contactInfo[0], value: 'new@example.com' }]));
    expect(mocks.events).toHaveBeenCalledWith('en', { ...content.eventsInfo, setDurations: ['60 minutes', '90 minutes'], technicalRequirements: [] });
    expect(mocks.meta).toHaveBeenCalledWith('en', content.pageMeta);
  });

  it('locks edits during saving, keeps a failed link draft, and allows retry', async () => {
    let resolveSave!: (result: { success: boolean }) => void;
    mocks.links.mockReturnValueOnce(new Promise((resolve) => { resolveSave = resolve; }));
    render(<Editor><AdminLinkPage /></Editor>);
    fireEvent.click(screen.getByRole('button', { name: 'Bandcamp 편집' }));
    fireEvent.change(screen.getByLabelText('링크 설명'), { target: { value: 'New releases' } });
    save();
    expect(screen.getByLabelText('링크 설명')).toBeDisabled();
    expect(screen.getByRole('button', { name: '링크 추가' })).toBeDisabled();
    await act(async () => resolveSave({ success: false }));
    expect(await screen.findByRole('alert')).toHaveTextContent('링크 목록 저장에 실패');
    expect(mocks.updateContent).not.toHaveBeenCalled();
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    expect(screen.getByLabelText('링크 설명')).toHaveValue('New releases');
    fireEvent.click(screen.getByRole('button', { name: 'Bandcamp 아래로 이동' }));
    expect(screen.getByLabelText('링크 설명')).toHaveValue('New releases');
    save();
    await waitFor(() => expect(mocks.links).toHaveBeenLastCalledWith('en', [content.linkPlatforms[1], { ...content.linkPlatforms[0], description: 'New releases' }]));
    expect(mocks.terminal).toHaveBeenCalledWith(content.terminalInfo);
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
  });
});
