import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import MixPlayer from './MixPlayer';

describe('MixPlayer', () => {
  it('loads the host player only after the visitor presses play', async () => {
    const user = userEvent.setup();
    const { container } = render(<MixPlayer title="Tresor" platform="SoundCloud" language="en" link="https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025" />);
    expect(container.querySelector('iframe')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Play Tresor' }));
    expect(screen.getByTitle('Tresor player')).toHaveAttribute('src', expect.stringMatching(/^https:\/\/w\.soundcloud\.com\/player\/\?url=/));
    expect(screen.getByRole('link', { name: /Listen on SoundCloud/ })).toHaveAttribute('href', 'https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025');
  });

  it('opens hosts without an embed in a new tab', () => {
    render(<MixPlayer title="Frame Dragging" platform="Bandcamp" language="ko" link="https://ameniiarecords.bandcamp.com/album/frame-dragging" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bandcamp에서 듣기/ })).toHaveAttribute('target', '_blank');
  });
});
