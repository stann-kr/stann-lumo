import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useDeleteConfirm } from '@/capabilities/admin/useDeleteConfirm';
import DeleteConfirmModal from './DeleteConfirmModal';

const DeleteHarness = () => {
  const { isOpen, openConfirm, closeConfirm } = useDeleteConfirm();

  return (
    <div>
      <button type="button" onClick={() => openConfirm(0)}>OPEN DELETE</button>
      <DeleteConfirmModal
        show={isOpen}
        itemName="Fixture"
        onConfirm={closeConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

describe('DeleteConfirmModal', () => {
  it('uses dialog semantics, focuses cancel first, and restores the opener on escape', async () => {
    const user = userEvent.setup();
    render(<DeleteHarness />);

    const opener = screen.getByRole('button', { name: 'OPEN DELETE' });
    await user.click(opener);

    const dialog = await screen.findByRole('dialog', { name: '항목 삭제' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('“Fixture”을(를) 삭제할까요?');
    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
