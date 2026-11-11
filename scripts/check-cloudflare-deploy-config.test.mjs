import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
}

test('Wrangler separates fixed development and production resources', () => {
  const wrangler = readJson('wrangler.json');
  const development = wrangler.env?.dev;

  assert.equal(wrangler.name, 'stann-lumo');
  assert.equal(wrangler.main, 'worker.ts');
  assert.deepEqual(wrangler.routes, [{ pattern: 'lumo.stann.kr', custom_domain: true }]);
  assert.equal(wrangler.d1_databases?.[0]?.binding, 'DB');
  assert.equal(wrangler.d1_databases?.[0]?.database_name, 'stann-lumo-db');
  assert.equal(wrangler.r2_buckets?.[0]?.binding, 'MEDIA');
  assert.equal(wrangler.r2_buckets?.[0]?.bucket_name, 'stann-lumo-media');
  assert.equal(wrangler.images?.binding, 'IMAGES');
  assert.deepEqual(wrangler.triggers?.crons, ['15 19 * * *']);

  assert.ok(development);
  assert.equal(development.workers_dev, true);
  assert.equal(development.preview_urls, true);
  assert.deepEqual(development.routes, []);
  assert.equal(development.d1_databases?.[0]?.binding, 'DB');
  assert.equal(development.d1_databases?.[0]?.database_name, 'stann-lumo-db-dev');
  assert.notEqual(development.d1_databases?.[0]?.database_id, wrangler.d1_databases?.[0]?.database_id);
  assert.equal(development.r2_buckets?.[0]?.binding, 'MEDIA');
  assert.equal(development.r2_buckets?.[0]?.bucket_name, 'stann-lumo-media-dev');
  assert.equal(development.images?.binding, 'IMAGES');
  assert.notEqual(development.r2_buckets?.[0]?.bucket_name, wrangler.r2_buckets?.[0]?.bucket_name);
  assert.deepEqual(development.triggers?.crons, []);
  assert.deepEqual(development.vars, {
    MIGRATE_ENABLED: 'false',
    NEXTJS_ENV: 'development',
  });
  assert.equal('ADMIN_PASSWORD' in development.vars, false);
});

test('package scripts keep deploy targets explicit and branch-guarded', () => {
  const packageJson = readJson('package.json');

  assert.equal(packageJson.scripts.deploy, undefined);
  assert.match(packageJson.scripts['deploy:dev'], /ALLOW_MANUAL_CLOUDFLARE_DEPLOY=dev/);
  assert.match(packageJson.scripts['deploy:dev:artifact'], /check-cloudflare-deploy-target\.mjs dev/);
  assert.match(packageJson.scripts['deploy:dev:artifact'], /wrangler deploy --env dev/);
  assert.match(packageJson.scripts['deploy:preview:artifact'], /wrangler versions upload --env dev/);
  assert.match(packageJson.scripts['deploy:production:artifact'], /check-cloudflare-deploy-target\.mjs production/);
  assert.match(packageJson.scripts['deploy:production:artifact'], /wrangler deploy --env=/);
  assert.doesNotMatch(packageJson.scripts['deploy:production:artifact'], /--env dev/);
  assert.equal(packageJson.scripts['d1:dev:apply'], 'wrangler d1 migrations apply DB --remote --env dev');
});
