import { render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
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

  it('keeps the page behind the open dialog out of reach and restores only what it changed on close', async () => {
    const user = userEvent.setup();
    const alreadyInert = document.createElement('aside');
    alreadyInert.setAttribute('inert', '');
    document.body.appendChild(alreadyInert);
    try {
      const { container } = render(<DeleteHarness />);
      const opener = screen.getByRole('button', { name: 'OPEN DELETE' });
      await user.click(opener);

      const dialog = await screen.findByRole('dialog', { name: '항목 삭제' });
      expect(container).toHaveAttribute('inert');
      expect(container).not.toContainElement(dialog);
      expect(dialog.closest('[inert]')).toBeNull();
      await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(container).not.toHaveAttribute('inert');
      expect(alreadyInert).toHaveAttribute('inert');
      await waitFor(() => expect(opener).toHaveFocus());
    } finally {
      alreadyInert.remove();
    }
  });

  it('moves focus to the given fallback when the opener was removed with the item', async () => {
    const user = userEvent.setup();
    function RemovingHarness() {
      const [items, setItems] = useState(['Fixture']);
      const [open, setOpen] = useState(false);
      const listRef = useRef<HTMLElement>(null);
      return <section ref={listRef} tabIndex={-1} aria-label="LIST">
        {items.map((item) => <button key={item} type="button" onClick={() => setOpen(true)}>DELETE {item}</button>)}
        <DeleteConfirmModal show={open} itemName="Fixture" returnFocusRef={listRef}
          onConfirm={() => { setItems([]); setOpen(false); }} onCancel={() => setOpen(false)} />
      </section>;
    }
    render(<RemovingHarness />);
    await user.click(screen.getByRole('button', { name: 'DELETE Fixture' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.getByRole('region', { name: 'LIST' })).toHaveFocus());
  });
});
