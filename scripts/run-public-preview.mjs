import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sanitizeLocalWorkerProcessEnvironment } from './check-local-server-env.mjs';
import { runLongLivedProcess, runStep } from './run-local-worker.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function buildPublicPreviewConfig(source, directory, root = repositoryRoot) {
  const database = source.d1_databases?.find((binding) => binding.binding === 'DB');
  const media = source.r2_buckets?.find((binding) => binding.binding === 'MEDIA');
  if (!database?.database_id || !media?.bucket_name) throw new Error('Public preview requires the configured production DB and MEDIA bindings');
  return {
    name: 'stann-lumo-public-preview',
    main: path.join(directory, 'worker.mjs'),
    compatibility_date: source.compatibility_date,
    compatibility_flags: source.compatibility_flags,
    assets: { directory: path.join(root, '.open-next/assets') },
    d1_databases: [{ binding: 'DB', database_name: database.database_name, database_id: database.database_id, remote: true }],
    r2_buckets: [{ binding: 'MEDIA', bucket_name: media.bucket_name, remote: true }],
    vars: { MIGRATE_ENABLED: 'false', NEXTJS_ENV: 'development' },
  };
}

async function runPublicPreview() {
  if (process.argv.length > 2) throw new Error('dev:preview does not accept additional options');
  const source = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'wrangler.json'), 'utf8'));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stann-lumo-public-preview-'));
  try {
    const config = buildPublicPreviewConfig(source, directory);
    const configPath = path.join(directory, 'wrangler.json');
    const envPath = path.join(directory, 'worker.env');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    fs.writeFileSync(envPath, 'MIGRATE_ENABLED="false"\nNEXTJS_ENV="development"\n', { mode: 0o600 });
    fs.writeFileSync(config.main, [
      `import handler from ${JSON.stringify(path.join(repositoryRoot, '.open-next/worker.js'))};`,
      `import { createPublicPreview } from ${JSON.stringify(path.join(repositoryRoot, 'scripts/public-preview-guard.mjs'))};`,
      'export default createPublicPreview(handler);',
    ].join('\n'));
    runStep('build public preview artifact', 'npm', ['run', 'build:cloudflare'], sanitizeLocalWorkerProcessEnvironment(process.env));
    process.stdout.write(`[public-preview] http://127.0.0.1:3004 · production DB/R2 · public GET/HEAD only\n`);
    // Wrangler can use the existing CLI login; process secrets never become Worker bindings.
    await runLongLivedProcess(process.execPath, [
      path.join(repositoryRoot, 'node_modules/wrangler/bin/wrangler.js'), 'dev',
      '--config', configPath, '--env-file', envPath, '--ip', '127.0.0.1', '--port', '3004',
    ], { ...process.env, CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false' });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPublicPreview().catch((error) => {
    process.stderr.write(`[public-preview] ${error.message}\n`);
    process.exitCode = 1;
  });
}
