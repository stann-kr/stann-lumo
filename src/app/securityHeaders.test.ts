import { describe, expect, it } from 'vitest';
import { mixEmbed } from '@/capabilities/media/mixEmbed';
import nextConfig from '../../next.config';

/** The site-wide Content-Security-Policy as directive → sources. */
async function contentSecurityPolicy(): Promise<Map<string, string[]>> {
  const rules = await nextConfig.headers!();
  const value = rules.find((rule) => rule.source === '/:path*')?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;
  expect(value).toBeDefined();
  return new Map(value!.split(';').map((directive) => {
    const [name, ...sources] = directive.trim().split(/\s+/);
    return [name, sources];
  }));
}

describe('Content-Security-Policy', () => {
  it('lets every player the site embeds load in a frame', async () => {
    const frameSources = (await contentSecurityPolicy()).get('frame-src');
    const players = [
      mixEmbed('https://soundcloud.com/stannlumo/mix')?.src,
      mixEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.src,
      // ArchiveDetailPageClient embeds archive videos from the standard YouTube host.
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    ];
    for (const src of players) expect(frameSources).toContain(new URL(src!).origin);
  });

  it('lets the Cloudflare Web Analytics beacon injected on the production zone run and report', async () => {
    const policy = await contentSecurityPolicy();
    // The edge injects https://static.cloudflareinsights.com/beacon.min.js/<version>; a host source covers every version path.
    expect(policy.get('script-src')).toContain('https://static.cloudflareinsights.com');
    // Automatic setup posts to /cdn-cgi/rum on the site's own origin.
    expect(policy.get('connect-src')).toEqual(["'self'"]);
  });

  it('keeps eval, plugins and framing by other sites closed outside development', async () => {
    const policy = await contentSecurityPolicy();
    expect(policy.get('script-src')).not.toContain("'unsafe-eval'");
    expect(policy.get('object-src')).toEqual(["'none'"]);
    expect(policy.get('frame-ancestors')).toEqual(["'self'"]);
  });
});
