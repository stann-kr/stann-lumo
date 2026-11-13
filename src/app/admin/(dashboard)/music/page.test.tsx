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
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledWith('en', [expect.objectContaining({ id: 'a', tracklist: 'New — List' })],
      [expect.objectContaining({ id: 'a', tracklist: 'Old — List' })]));
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
    ], [expect.objectContaining({ id: 'a', title: 'Mix A', coverImageId: 'cover-1' }), expect.objectContaining({ id: 'b', title: 'Mix B' })]));
    fireEvent.click(screen.getByRole('button', { name: 'KO' }));
    await nextFrame();
    fireEvent.click(await screen.findByRole('button', { name: '믹스 A 편집' }));
    expect(screen.getByLabelText('믹스 A 커버 교체')).toBeInTheDocument();
  });

  it('keeps the input when another tab saved the list first, and loads the stored list only on request', async () => {
    let stored = [track('a', 'Mix A')];
    mocks.fetchContent.mockImplementation(async () => bundle(stored));
    mocks.tracks.mockResolvedValue({ success: false, error: { code: 'CONFLICT', message: 'Tracks changed. Refresh and try again.' } });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      renderAdmin();
      fireEvent.click(await screen.findByRole('button', { name: 'Mix A 편집' }));
      fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: 'My draft' } });
      save();
      expect(await screen.findByText(/다른 탭이나 관리자가 음악 목록을 먼저 저장했습니다\. 현재 입력은 유지됩니다/)).toBeInTheDocument();
      expect(mocks.tracks).toHaveBeenCalledWith('en', [expect.objectContaining({ id: 'a', title: 'My draft' })], [expect.objectContaining({ id: 'a', title: 'Mix A' })]);
      expect(screen.getByLabelText('음악 제목')).toHaveValue('My draft');
      expect(screen.getByTestId('dirty')).toHaveTextContent('true');
      expect(screen.getByRole('button', { name: '변경 사항 저장' })).toBeDisabled();

      // The other tab had added a mix: loading the stored list shows it and allows saving again.
      stored = [track('c', 'Mix C'), track('a', 'Mix A')];
      fireEvent.click(screen.getByRole('button', { name: '최신 음악 목록 불러오기 (현재 음악 편집 버림)' }));
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(await screen.findByRole('button', { name: 'Mix C 편집' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /최신 음악 목록 불러오기/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '변경 사항 저장' })).toBeEnabled();
      expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    } finally {
      confirm.mockRestore();
    }
  });

  it('starts a Korean save from the stored list after an English save changed the English rows it falls back to', async () => {
    // Korean has no rows of its own, so the content API serves it the English rows.
    mocks.fetchContent.mockImplementation(async () => bundle([track('a', 'Mix A')]));
    let stored: Track[] = [];
    mocks.tracks.mockImplementationOnce(async (_lang: 'en', items: Track[]) => {
      stored = items;
      return { success: true, data: { tracks: { en: items, ko: items } } };
    });
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: '음악 추가' }));
    fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: 'New Mix' } });
    save();
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    expect(stored.map((item) => item.title)).toEqual(['New Mix', 'Mix A']);

    fireEvent.click(screen.getByRole('button', { name: 'KO' }));
    await nextFrame();
    fireEvent.click(await screen.findByRole('button', { name: 'New Mix 편집' }));
    fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: '새 믹스' } });
    save();
    await waitFor(() => expect(mocks.tracks).toHaveBeenCalledTimes(2));
    expect(mocks.tracks).toHaveBeenLastCalledWith('ko', [expect.objectContaining({ title: '새 믹스' }), expect.objectContaining({ id: 'a' })], stored);
  });

  it('keeps a stored list as the base of the next save when only the page text failed', async () => {
    mocks.fetchContent.mockImplementation(async () => bundle([track('a', 'Mix A')]));
    mocks.meta.mockResolvedValueOnce({ success: false, error: { code: 'HTTP_ERROR', message: 'Request failed with status 500' } });
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Mix A 편집' }));
    fireEvent.change(screen.getByLabelText('음악 제목'), { target: { value: 'Mix A renamed' } });
    fireEvent.change(screen.getByLabelText('페이지 제목'), { target: { value: 'MIXES' } });
    save();
    expect(await screen.findByText('페이지 문구 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.')).toBeInTheDocument();
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');

    save();
    await waitFor(() => expect(mocks.meta).toHaveBeenCalledTimes(2));
    expect(mocks.tracks).toHaveBeenLastCalledWith('en', [expect.objectContaining({ id: 'a', title: 'Mix A renamed' })],
      [expect.objectContaining({ id: 'a', title: 'Mix A renamed' })]);
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
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
