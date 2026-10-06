import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider, useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import type { GalleryPhoto } from '@/capabilities/media/media';
import AdminGalleryPage from './page';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), update: vi.fn(), upload: vi.fn(), remove: vi.fn(), addYoutube: vi.fn() }));
vi.mock('@/capabilities/media/mediaAdmin.client', () => ({
  fetchGalleryPhotos: mocks.fetch, updateGalleryPhotos: mocks.update, uploadGalleryFiles: mocks.upload,
  deleteGalleryPhoto: mocks.remove, addYouTubeGalleryVideo: mocks.addYoutube,
}));
vi.mock('@/capabilities/events/eventsAdmin.client', () => ({ fetchPerformances: vi.fn(async () => ({ success: true, data: [] })) }));

const photo = (id: string): GalleryPhoto => ({ id, filename: `${id}.jpg`, caption: id, altText: '', mimeType: 'image/jpeg', sizeBytes: 100,
  sortOrder: 0, createdAt: '', mediaType: 'image', focalX: 50, focalY: 50 });
function GuardState() { const { isDirty } = useAdminEditGuard(); return <output data-testid="dirty">{String(isDirty)}</output>; }
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
});
