import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

// Next streams each page's RSC payload in inline <script> tags and the root layout marks `data-js` inline, so scripts
// keep 'unsafe-inline': per-request nonces would turn every statically rendered page dynamic. The rest of the policy
// still shuts plugins, <base> rewrites, foreign form posts, outside connections and unknown frames.
const contentSecurityPolicy = [
  "default-src 'self'",
  // React's development build evaluates code for its error overlays; production never needs eval.
  // Cloudflare Web Analytics on the production zone injects its beacon (static.cloudflareinsights.com/beacon.min.js/<version>)
  // into HTML sent to browsers; it reports to /cdn-cgi/rum on this origin, which connect-src 'self' already covers.
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Archive video thumbnails come straight from YouTube's image hosts; uploads are served from this origin.
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  // Click-to-load mix players (mixEmbed.ts) and archive videos (ArchiveDetailPageClient.tsx).
  'frame-src https://w.soundcloud.com https://www.youtube-nocookie.com https://www.youtube.com',
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Same-origin framing stays available for the site's own previews; other sites cannot frame it.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // Keep local development and the standard production build from mutating the
  // same output directory when they run at the same time.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  poweredByHeader: false,
  // About was folded into the press kit (2026-11). The redirect answers before any page renders, so it stays a real
  // 308: under a loading.tsx boundary a page-level permanentRedirect() could only send a meta refresh in a 200 shell.
  async redirects() {
    return [{ source: '/about', destination: '/press-kit', permanent: true }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // The CMS is private; keep it out of search results even if a link leaks.
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
