import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PublicRouteError from './error';

vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a> }));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

describe('PublicRouteError', () => {
  it('offers an announced retry and a route back to the public home', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<PublicRouteError error={new Error('unavailable')} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Content unavailable.');
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
