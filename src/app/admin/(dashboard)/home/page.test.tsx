import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider } from '@/capabilities/admin/AdminEditGuard';
import AdminHomePage from './page';

const mocks = vi.hoisted(() => ({ terminal: vi.fn(), saveTerminal: vi.fn(), saveArtist: vi.fn(), saveHome: vi.fn(), saveMeta: vi.fn(), updateContent: vi.fn() }));
const content = {
  homeSections: [{ title: 'Music', description: 'Music preview', path: '/music', icon: 'ri-music-line' }],
  terminalInfo: { url: 'https://example.com', description: 'Terminal' },
  pageMeta: { home: { navTitle: 'Index' } },
  artistInfo: [{ id: 'name', key: 'Name', value: 'Original name' }],
};
const allContent = { en: content, ko: content };
const style = { fontSize: 'lg', animationSpeed: 'slow', promptText: '$', showEmbed: true, embedHeight: '500px' };
vi.mock('@/contexts/ContentContext', () => ({ useContent: () => ({ allContent, currentEditLanguage: 'en', isLoading: false, updateContent: mocks.updateContent }) }));
vi.mock('@/capabilities/content/contentAdmin.client', () => ({ updateHomeSections: mocks.saveHome, updatePageMeta: mocks.saveMeta, updateArtistInfo: mocks.saveArtist }));
vi.mock('@/capabilities/terminal/terminalConfig.client', () => ({ fetchTerminalConfig: mocks.terminal, updateTerminalConfig: mocks.saveTerminal }));

describe('Home content editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.terminal.mockResolvedValue({ success: true, data: { customFields: [], style } });
    for (const mock of [mocks.saveTerminal, mocks.saveArtist, mocks.saveHome, mocks.saveMeta]) mock.mockResolvedValue({ success: true });
  });

  it('preserves stored presentation values while saving the current home content', async () => {
    render(<AdminEditGuardProvider><AdminHomePage /></AdminEditGuardProvider>);
    const save = screen.getByRole('button', { name: '변경 사항 저장' });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.change(screen.getByLabelText('아티스트 이름'), { target: { value: 'New name' } });
    fireEvent.click(save);
    await waitFor(() => expect(mocks.saveArtist).toHaveBeenCalledWith('en', [{ id: 'name', key: 'Name', value: 'New name' }]));
    expect(mocks.saveHome).toHaveBeenCalledWith('en', content.homeSections);
    expect(mocks.saveTerminal).toHaveBeenCalledWith(expect.objectContaining({ style }));
  });

  it('does not overwrite existing terminal configuration with defaults after a failed read', async () => {
    mocks.terminal.mockResolvedValue({ success: false });
    render(<AdminEditGuardProvider><AdminHomePage /></AdminEditGuardProvider>);
    await screen.findByText(/Terminal 설정을 불러오지 못했습니다/);
    expect(screen.getByRole('button', { name: '변경 사항 저장' })).toBeDisabled();
    expect(mocks.saveTerminal).not.toHaveBeenCalled();
  });

  it('recovers a failed settings read and saves the loaded values', async () => {
    mocks.terminal.mockResolvedValueOnce({ success: false });
    render(<AdminEditGuardProvider><AdminHomePage /></AdminEditGuardProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Terminal 설정 다시 불러오기' }));
    const save = screen.getByRole('button', { name: '변경 사항 저장' });
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(save);
    await waitFor(() => expect(mocks.saveTerminal).toHaveBeenCalledWith(expect.objectContaining({ style })));
  });

  it('keeps the added home item selected after moving it and preserves other entries', async () => {
    render(<AdminEditGuardProvider><AdminHomePage /></AdminEditGuardProvider>);
    const add = screen.getByRole('button', { name: '항목 추가' });
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    fireEvent.change(screen.getByLabelText('메뉴 제목'), { target: { value: 'Archive' } });
    fireEvent.change(screen.getByLabelText('연결 경로'), { target: { value: '/archive' } });
    fireEvent.click(screen.getByRole('button', { name: 'Archive 위로 이동' }));
    expect(screen.getByLabelText('메뉴 제목')).toHaveValue('Archive');
    fireEvent.change(screen.getByLabelText('메뉴 설명'), { target: { value: 'Archive preview' } });
    fireEvent.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await waitFor(() => expect(mocks.saveHome).toHaveBeenCalledWith('en', [
      { title: 'Archive', path: '/archive', description: 'Archive preview', icon: 'ri-star-line' },
      content.homeSections[0],
    ]));
  });
});
