import { useRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRevealGate } from './useRevealGate';

function Shell({ pathname, streaming = false }: { pathname: string; streaming?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { revealed, held } = useRevealGate(ref, pathname);
  return <main ref={ref} data-testid="main" data-revealed={revealed} data-held={held}><div>{streaming ? <div data-route-loading="" /> : <img alt="" />}</div></main>;
}

describe('reveal gate script hold', () => {
  beforeEach(() => {
    // The first-screen image sits inside the viewport.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 100, top: 0, bottom: 100, left: 0, right: 100, x: 0, y: 0, toJSON: () => ({}) });
  });
  afterEach(() => vi.restoreAllMocks());

  it('takes over from the CSS failsafe while the page is still hidden', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ opacity: '0' } as CSSStyleDeclaration);
    render(<Shell pathname="/archive" />);
    await waitFor(() => expect(screen.getByTestId('main')).toHaveAttribute('data-held', 'true'));
    expect(screen.getByTestId('main')).toHaveAttribute('data-revealed', 'false');
  });

  it('never re-hides a page the failsafe already showed, and holds only after the reveal', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ opacity: '1' } as CSSStyleDeclaration);
      const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
      render(<Shell pathname="/archive" />);
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(screen.getByTestId('main')).toHaveAttribute('data-held', 'false');
      complete.mockReturnValue(true);
      await act(() => vi.advanceTimersByTimeAsync(100));
      expect(screen.getByTestId('main')).toHaveAttribute('data-revealed', 'true');
      expect(screen.getByTestId('main')).toHaveAttribute('data-held', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits for a streamed page to replace the route fallback before checking its media', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ opacity: '0' } as CSSStyleDeclaration);
      const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
      const view = render(<Shell pathname="/archive" streaming />);
      await act(() => vi.advanceTimersByTimeAsync(5000));
      expect(screen.getByTestId('main')).toHaveAttribute('data-revealed', 'false');
      view.rerender(<Shell pathname="/archive" />);
      await act(() => vi.advanceTimersByTimeAsync(1000));
      expect(screen.getByTestId('main')).toHaveAttribute('data-revealed', 'false');
      complete.mockReturnValue(true);
      await act(() => vi.advanceTimersByTimeAsync(100));
      expect(screen.getByTestId('main')).toHaveAttribute('data-revealed', 'true');
    } finally {
      vi.useRealTimers();
    }
  });
});
