import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalPreviewArgs, parseLocalWorkerOptions } from './run-local-worker.mjs';
import { buildPublicPreviewConfig } from './run-public-preview.mjs';
import { createPublicPreview } from './public-preview-guard.mjs';

test('local preview always uses local bindings and an explicit sanitized env file', () => {
  const args = buildLocalPreviewArgs('/tmp/local-worker.env', '127.0.0.1');

  assert.deepEqual(args.slice(1), [
    'dev',
    '--local',
    '--env-file',
    '/tmp/local-worker.env',
    '--ip',
    '127.0.0.1',
    '--port',
    '3004',
  ]);
  assert.equal(args.includes('--remote'), false);
});

test('Docker may listen inside the container but arbitrary interfaces are rejected', () => {
  assert.deepEqual(parseLocalWorkerOptions(['--ip', '0.0.0.0']), {
    ip: '0.0.0.0',
    prepareOnly: false,
    nextOnly: false,
  });
  assert.throws(() => parseLocalWorkerOptions(['--ip', '192.0.2.1']), /Local Worker IP/);
});

test('public preview uses only explicit remote media bindings without deployment or admin configuration', () => {
  const source = {
    compatibility_date: '2025-01-01', compatibility_flags: ['nodejs_compat'],
    d1_databases: [{ binding: 'DB', database_name: 'production-db', database_id: 'production-id' }],
    r2_buckets: [{ binding: 'MEDIA', bucket_name: 'production-media' }],
    vars: { ADMIN_PASSWORD: 'must-not-be-forwarded' }, routes: ['example.test'], triggers: { crons: ['* * * * *'] },
    env: { dev: { d1_databases: [{ binding: 'DB', database_id: 'dev-id' }] } },
  };
  const config = buildPublicPreviewConfig(source, '/tmp/preview', '/repo');
  assert.deepEqual(config.d1_databases, [{ binding: 'DB', database_name: 'production-db', database_id: 'production-id', remote: true }]);
  assert.deepEqual(config.r2_buckets, [{ binding: 'MEDIA', bucket_name: 'production-media', remote: true }]);
  assert.deepEqual(config.vars, { MIGRATE_ENABLED: 'false', NEXTJS_ENV: 'development' });
  for (const key of ['routes', 'triggers', 'env']) assert.equal(key in config, false);
  assert.throws(() => buildPublicPreviewConfig({}, '/tmp/preview'), /requires/);
});

test('public preview blocks writes, private routes and encoded bypasses before invoking the app', async () => {
  const forwarded = [];
  const preview = createPublicPreview({ async fetch(request) { forwarded.push(request.url); return new Response('public content'); } });
  assert.equal('scheduled' in preview, false);
  for (const [method, pathname] of [
    ['POST', '/'], ['PUT', '/api/archive'], ['POST', '/api/events?section=past&offset=0'], ['DELETE', '/api/media/photo'],
    ['GET', '/admin'], ['GET', '/api/auth/session'], ['GET', '/api/admin/tracks'],
    ['GET', '/%61dmin'], ['GET', '/api%2fauth/session'], ['GET', '/api%5cadmin/tracks'],
    ['GET', '/about/%2e%2e/admin'], ['GET', '/%2561dmin'],
  ]) {
    const response = await preview.fetch(new Request(`https://preview.test${pathname}`, { method }));
    assert.equal(response.status, 403, `${method} ${pathname}`);
  }
  assert.equal(forwarded.length, 0);
  for (const pathname of ['/', '/music', '/archive/photo?sort=random&seed=42', '/api/content/ko', '/api/media/photo', '/_next/static/chunks/app.js', '/api/events?section=past&today=2026-09-10&offset=0', '/api/archive?offset=0']) {
    const response = await preview.fetch(new Request(`https://preview.test${pathname}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
  assert.equal(forwarded.length, 8);
  assert.equal((await preview.fetch(new Request('https://preview.test/%'))).status, 400);
});
