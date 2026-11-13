import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_DIR = path.join(process.cwd(), 'src/app');

/** The app root, the public group and every segment folder down to the route, e.g. `events`, `events/[id]`. */
const segmentsAbove = (route: string) => [
  '',
  '(public)',
  ...route.split('/').map((_, index, parts) => path.join('(public)', ...parts.slice(0, index + 1))),
];

describe('public detail routes', () => {
  // A loading.tsx above a page wraps it in Suspense: the 200 shell is already streamed when notFound() runs,
  // so a missing id would only get a noindex soft 404. Keep these routes outside every loading boundary.
  it.each(['events/[id]', 'archive/[id]'])('%s has no loading boundary above it, so a missing id gets a real 404', (route) => {
    expect(existsSync(path.join(APP_DIR, '(public)', route, 'page.tsx'))).toBe(true);
    const boundaries = segmentsAbove(route).filter((segment) => existsSync(path.join(APP_DIR, segment, 'loading.tsx')));
    expect(boundaries).toEqual([]);
  });
});
