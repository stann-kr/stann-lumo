import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, router: { replace }, session: vi.fn() };
});
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router, usePathname: () => '/admin/music' }));
vi.mock('@/capabilities/auth/auth.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/capabilities/auth/auth.client')>()),
  getAdminSessionState: mocks.session,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the editor only for a confirmed session', async () => {
    mocks.session.mockResolvedValue('authenticated');
    render(<ProtectedRoute><p>Editor</p></ProtectedRoute>);

    expect(await screen.findByText('Editor')).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to sign-in with a way back to the requested page', async () => {
    mocks.session.mockResolvedValue('unauthenticated');
    render(<ProtectedRoute><p>Editor</p></ProtectedRoute>);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin?next=%2Fadmin%2Fmusic'));
    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
  });

  it('keeps an unreachable server from looking like a sign-out and retries on request', async () => {
    const user = userEvent.setup();
    mocks.session.mockResolvedValueOnce('unknown').mockResolvedValueOnce('authenticated');
    render(<ProtectedRoute><p>Editor</p></ProtectedRoute>);

    expect(await screen.findByRole('alert')).toHaveTextContent('관리자 화면에 연결하지 못했습니다.');
    expect(mocks.replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('Editor')).toBeInTheDocument();
  });
});
