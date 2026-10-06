import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import AdminLayout from './AdminLayout';

const mocks = vi.hoisted(() => ({ push: vi.fn(), setLanguage: vi.fn(), logout: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }), usePathname: () => '/admin/events' }));
vi.mock('@/contexts/ContentContext', () => ({ useContent: () => ({ currentEditLanguage: 'ko', setCurrentEditLanguage: mocks.setLanguage }) }));
vi.mock('@/capabilities/auth/auth.client', () => ({ requestLogout: mocks.logout }));

function Editor() {
  const { setDirty } = useAdminEditGuard();
  return <button type="button" onClick={() => setDirty(true)}>내용 수정</button>;
}

describe('AdminLayout navigation', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.logout.mockResolvedValue(undefined); });

  it('keeps dirty edits until navigation or a locale change is explicitly confirmed', async () => {
    const user = userEvent.setup();
    render(<AdminLayout><Editor /></AdminLayout>);
    expect(screen.getByRole('link', { name: '공연' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: '내용 수정' }));
    await user.click(screen.getByRole('link', { name: '아카이브' }));
    expect(mocks.push).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '계속 편집하기' }));
    await waitFor(() => expect(screen.getByRole('link', { name: '아카이브' })).toHaveFocus());
    await user.selectOptions(screen.getByLabelText('편집 언어'), 'en');
    expect(mocks.setLanguage).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '저장하지 않고 이동' }));
    expect(mocks.setLanguage).toHaveBeenCalledWith('en');
    await user.click(screen.getByRole('link', { name: '아카이브' }));
    expect(mocks.push).toHaveBeenCalledWith('/admin/archive');
  });

  it('closes the mobile navigation with Escape and restores its trigger', () => {
    render(<AdminLayout><p>Editor</p></AdminLayout>);
    fireEvent.click(screen.getByRole('button', { name: '메뉴' }));
    const toggle = screen.getByRole('button', { name: '메뉴 닫기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(toggle, { key: 'Escape' });
    expect(screen.getByRole('button', { name: '메뉴' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: '메뉴' })).toHaveFocus();
  });

  it('keeps the editor open when logout fails', async () => {
    mocks.logout.mockRejectedValue(new Error('network'));
    render(<AdminLayout><p>Editor</p></AdminLayout>);
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('로그아웃하지 못했습니다'));
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
