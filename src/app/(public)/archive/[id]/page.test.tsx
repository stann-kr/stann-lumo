import type { ComponentProps, ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GalleryPhoto } from '@/capabilities/media/media';
import ArchiveDetailPageClient from '@/components/public/ArchiveDetailPageClient';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'> & { href: string; scroll?: boolean }) => {
    delete props.scroll;
    return <a href={href} {...props}>{children}</a>;
  },
}));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/feature/PageLayout', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

const photos: GalleryPhoto[] = [
  {
    id: 'first',
    filename: 'first.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    altText: 'First archive item',
    caption: 'First Signal',
    sortOrder: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    mediaType: 'image',
    focalX: 50,
    focalY: 50,
  },
  {
    id: 'middle',
    filename: 'middle.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2048,
    altText: 'Middle archive item',
    caption: 'Middle Signal',
    sortOrder: 2,
    createdAt: '2026-08-02T00:00:00.000Z',
    mediaType: 'image',
    focalX: 50,
    focalY: 50,
  },
  {
    id: 'last',
    filename: 'last.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 4096,
    altText: 'Last archive item',
    caption: 'Last Signal',
    sortOrder: 3,
    createdAt: '2026-08-03T00:00:00.000Z',
    mediaType: 'image',
    focalX: 50,
    focalY: 50,
  },
];

describe('GalleryPhotoPage', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('provides labelled previous and next controls in an archive navigation landmark', () => {
    render(<ArchiveDetailPageClient photo={photos[1]} previous={photos[0]} next={photos[2]} index={1} total={photos.length} />);

    const article = screen.getByRole('article', { name: 'Archive item: Middle Signal' });
    const navigation = within(article).getByRole('navigation', { name: 'Archive navigation' });
    const previous = within(navigation).getByRole('link', { name: 'Previous archive item' });
    const next = within(navigation).getByRole('link', { name: 'Next archive item' });

    expect(previous).toHaveAttribute('href', '/archive/first');
    expect(next).toHaveAttribute('href', '/archive/last');
    expect(previous).toHaveAttribute('aria-keyshortcuts', 'ArrowLeft');
    expect(next).toHaveAttribute('aria-keyshortcuts', 'ArrowRight');
  });

  it('supports its announced keyboard shortcuts and does not expose an unavailable item as a link', async () => {
    const user = userEvent.setup();
    const { container } = render(<ArchiveDetailPageClient photo={photos[0]} previous={null} next={photos[1]} index={0} total={photos.length} />);

    const article = screen.getByRole('article', { name: 'Archive item: First Signal' });
    const navigation = within(article).getByRole('navigation', { name: 'Archive navigation' });

    expect(within(navigation).queryByRole('link', { name: 'Previous archive item' })).not.toBeInTheDocument();
    expect(within(navigation).getByRole('button', { name: 'No previous archive item' })).toBeDisabled();

    await user.keyboard('{ArrowRight}');
    expect(push).toHaveBeenCalledWith('/archive/middle');
    await user.keyboard('{Escape}');
    expect(push).toHaveBeenLastCalledWith('/archive', { scroll: false });

    for (const icon of container.querySelectorAll('i')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });
  it('keeps seeded neighbours and restores the original collection point with Escape', () => {
    render(<ArchiveDetailPageClient photo={photos[1]} previous={photos[0]} next={photos[2]} index={25} total={53}
      browse={{ sort: 'random', seed: 42, page: 2, from: 'first' }} />);
    expect(screen.getByRole('link', { name: 'Next archive item' })).toHaveAttribute('href', '/archive/last?sort=random&seed=42&page=2&from=first');
    const back = '/archive?sort=random&seed=42&page=2#archive-item-first';
    expect(screen.getByRole('link', { name: 'gallery_title' })).toHaveAttribute('href', back);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(push).toHaveBeenLastCalledWith(back, { scroll: false });
  });
  it('leaves player, editing, modal and modified keys with their owning control', () => {
    const { container } = render(<>
      <ArchiveDetailPageClient photo={{ ...photos[1], mediaType: 'video_file' }} previous={photos[0]} next={photos[2]} index={1} total={3} />
      <input aria-label="Search" />
      <div role="dialog" aria-label="Menu"><button type="button">Close</button></div>
    </>);
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('controls');
    for (const target of [video, screen.getByRole('textbox'), screen.getByRole('button', { name: 'Close' })]) {
      for (const key of ['ArrowRight', 'ArrowLeft', 'Escape']) fireEvent.keyDown(target, { key });
    }
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true });
    expect(push).not.toHaveBeenCalled();
    const article = screen.getByRole('article');
    article.setAttribute('inert', '');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(push).not.toHaveBeenCalled();
    article.removeAttribute('inert');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(push).toHaveBeenCalledWith('/archive/last');
  });

});
