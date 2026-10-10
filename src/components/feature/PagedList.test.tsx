import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PagedList from './PagedList';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const page = (offset = 0) => ({ items: Array.from({ length: 4 }, (_, i) => ({ id: String(offset + i) })), total: 8, nextOffset: offset === 0 ? 4 : null });
const props = { total: 8, label: 'Archive', skeleton: <div>Skeleton</div>, renderItem: (item: { id: string }) => <a href={`/${item.id}`}>{item.id}</a> };

describe('requested public pages', () => {
  const observers: { intersect: () => void; target?: Element }[] = [];
  beforeEach(() => {
    observers.length = 0;
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.stubGlobal('IntersectionObserver', class {
      disconnect = vi.fn();
      record: (typeof observers)[number];
      constructor(callback: IntersectionObserverCallback) {
        this.record = { intersect: () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) };
        observers.push(this.record);
      }
      observe(target: Element) { this.record.target = target; }
    });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('waits for the viewport, shows skeletons during the request and deduplicates observer signals', async () => {
    let resolve!: (value: ReturnType<typeof page>) => void;
    const loadPage = vi.fn(() => new Promise<ReturnType<typeof page>>(done => { resolve = done; }));
    render(<PagedList {...props} loadPage={loadPage} />);
    expect(loadPage).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    act(() => { observers[0]!.intersect(); observers[0]!.intersect(); });
    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByText('Skeleton')).toHaveLength(4);
    await act(async () => resolve(page()));
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'false');
    expect(loadPage).toHaveBeenCalledTimes(1);
    const first = screen.getAllByRole('link')[0];
    act(() => observers.at(-1)!.intersect());
    await act(async () => resolve(page(4)));
    expect(screen.getAllByRole('link')).toHaveLength(8);
    expect(screen.getAllByRole('link')[0]).toBe(first);
    expect(screen.queryByText('Skeleton')).not.toBeInTheDocument();
  });

  it('preserves content on failure, waits for retry and restores manual keyboard focus', async () => {
    const loadPage = vi.fn().mockResolvedValueOnce(page()).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page(4));
    render(<PagedList {...props} loadPage={loadPage} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(4));
    expect(screen.getAllByRole('link')[0]).toHaveFocus();
    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('list_load_error');
    expect(screen.getAllByRole('link')).toHaveLength(4);
    act(() => observers.at(-1)!.intersect());
    expect(loadPage).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'list_retry' }));
    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(8));
    expect(screen.getAllByRole('link')[4]).toHaveFocus();
  });

  it('aborts an obsolete sort request and never appends its late response', async () => {
    let resolve!: (value: ReturnType<typeof page>) => void;
    const old = vi.fn<(offset: number, signal: AbortSignal) => Promise<ReturnType<typeof page>>>(() => new Promise(done => { resolve = done; }));
    const view = render(<PagedList key="old" {...props} loadPage={old} />);
    act(() => observers[0]!.intersect());
    view.rerender(<PagedList key="new" {...props} loadPage={vi.fn().mockResolvedValue(page(4))} />);
    expect(old.mock.calls[0]![1].aborted).toBe(true);
    await act(async () => resolve(page()));
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    act(() => observers.at(-1)!.intersect());
    await waitFor(() => expect(screen.getAllByRole('link')[0]).toHaveTextContent('4'));
  });

  it('does not load while hidden, inert, or while a following control has keyboard focus', () => {
    const loadPage = vi.fn();
    const view = render(<div inert><PagedList {...props} loadPage={loadPage} /></div>);
    act(() => observers[0]!.intersect());
    expect(loadPage).not.toHaveBeenCalled();
    view.rerender(<div><PagedList {...props} loadPage={loadPage} /></div>);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => observers.at(-1)!.intersect());
    expect(loadPage).not.toHaveBeenCalled();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    screen.getByRole('button').focus();
    act(() => observers.at(-1)!.intersect());
    expect(loadPage).not.toHaveBeenCalled();
  });

  it('resumes a visible loading section when the navigation layer stops being inert', async () => {
    const loadPage = vi.fn().mockResolvedValue(page());
    const view = render(<div inert><PagedList {...props} loadPage={loadPage} /></div>);
    act(() => observers[0]!.intersect());
    expect(loadPage).not.toHaveBeenCalled();
    view.rerender(<div><PagedList {...props} loadPage={loadPage} /></div>);
    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(4));
    expect(loadPage).toHaveBeenCalledTimes(1);
  });
});
