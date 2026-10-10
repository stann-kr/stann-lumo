import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminEditGuardProvider } from '@/capabilities/admin/AdminEditGuard';
import AdminSectionHeader from './AdminSectionHeader';

type HeaderProps = Partial<Parameters<typeof AdminSectionHeader>[0]>;

function pressSave(init: KeyboardEventInit = { metaKey: true }) {
  const event = new KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true, ...init });
  fireEvent(window, event);
  return event;
}

function renderHeader(props: HeaderProps = {}) {
  const onSave = vi.fn();
  const { unmount } = render(<AdminEditGuardProvider><AdminSectionHeader title="음악" onSave={onSave} {...props} /></AdminEditGuardProvider>);
  return { onSave, unmount };
}

describe('AdminSectionHeader save shortcut', () => {
  it('saves with ⌘S or Ctrl+S instead of opening the browser save dialog', () => {
    const { onSave } = renderHeader();

    expect(pressSave().defaultPrevented).toBe(true);
    expect(pressSave({ ctrlKey: true }).defaultPrevented).toBe(true);
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: '변경 사항 저장' })).toHaveAttribute('aria-keyshortcuts', 'Meta+S Control+S');
  });

  it.each<[string, HeaderProps]>([
    ['saving', { isSaving: true }],
    ['disabled', { isSaveDisabled: true }],
  ])('does nothing while %s', (_state, props) => {
    const { onSave } = renderHeader(props);

    expect(pressSave().defaultPrevented).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('waits while a confirmation dialog is open', () => {
    const { onSave } = renderHeader();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.append(dialog);

    pressSave();
    dialog.remove();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('leaves the browser shortcut alone on pages without a save action', () => {
    render(<AdminEditGuardProvider><AdminSectionHeader title="디자인 참조" showSaveButton={false} /></AdminEditGuardProvider>);

    expect(pressSave().defaultPrevented).toBe(false);
  });
});
