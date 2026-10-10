import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoadingImage from './LoadingImage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('image readiness', () => {
  it('does not request offscreen images and retains the placeholder until decoding completes', async () => {
    let intersect!: () => void;
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.stubGlobal('IntersectionObserver', class {
      observe = vi.fn(); disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback) { intersect = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    });
    render(<LoadingImage src="/poster.jpg" alt="Poster" />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img).not.toHaveAttribute('src');
    expect(img.parentElement).toHaveAttribute('data-load-state', 'loading');
    act(() => intersect());
    expect(img).toHaveAttribute('src', '/poster.jpg');
    let decode!: () => void;
    Object.defineProperty(img, 'naturalWidth', { value: 800 });
    img.decode = vi.fn(() => new Promise<void>(resolve => { decode = resolve; }));
    fireEvent.load(img);
    expect(img.parentElement).toHaveAttribute('data-load-state', 'loading');
    await act(async () => decode());
    expect(img.parentElement).toHaveAttribute('data-load-state', 'ready');
  });

  it('handles already cached images and resets readiness when the source changes', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800);
    const view = render(<LoadingImage loading="eager" src="/cached.jpg" alt="Poster" />);
    await waitFor(() => expect(screen.getByRole('img').parentElement).toHaveAttribute('data-load-state', 'ready'));
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
    view.rerender(<LoadingImage loading="eager" src="/next.jpg" alt="Poster" />);
    expect(screen.getByRole('img').parentElement).toHaveAttribute('data-load-state', 'loading');
  });

  it('ignores stale decodes and replaces failed images with a terminal fallback', async () => {
    const view = render(<LoadingImage loading="eager" src="/first.jpg" alt="Poster" />);
    const first = screen.getByRole('img') as HTMLImageElement;
    let decode!: () => void;
    Object.defineProperty(first, 'naturalWidth', { value: 800 });
    first.decode = () => new Promise<void>(resolve => { decode = resolve; });
    fireEvent.load(first);
    view.rerender(<LoadingImage loading="eager" src="/second.jpg" alt="Poster" />);
    await act(async () => decode());
    const second = screen.getByRole('img');
    expect(second.parentElement).toHaveAttribute('data-load-state', 'loading');
    fireEvent.error(second);
    expect(second.parentElement).toHaveAttribute('data-load-state', 'error');
    expect(second.parentElement).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByText('image_load_error')).toBeInTheDocument();
  });
});
