import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GlobalError from './global-error';

vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a> }));

describe('GlobalError', () => {
  it('keeps an announced retry and a route home when the root layout fails', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<GlobalError error={new Error('root failed')} reset={reset} />, { container: document });

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
