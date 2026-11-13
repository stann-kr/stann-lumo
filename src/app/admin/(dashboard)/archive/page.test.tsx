import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import type { Performance } from '@/capabilities/events/events';
import type { GalleryPhoto } from '@/capabilities/media/media';
import AdminGalleryPage from './page';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), update: vi.fn(), upload: vi.fn(), remove: vi.fn(), addYoutube: vi.fn(), left: vi.fn(), performances: vi.fn() }));
vi.mock('@/capabilities/media/mediaAdmin.client', () => ({
  fetchGalleryPhotos: mocks.fetch, updateGalleryPhotos: mocks.update, uploadGalleryFiles: mocks.upload,
  deleteGalleryPhoto: mocks.remove, addYouTubeGalleryVideo: mocks.addYoutube,
}));
vi.mock('@/capabilities/events/eventsAdmin.client', () => ({ fetchPerformances: mocks.performances }));
const keptEvent: Performance = { id: 'kept', date: '2021-04-10', venue: 'Venue', title: 'Kept', status: 'Announced' };

const photo = (id: string): GalleryPhoto => ({ id, filename: `${id}.jpg`, caption: id, altText: '', mimeType: 'image/jpeg', sizeBytes: 100,
  sortOrder: 0, createdAt: '', mediaType: 'image', focalX: 50, focalY: 50 });
function GuardState() {
  const { isDirty, requestExit } = useAdminEditGuard();
  return <>
    <output data-testid="dirty">{String(isDirty)}</output>
    {/* A language switch keeps this page mounted; a sidebar link leaves it. */}
    <button type="button" onClick={() => requestExit(() => {})}>SWITCH LANGUAGE</button>
    <button type="button" onClick={() => requestExit(mocks.left)}>LEAVE PAGE</button>
  </>;
}
const renderPage = () => render(<AdminEditGuardProvider><AdminGalleryPage /><GuardState /></AdminEditGuardProvider>);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('Archive editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetch.mockResolvedValue({ success: true, data: [photo('first'), photo('target')] });
    mocks.update.mockResolvedValue({ success: true });
    mocks.upload.mockResolvedValue({ success: true, data: [photo('uploaded')] });
    mocks.remove.mockResolvedValue({ success: true });
    mocks.performances.mockResolvedValue({ success: true, data: [] });
  });

  it('preserves the complete collection when editing a filtered item and locks immediate changes until save', async () => {
    const pending = deferred<{ success: true }>();
    mocks.update.mockReturnValue(pending.promise);
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.change(screen.getByLabelText('미디어 검색'), { target: { value: 'target' } });
    fireEvent.click(screen.getByRole('button', { name: '편집 target.jpg' }));
    fireEvent.change(screen.getByLabelText('캡션'), { target: { value: 'New caption' } });
    expect(screen.getByLabelText('캡션')).toHaveValue('New caption');
    expect(screen.getByRole('button', { name: '파일 업로드' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '미디어 target.jpg 삭제' })).toBeDisabled();
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith([photo('first'), { ...photo('target'), caption: 'New caption' }]));
    expect(screen.getByLabelText('캡션')).toBeDisabled();
    await act(async () => { pending.resolve({ success: true }); await pending.promise; });
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    expect(screen.getByRole('button', { name: '파일 업로드' })).toBeEnabled();
  });

  it('appends a successful upload and prevents metadata edits while it is in flight', async () => {
    const pending = deferred<{ success: true; data: GalleryPhoto[] }>();
    mocks.upload.mockReturnValue(pending.promise);
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '편집 first.jpg' }));
    const file = new File(['bytes'], 'uploaded.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('미디어 파일 선택'), { target: { files: [file] } });
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText('캡션')).toBeDisabled();
    await act(async () => { pending.resolve({ success: true, data: [photo('uploaded')] }); await pending.promise; });
    await screen.findByText('3개 표시 / 전체 3개');
    expect(screen.getByRole('button', { name: '편집 uploaded.jpg' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('shows a recoverable loading failure and never offers to save an empty failed snapshot', async () => {
    mocks.fetch.mockResolvedValueOnce({ success: false });
    renderPage();
    await screen.findByText(/미디어 목록을 불러오지 못했습니다/);
    expect(screen.getByRole('button', { name: '변경 사항 저장' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '파일 업로드' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    await screen.findByText('2개 표시 / 전체 2개');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('keeps an unsuccessful save dirty and adjusts image focus with a keyboard', async () => {
    mocks.update.mockResolvedValue({ success: false });
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '편집 first.jpg' }));
    fireEvent.keyDown(screen.getByRole('button', { name: /이미지 초점 50%, 50%/ }), { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: /이미지 초점 55%, 50%/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await screen.findByText(/저장에 실패했습니다/);
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    expect(mocks.update).toHaveBeenCalledWith([{ ...photo('first'), focalX: 55 }, photo('target')]);
  });

  it('protects an unsubmitted YouTube draft from navigation and clears it only after adding', async () => {
    mocks.addYoutube.mockResolvedValue({ success: true, data: { ...photo('youtube'), mediaType: 'video_youtube' } });
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByText('YouTube 영상 추가'));
    fireEvent.change(screen.getByLabelText('YouTube URL'), { target: { value: 'https://youtu.be/abcdefghijk' } });
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: '영상 추가' }));
    await screen.findByText('3개 표시 / 전체 3개');
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
  });

  it('really discards the draft when the user leaves without saving but the page stays open', async () => {
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '편집 target.jpg' }));
    fireEvent.change(screen.getByLabelText('캡션'), { target: { value: 'Draft 1' } });
    fireEvent.click(screen.getByRole('button', { name: 'SWITCH LANGUAGE' }));
    fireEvent.click(screen.getByRole('button', { name: '저장하지 않고 이동' }));
    await waitFor(() => expect(screen.getByLabelText('캡션')).toHaveValue('target'));
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');

    // A new edit is guarded again.
    fireEvent.change(screen.getByLabelText('캡션'), { target: { value: 'Draft 2' } });
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('true'));
    fireEvent.click(screen.getByRole('button', { name: 'LEAVE PAGE' }));
    expect(mocks.left).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '저장하지 않은 변경 사항' })).toBeInTheDocument();
  });

  it('shows an added YouTube video first, where the server stores it, and saves that order', async () => {
    mocks.addYoutube.mockResolvedValue({ success: true, data: { ...photo('youtube'), filename: 'youtube_abcdefghijk', caption: '', mediaType: 'video_youtube' } });
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByText('YouTube 영상 추가'));
    fireEvent.change(screen.getByLabelText('YouTube URL'), { target: { value: 'https://youtu.be/abcdefghijk' } });
    fireEvent.click(screen.getByRole('button', { name: '영상 추가' }));
    await screen.findByText('3개 표시 / 전체 3개');
    expect(screen.getAllByRole('button', { name: /^편집 / }).map((button) => button.getAttribute('aria-label')))
      .toEqual(['편집 youtube_abcdefghijk', '편집 first.jpg', '편집 target.jpg']);
    fireEvent.click(screen.getByRole('button', { name: '편집 first.jpg' }));
    fireEvent.change(screen.getByLabelText('캡션'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].map((item: GalleryPhoto) => item.id)).toEqual(['youtube', 'first', 'target']);
  });

  it('returns focus to the delete button on cancel and to the media list once the item is deleted', async () => {
    const pending = deferred<{ success: true }>();
    mocks.remove.mockReturnValue(pending.promise);
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '편집 target.jpg' }));
    const remove = screen.getByRole('button', { name: '미디어 target.jpg 삭제' });
    remove.focus();
    fireEvent.click(remove);
    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(remove).toHaveFocus());

    fireEvent.click(remove);
    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    // The dialog waits for the server, then focus lands on the list instead of the removed item.
    expect(screen.getByRole('dialog', { name: '항목 삭제' })).toBeInTheDocument();
    await act(async () => { pending.resolve({ success: true }); await pending.promise; });
    await screen.findByText('1개 표시 / 전체 1개');
    await waitFor(() => expect(screen.getByRole('region', { name: '미디어 목록' })).toHaveFocus());
  });

  it('lists an item without a link as unlinked and saves a caption edit without sending any link', async () => {
    // The server lists an item whose event was deleted without a link; sending none keeps its stored link.
    mocks.performances.mockResolvedValue({ success: true, data: [keptEvent] });
    mocks.fetch.mockResolvedValue({ success: true, data: [{ ...photo('first'), linkedEventId: 'kept' }, photo('target')] });
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '공연 미연결' }));
    await screen.findByText('1개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '편집 target.jpg' }));
    expect(screen.getByLabelText('연결된 공연')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('캡션'), { target: { value: 'New caption' } });
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    expect(mocks.update).toHaveBeenCalledWith([photo('first'), { ...photo('target'), caption: 'New caption' }]);
  });

  it('sends a link the admin chose and an empty link for one the admin removed', async () => {
    mocks.performances.mockResolvedValue({ success: true, data: [keptEvent] });
    mocks.fetch.mockResolvedValue({ success: true, data: [{ ...photo('first'), linkedEventId: 'kept' }, photo('target')] });
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    fireEvent.click(screen.getByRole('button', { name: '편집 first.jpg' }));
    fireEvent.change(screen.getByLabelText('연결된 공연'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '편집 target.jpg' }));
    fireEvent.change(screen.getByLabelText('연결된 공연'), { target: { value: 'kept' } });
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    expect(mocks.update).toHaveBeenCalledWith([{ ...photo('first'), linkedEventId: '' }, { ...photo('target'), linkedEventId: 'kept' }]);
    // Once saved, those links are unchanged, so the next save sends none.
    await waitFor(() => expect(screen.getByTestId('dirty')).toHaveTextContent('false'));
    fireEvent.change(screen.getByLabelText('캡션'), { target: { value: 'Again' } });
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    expect(mocks.update).toHaveBeenLastCalledWith([photo('first'), { ...photo('target'), caption: 'Again' }]);
  });

  it('keeps the hidden file input out of the tab order behind the visible upload controls', async () => {
    renderPage();
    await screen.findByText('2개 표시 / 전체 2개');
    expect(screen.getByLabelText('미디어 파일 선택')).toHaveAttribute('tabindex', '-1');
  });
});
