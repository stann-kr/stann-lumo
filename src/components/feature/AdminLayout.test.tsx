import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import { ADMIN_UNAUTHORIZED_EVENT } from '@/capabilities/auth/adminSessionEvents';
import AdminLayout from './AdminLayout';

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();
  return { push, replace, router: { push, replace }, pathname: '/admin/events', setLanguage: vi.fn(), logout: vi.fn(), session: vi.fn() };
});
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router, usePathname: () => mocks.pathname }));
vi.mock('@/contexts/ContentContext', () => ({ useContent: () => ({ currentEditLanguage: 'ko', setCurrentEditLanguage: mocks.setLanguage }) }));
vi.mock('@/capabilities/auth/auth.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/capabilities/auth/auth.client')>()),
  requestLogout: mocks.logout,
  getAdminSessionState: mocks.session,
}));

async function announceUnauthorized() {
  await act(async () => { window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT)); });
}

function Editor() {
  const { setDirty } = useAdminEditGuard();
  return <button type="button" onClick={() => setDirty(true)}>내용 수정</button>;
}

describe('AdminLayout navigation', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.pathname = '/admin/events'; mocks.logout.mockResolvedValue(undefined); });

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

  it('opens the matching public page in a new tab without leaving the editor', () => {
    mocks.pathname = '/admin/music';
    render(<AdminLayout><p>Editor</p></AdminLayout>);
    const link = screen.getByRole('link', { name: /^공개 화면/ });
    expect(link).toHaveAttribute('href', '/music');
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('AdminLayout session expiry', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.pathname = '/admin/events'; });

  it('keeps unsaved edits on screen and offers a new-window sign-in until the session is back', async () => {
    const user = userEvent.setup();
    mocks.pathname = '/admin/contact';
    render(<AdminLayout><Editor /></AdminLayout>);
    await user.click(screen.getByRole('button', { name: '내용 수정' }));

    mocks.session.mockResolvedValue('unauthenticated');
    await announceUnauthorized();

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent('로그인이 만료되었습니다');
    expect(screen.getByRole('link', { name: '새 창에서 로그인' })).toHaveAttribute('href', '/admin?next=%2Fadmin%2Fcontact');
    expect(screen.getByRole('button', { name: '내용 수정' })).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();

    mocks.session.mockResolvedValue('authenticated');
    await announceUnauthorized();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('sends a clean editor to sign-in with a way back to the same page', async () => {
    mocks.pathname = '/admin/music';
    mocks.session.mockResolvedValue('unauthenticated');
    render(<AdminLayout><p>Editor</p></AdminLayout>);

    await announceUnauthorized();

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin?next=%2Fadmin%2Fmusic'));
  });

  it('changes nothing when the session check gets no answer', async () => {
    mocks.session.mockResolvedValue('unknown');
    render(<AdminLayout><p>Editor</p></AdminLayout>);

    await announceUnauthorized();

    await waitFor(() => expect(mocks.session).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
