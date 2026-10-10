import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  inspectLocalServerEnvironmentFile,
  sanitizeLocalWorkerProcessEnvironment,
  serializeLocalWorkerEnvironment,
} from './check-local-server-env.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseLocalWorkerOptions(args) {
  const ipIndex = args.indexOf('--ip');
  const ip = ipIndex >= 0 && args[ipIndex + 1] ? args[ipIndex + 1] : '127.0.0.1';
  if (ip !== '127.0.0.1' && ip !== '0.0.0.0') {
    throw new Error('Local Worker IP must be 127.0.0.1 or 0.0.0.0');
  }
  return {
    ip,
    prepareOnly: args.includes('--prepare-only'),
    nextOnly: args.includes('--next'),
  };
}

export function buildLocalPreviewArgs(envFilePath, ip) {
  return [
    path.join(repositoryRoot, 'node_modules/wrangler/bin/wrangler.js'),
    'dev',
    '--local',
    '--env-file',
    envFilePath,
    '--ip',
    ip,
    '--port',
    '3004',
  ];
}

export function runStep(label, command, args, environment) {
  process.stdout.write(`[local-worker] ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: environment,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
}

export async function runLongLivedProcess(command, args, environment) {
  const child = spawn(command, args, {
    cwd: repositoryRoot,
    env: environment,
    stdio: 'inherit',
  });

  const forwardSigint = () => child.kill('SIGINT');
  const forwardSigterm = () => child.kill('SIGTERM');
  process.once('SIGINT', forwardSigint);
  process.once('SIGTERM', forwardSigterm);

  try {
    const exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)));
    });
    if (exitCode !== 0) process.exitCode = exitCode;
  } finally {
    process.removeListener('SIGINT', forwardSigint);
    process.removeListener('SIGTERM', forwardSigterm);
  }
}

async function runLocalWorker(args = process.argv.slice(2)) {
  const options = parseLocalWorkerOptions(args);
  const childEnvironment = sanitizeLocalWorkerProcessEnvironment(process.env);

  if (options.nextOnly) {
    if (options.prepareOnly) throw new Error('--next and --prepare-only cannot be combined');
    process.stdout.write(`[local-worker] start binding-free Next dev at ${options.ip}:3004\n`);
    await runLongLivedProcess(
      process.execPath,
      [
        path.join(repositoryRoot, 'node_modules/next/dist/bin/next'),
        'dev',
        '--hostname',
        options.ip,
        '--port',
        '3004',
      ],
      childEnvironment,
    );
    return;
  }

  const sourcePath = path.join(repositoryRoot, '.dev.vars');
  const selection = inspectLocalServerEnvironmentFile(sourcePath);
  if (selection.error) throw new Error(selection.error);

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'stann-lumo-local-worker-'));
  const envFilePath = path.join(temporaryDirectory, 'worker.env');
  fs.writeFileSync(
    envFilePath,
    serializeLocalWorkerEnvironment(selection.values),
    { encoding: 'utf8', flag: 'wx', mode: 0o600 },
  );

  const cleanup = () => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  };

  try {
    process.stdout.write(
      `[local-worker] allowlist ready; excluded ${selection.excludedKeys.length} disallowed key(s)\n`,
    );
    runStep('apply local D1 migrations', 'npm', ['run', 'local:d1:apply'], childEnvironment);
    runStep('build Cloudflare artifact', 'npm', ['run', 'build:cloudflare'], childEnvironment);
    if (options.prepareOnly) return;

    process.stdout.write(`[local-worker] start local-only Wrangler preview at ${options.ip}:3004\n`);
    await runLongLivedProcess(
      process.execPath,
      buildLocalPreviewArgs(envFilePath, options.ip),
      childEnvironment,
    );
  } finally {
    cleanup();
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runLocalWorker().catch((error) => {
    process.stderr.write(`[local-worker] ${error instanceof Error ? error.message : 'unknown error'}\n`);
    process.exitCode = 1;
  });
}
