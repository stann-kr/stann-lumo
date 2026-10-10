const PUBLIC_PAGE = /^\/(?:about|music|contact|link|events(?:\/[^/]+)?|archive(?:\/[^/]+)?)?\/?$/;
const PUBLIC_API = /^\/api\/(?:content\/(?:en|ko)|archive|events(?:\/[^/]+)?|media\/[^/]+)\/?$/;
const PUBLIC_ASSET = /^\/(?:_next\/(?:static\/.+|image)|(?:apple-)?icon\.png|favicon\.ico|robots\.txt|sitemap\.xml)$/;

export function createPublicPreview(handler) {
  return {
    async fetch(request, env, ctx) {
      let pathname;
      try {
        const decoded = decodeURIComponent(new URL(request.url).pathname).replace(/\\/g, '/').replace(/\/+/g, '/');
        pathname = new URL(decoded, 'https://preview.invalid').pathname;
      } catch {
        return new Response('Invalid path', { status: 400 });
      }
      // Only public reads reach the application; no auth, CMS or scheduled entrypoint.
      if (!['GET', 'HEAD'].includes(request.method) || ![PUBLIC_PAGE, PUBLIC_API, PUBLIC_ASSET].some((pattern) => pattern.test(pathname))) {
        return new Response('Public preview only', { status: 403, headers: { 'Cache-Control': 'no-store' } });
      }
      const response = await handler.fetch(request, env, ctx);
      const headers = new Headers(response.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
  };
}
