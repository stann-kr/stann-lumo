import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { AdminEditGuardProvider, useAdminEditGuard } from './AdminEditGuard';
import { useUnsavedChanges } from './useUnsavedChanges';

const GuardHarness = () => {
  const [value, setValue] = useState('initial');
  const [didLeave, setDidLeave] = useState(false);
  const { isDirty, requestExit } = useAdminEditGuard();
  useUnsavedChanges(value, 'fixture');

  return (
    <div>
      <button type="button" onClick={() => setValue('changed')}>EDIT</button>
      <button type="button" onClick={() => requestExit(() => setDidLeave(true))}>LEAVE</button>
      <p>{isDirty ? 'DIRTY' : 'CLEAN'}</p>
      {didLeave && <p>LEFT</p>}
    </div>
  );
};

describe('AdminEditGuardProvider', () => {
  it('warns on route exit, restores the trigger after cancel, and discards only after confirmation', async () => {
    const user = userEvent.setup();

    render(
      <AdminEditGuardProvider>
        <GuardHarness />
      </AdminEditGuardProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'EDIT' }));
    await waitFor(() => expect(screen.getByText('DIRTY')).toBeInTheDocument());

    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnloadEvent);
    expect(beforeUnloadEvent.defaultPrevented).toBe(true);

    const leaveButton = screen.getByRole('button', { name: 'LEAVE' });
    await user.click(leaveButton);

    const dialog = await screen.findByRole('dialog', { name: '저장하지 않은 변경 사항' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByRole('button', { name: '계속 편집하기' })).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(leaveButton).toHaveFocus());

    await user.click(leaveButton);
    await user.click(await screen.findByRole('button', { name: '저장하지 않고 이동' }));

    expect(screen.getByText('LEFT')).toBeInTheDocument();
    expect(screen.getByText('CLEAN')).toBeInTheDocument();
  });

  it('keeps the page behind the exit dialog out of reach until the dialog closes', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AdminEditGuardProvider>
        <GuardHarness />
      </AdminEditGuardProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'EDIT' }));
    await waitFor(() => expect(screen.getByText('DIRTY')).toBeInTheDocument());
    const leaveButton = screen.getByRole('button', { name: 'LEAVE' });
    await user.click(leaveButton);

    const dialog = await screen.findByRole('dialog', { name: '저장하지 않은 변경 사항' });
    expect(container).toHaveAttribute('inert');
    expect(container).not.toContainElement(dialog);
    expect(dialog.closest('[inert]')).toBeNull();

    await user.click(screen.getByRole('button', { name: '계속 편집하기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(container).not.toHaveAttribute('inert');
    await waitFor(() => expect(leaveButton).toHaveFocus());
  });
});
