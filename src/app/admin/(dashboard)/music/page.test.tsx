import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import { ContentProvider, useContent } from '@/capabilities/content/ContentProvider';
import AdminContentGate from '@/components/feature/AdminContentGate';
import type { ContentData, Track } from '@/capabilities/content/content';
import AdminMusicPage from './page';

const mocks = vi.hoisted(() => ({ fetchContent: vi.fn(), tracks: vi.fn(), meta: vi.fn(), cover: vi.fn(), removeCover: vi.fn() }));
vi.mock('@/capabilities/content/content.client', () => ({ fetchContent: mocks.fetchContent }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/capabilities/content/contentAdmin.client', () => ({
  updateTracks: mocks.tracks, updatePageMeta: mocks.meta, uploadTrackCover: mocks.cover, deleteTrackCover: mocks.removeCover,
}));

const track = (id: string, title: string, media: Partial<Track> = {}): Track =>
  ({ id, title, type: 'DJ Mix', duration: '60:00', year: '2026', platform: 'SoundCloud', link: '', ...media });
const bundle = (tracks: Track[]) => ({
  artistInfo: [], aboutSections: [], homeSections: [], performances: [], linkPlatforms: [], contactInfo: [], tracks,
  pageMeta: { home: { navTitle: '' }, music: { title: 'MUSIC', subtitle: '' }, events: { title: '', subtitle: '', upcomingTitle: '', pastTitle: '' },
    contact: { title: '', subtitle: '', guestbookTitle: '', directTitle: '', bookingTitle: '' }, link: { title: '', subtitle: '', terminalTitle: '' } },
  eventsInfo: { setDurations: [], technicalRequirements: [], contactEmail: '', responseTime: '' }, terminalInfo: { url: '', description: '' },
}) as ContentData;

/** Stands in for the admin shell: the guard state and the edit-language switch. */
function Shell() {
  const { isDirty } = useAdminEditGuard();
  const { setCurrentEditLanguage } = useContent();
  return <>
    <output data-testid="dirty">{String(isDirty)}</output>
    <button type="button" onClick={() => setCurrentEditLanguage('ko')}>KO</button>
  </>;
}
const renderAdmin = () => render(<AdminEditGuardProvider><ContentProvider>
  <AdminContentGate><AdminMusicPage /></AdminContentGate><Shell />
</ContentProvider></AdminEditGuardProvider>);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const nextFrame = () => act(async () => { await new Promise((done) => setTimeout(done, 40)); });
const save = () => fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
const uploadCover = (label: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { files: [new File(['x'], 'c.webp', { type: 'image/webp' })] } });

describe('AdminMusicPage shared track media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [mocks.tracks, mocks.meta, mocks.removeCover]) mock.mockResolvedValue({ success: true });
  });

  it('does not send a tracklist saved in one language back from the other language', async () => {
    mocks.fetchContent.mockImplementation(async (lang: 'en' | 'ko') =>
      bundle(lang === 'en' ? [track('a', 'Mix A', { tracklist: 'Old — List' })] : [track('a', '믹스 A', { tracklist: 'Old — List' })]));
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Mix A 편집' }));
    fireEvent.change(screen.getByLabelText('트랙리스트 (한 줄에 한 곡)'), { target: { value: 'New — List' } });
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [expect.objectContaining({ id: 'a', tracklist: 'New — List' })]));
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));

    fireEvent.click(screen.getByRole('button', { name: 'KO' }));
    await nextFrame();
    fireEvent.click(await screen.findByRole('button', { name: '믹스 A 편집' }));
    // The Korean copy shows the tracklist saved in English.
    expect(screen.getByLabelText('트랙리스트 (한 줄에 한 곡)')).toHaveValue('New — List');
    fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: '믹스 A 수정' } });
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledTimes(2));
    const [lang, [koTrack]] = mocks.tracks.mock.calls[1] as ['ko', Track[]];
    expect(lang).toBe('ko');
    expect(koTrack).toMatchObject({ id: 'a', title: '믹스 A 수정' });
    // Untouched shared fields are left out, so the server keeps the stored value.
    expect(koTrack).not.toHaveProperty('tracklist');
    expect(koTrack).not.toHaveProperty('recordedOn');
    // Only the music list changed; the page settings are not rewritten.
    expect(mocks.meta).not.toHaveBeenCalled();
  });

  it('locks editing and saving while a cover upload runs, then shows the cover without losing the list', async () => {
    mocks.fetchContent.mockImplementation(async (lang: 'en' | 'ko') =>
      bundle([track('a', lang === 'en' ? 'Mix A' : '믹스 A'), track('b', lang === 'en' ? 'Mix B' : '믹스 B')]));
    const upload = deferred<{ success: true; data: { coverImageId: string; trackId: string } }>();
    mocks.cover.mockReturnValue(upload.promise);
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Mix A 편집' }));
    uploadCover('Mix A 커버 업로드');
    await waitFor(() => expect(mocks.cover).toHaveBeenCalledWith('a', expect.any(File)));

    expect(screen.getByRole('button', { name: '변경 사항 저장' })).toBeDisabled();
    expect(screen.getByLabelText('음악 제목')).toBeDisabled();
    expect(screen.getByRole('button', { name: '음악 추가' })).toBeDisabled();

    await act(async () => { upload.resolve({ success: true, data: { coverImageId: 'cover-1', trackId: 'a' } }); await upload.promise; });
    await nextFrame();
    expect(screen.getByLabelText('음악 제목')).toBeEnabled();
    expect(screen.getByLabelText('Mix A 커버 교체')).toBeEnabled();
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');

    // The cover is shared, so the Korean copy shows it too, and the next save keeps every title.
    fireEvent.click(screen.getByRole('button', { name: 'Mix B 편집' }));
    fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: 'Mix B renamed' } });
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [
      expect.objectContaining({ id: 'a', title: 'Mix A', coverImageId: 'cover-1' }), expect.objectContaining({ id: 'b', title: 'Mix B renamed' }),
    ]));
    fireEvent.click(screen.getByRole('button', { name: 'KO' }));
    await nextFrame();
    fireEvent.click(await screen.findByRole('button', { name: '믹스 A 편집' }));
    expect(screen.getByLabelText('믹스 A 커버 교체')).toBeInTheDocument();
  });

  it('keeps an editor open when it is opened as soon as the list appears', async () => {
    mocks.fetchContent.mockImplementation(async (lang: 'en' | 'ko') => bundle([track('a', lang === 'en' ? 'Mix A' : '믹스 A')]));
    // Open the editor in the same task the list is committed, before React runs the page's mount effects.
    let opened = false;
    const observer = new MutationObserver(() => {
      const opener = screen.queryByRole('button', { name: 'Mix A 편집' });
      if (!opened && opener) { opened = true; opener.click(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    try {
      renderAdmin();
      await screen.findByRole('button', { name: 'Mix A 편집' });
      await nextFrame();
    } finally {
      observer.disconnect();
    }
    expect(opened).toBe(true);
    expect(screen.getByRole('button', { name: 'Mix A 편집' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves focus to the music list after a confirmed delete removes the opener', async () => {
    mocks.fetchContent.mockImplementation(async () => bundle([track('a', 'Mix A'), track('b', 'Mix B')]));
    renderAdmin();
    const remove = await screen.findByRole('button', { name: 'Mix A 삭제' });
    remove.focus();
    fireEvent.click(remove);
    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.getByRole('region', { name: '음악 목록' })).toHaveFocus());
    expect(screen.queryByRole('button', { name: 'Mix A 편집' })).not.toBeInTheDocument();
  });
});
