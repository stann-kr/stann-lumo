import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { selectLocalWorkerEnvironment } from './check-local-server-env.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = new URL(process.env.LOCAL_WORKER_URL ?? 'http://127.0.0.1:3004');

function assertLocalTarget(url) {
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('Local Worker smoke only accepts an HTTP loopback target');
  }
  if (url.port !== '3004') {
    throw new Error('Local Worker smoke only accepts port 3004');
  }
}

async function requestJson(pathname, init) {
  const response = await fetch(new URL(pathname, baseUrl), init);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${pathname} returned a non-JSON response with status ${response.status}`);
  }
  return { response, payload };
}

async function waitForWorker() {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const { response } = await requestJson('/api/auth/session');
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError ?? new Error('Local Worker did not become ready');
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label} expected HTTP ${expected}, received ${response.status}`);
  }
}

async function runSmoke() {
  assertLocalTarget(baseUrl);
  const source = fs.readFileSync(path.join(repositoryRoot, '.dev.vars'), 'utf8');
  const selection = selectLocalWorkerEnvironment(source);
  if (selection.error) throw new Error(selection.error);

  await waitForWorker();

  const predictable = await requestJson('/api/auth/session', {
    headers: { Cookie: 'admin_session=dev-session' },
  });
  assertStatus(predictable.response, 200, 'predictable cookie check');
  if (predictable.payload?.data?.authenticated !== false) {
    throw new Error('Former predictable development cookie was accepted');
  }
  process.stdout.write('[local-worker-smoke] predictable cookie rejected PASS\n');

  const login = await requestJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: selection.values.ADMIN_PASSWORD }),
  });
  assertStatus(login.response, 200, 'login');
  const setCookie = login.response.headers.get('set-cookie');
  const sessionCookie = setCookie?.split(';', 1)[0];
  if (!sessionCookie?.startsWith('admin_session=')) throw new Error('Login did not issue a session cookie');

  const authenticated = await requestJson('/api/auth/session', {
    headers: { Cookie: sessionCookie },
  });
  assertStatus(authenticated.response, 200, 'session validation');
  if (authenticated.payload?.data?.authenticated !== true) throw new Error('Issued session was not accepted');
  process.stdout.write('[local-worker-smoke] login and D1 session PASS\n');

  const migration = await requestJson('/api/admin/migrate', {
    method: 'POST',
    headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assertStatus(migration.response, 403, 'migration endpoint gate');
  process.stdout.write('[local-worker-smoke] migration endpoint disabled PASS\n');

  const initial = await requestJson('/api/admin/tracks?lang=en', {
    headers: { Cookie: sessionCookie },
  });
  assertStatus(initial.response, 200, 'initial tracks read');
  if (!Array.isArray(initial.payload?.data)) throw new Error('Initial tracks response is invalid');
  const originalItems = initial.payload.data;
  const smokeId = `wp0-local-worker-smoke-${crypto.randomUUID()}`;
  const smokeItem = {
    id: smokeId,
    title: 'LOCAL WORKER SMOKE',
    type: 'TEST',
    duration: '0:01',
    year: '2026',
    platform: 'LOCAL',
    link: '',
  };
  const smokeItems = [...originalItems.filter((item) => item.id !== smokeId), smokeItem];
  let mutationAttempted = false;

  try {
    mutationAttempted = true;
    const write = await requestJson('/api/admin/tracks', {
      method: 'PUT',
      headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
      // `base` is the list this write starts from; the server refuses the write with 409 when the stored list differs.
      body: JSON.stringify({ lang: 'en', items: smokeItems, base: originalItems }),
    });
    assertStatus(write.response, 200, 'local D1 write');

    const readBack = await requestJson('/api/admin/tracks?lang=en', {
      headers: { Cookie: sessionCookie },
    });
    assertStatus(readBack.response, 200, 'local D1 read-back');
    if (!readBack.payload?.data?.some((item) => item.id === smokeId)) {
      throw new Error('Local D1 mutation was not observable');
    }
    process.stdout.write('[local-worker-smoke] isolated D1 CRUD PASS\n');
  } finally {
    if (mutationAttempted) {
      // The write may or may not have landed, so restore from the list that is stored now.
      const current = await requestJson('/api/admin/tracks?lang=en', {
        headers: { Cookie: sessionCookie },
      });
      assertStatus(current.response, 200, 'pre-restore tracks read');
      const restore = await requestJson('/api/admin/tracks', {
        method: 'PUT',
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: 'en', items: originalItems, base: current.payload?.data }),
      });
      assertStatus(restore.response, 200, 'local D1 restore');

      const restored = await requestJson('/api/admin/tracks?lang=en', {
        headers: { Cookie: sessionCookie },
      });
      assertStatus(restored.response, 200, 'restored local D1 read');
      if (restored.payload?.data?.some((item) => item.id === smokeId)) {
        throw new Error('Local D1 smoke record was not removed');
      }
    }
  }

  const logout = await requestJson('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  assertStatus(logout.response, 200, 'logout');
  const loggedOut = await requestJson('/api/auth/session', {
    headers: { Cookie: sessionCookie },
  });
  assertStatus(loggedOut.response, 200, 'logged-out session validation');
  if (loggedOut.payload?.data?.authenticated !== false) throw new Error('Logged-out session remained valid');
  process.stdout.write('[local-worker-smoke] logout invalidation PASS\n');
}

runSmoke().catch((error) => {
  process.stderr.write(`[local-worker-smoke] ${error instanceof Error ? error.message : 'unknown error'}\n`);
  process.exitCode = 1;
});
