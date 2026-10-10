import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchContent } from '@/capabilities/content/content.client';
import { ContentProvider } from '@/contexts/ContentContext';
import AdminContentGate from './AdminContentGate';
import type { ContentData } from '@/capabilities/content/content';

vi.mock('@/capabilities/content/content.client', () => ({ fetchContent: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

const content = {} as ContentData;

function deferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

function Editor({ saveRequest }: { saveRequest: () => void }) {
  useEffect(() => {
    saveRequest();
  }, [saveRequest]);

  return <button type="button" onClick={saveRequest}>SAVE CONTENT</button>;
}

function renderGate(saveRequest = vi.fn()) {
  render(
    <ContentProvider>
      <AdminContentGate>
        <Editor saveRequest={saveRequest} />
      </AdminContentGate>
    </ContentProvider>,
  );
  return saveRequest;
}

describe('AdminContentGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the editor unmounted until both EN and KO content loads complete', async () => {
    const en = deferred<ContentData | null>();
    const ko = deferred<ContentData | null>();
    vi.mocked(fetchContent).mockReturnValueOnce(en.promise).mockReturnValueOnce(ko.promise);
    const saveRequest = renderGate();

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: 'SAVE CONTENT' })).not.toBeInTheDocument();

    en.resolve(content);
    await Promise.resolve();
    expect(screen.queryByRole('button', { name: 'SAVE CONTENT' })).not.toBeInTheDocument();

    ko.resolve(content);
    expect(await screen.findByRole('button', { name: 'SAVE CONTENT' })).toBeInTheDocument();
    await waitFor(() => expect(saveRequest).toHaveBeenCalledTimes(1));
  });

  it('fails closed when either locale fails, focuses the retryable error, and recovers only after both retry loads succeed', async () => {
    const user = userEvent.setup();
    const retryEn = deferred<ContentData | null>();
    const retryKo = deferred<ContentData | null>();
    vi.mocked(fetchContent)
      .mockRejectedValueOnce(new Error('test-only EN failure'))
      .mockResolvedValueOnce(content)
      .mockReturnValueOnce(retryEn.promise)
      .mockReturnValueOnce(retryKo.promise);
    const saveRequest = renderGate();

    const error = await screen.findByRole('alert');
    expect(error).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'SAVE CONTENT' })).not.toBeInTheDocument();
    expect(saveRequest).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    await waitFor(() => expect(fetchContent).toHaveBeenCalledTimes(4));
    const loading = screen.getByRole('status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'SAVE CONTENT' })).not.toBeInTheDocument();
    expect(saveRequest).not.toHaveBeenCalled();

    retryEn.resolve(content);
    retryKo.resolve(content);
    expect(await screen.findByRole('button', { name: 'SAVE CONTENT' })).toBeInTheDocument();
    const readyAnnouncement = screen.getByRole('status');
    expect(readyAnnouncement).toHaveTextContent('콘텐츠를 불러왔습니다. 편집할 수 있습니다.');
    expect(readyAnnouncement).not.toHaveFocus();
    await waitFor(() => expect(saveRequest).toHaveBeenCalledTimes(1));
  });

  it('treats a missing KO payload as a bootstrap error instead of falling back to EN', async () => {
    vi.mocked(fetchContent).mockResolvedValueOnce(content).mockResolvedValueOnce(null);
    const saveRequest = renderGate();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SAVE CONTENT' })).not.toBeInTheDocument();
    expect(saveRequest).not.toHaveBeenCalled();
  });
});
