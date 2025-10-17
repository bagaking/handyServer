import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import Path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const tempRoot = mkdtempSync(Path.join(tmpdir(), 'hserve-behavior-'));
const fileTarget = Path.join(tempRoot, 'not-a-dir.txt');
const staticDir = Path.join(tempRoot, 'static');
const staticRoute = 'assets';
writeFileSync(fileTarget, 'plain file target');
mkdirSync(staticDir);
writeFileSync(Path.join(staticDir, 'ok.txt'), 'ok-static');

try {
  await withServer({ dir: staticDir, api: staticRoute }, async (baseUrl) => {
    await assertHealth(baseUrl, 'valid static directory should keep the API route available');
    await assertServed(urlFor(baseUrl, staticRoute, 'ok.txt'), 'ok-static');
  });

  await withServer({ dir: Path.join(tempRoot, 'missing-dir'), api: staticRoute }, async (baseUrl) => {
    await assertHealth(baseUrl, '--dir pointing at a missing directory should keep the API route available');
    await assertNotFound(urlFor(baseUrl, staticRoute, 'not-found.txt'));
  });

  await withServer({ dir: fileTarget, api: staticRoute }, async (baseUrl) => {
    await assertHealth(baseUrl, '--dir pointing at a file should keep the API route available');
    await assertNotFound(urlFor(baseUrl, staticRoute, 'not-a-dir.txt'));
  });

  await withLegacyServer({ dir: staticDir }, async (baseUrl, getOutput) => {
    await assertServed(urlFor(baseUrl, '--info--'), (body) => {
      assert.equal(body.includes('"name":"hserve"'), true, '--info-- should return package metadata');
    });
    assert.equal(
      getOutput().includes('[hserve] request stats'),
      false,
      'request stats should only be logged when --log is enabled',
    );
  });
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log('serve behavior checks passed');

async function withServer(options, runAssertions) {
  const port = await getAvailablePort();
  const child = spawn(
    process.execPath,
    [
      'bin/src/index.js',
      'serve',
      '--dir',
      options.dir,
      '--port',
      String(port),
      '--api',
      options.api,
    ],
    {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let output = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(baseUrl, child, () => output);
    await runAssertions(baseUrl);
  } finally {
    await stopServer(child);
  }
}

async function withLegacyServer(options, runAssertions) {
  const port = await getAvailablePort();
  const child = spawn(
    process.execPath,
    [
      'bin/hserve.js',
      '--dir',
      options.dir,
      '--port',
      String(port),
    ],
    {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let output = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForLegacyInfo(baseUrl, child, () => output);
    await runAssertions(baseUrl, () => output);
  } finally {
    await stopServer(child);
  }
}

async function waitForHealth(baseUrl, child, getOutput) {
  let lastError;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`server exited before becoming ready with code ${child.exitCode}\n${getOutput()}`);
    }

    try {
      const response = await fetchWithTimeout(urlFor(baseUrl, 'api', 'v1', 'health'));
      if (response.status === 200) {
        await response.text();
        return;
      }
      lastError = new Error(`health returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw new Error(`server did not become ready: ${lastError?.message || lastError}\n${getOutput()}`);
}

async function waitForLegacyInfo(baseUrl, child, getOutput) {
  let lastError;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`legacy server exited before becoming ready with code ${child.exitCode}\n${getOutput()}`);
    }

    try {
      const response = await fetchWithTimeout(urlFor(baseUrl, '--info--'));
      if (response.status === 200) {
        await response.text();
        return;
      }
      lastError = new Error(`info returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw new Error(`legacy server did not become ready: ${lastError?.message || lastError}\n${getOutput()}`);
}

async function assertHealth(baseUrl, message) {
  const response = await fetchWithTimeout(urlFor(baseUrl, 'api', 'v1', 'health'));
  const body = await response.text();

  assert.equal(response.status, 200, message);
  assert.equal(body.includes('runningRequest'), true, 'health response should come from the API controller');
}

async function assertNotFound(url) {
  const response = await fetchWithTimeout(url);
  await response.text();

  assert.equal(response.status, 404, `static request should not be served: ${url}`);
}

async function assertServed(url, expectedBody) {
  const response = await fetchWithTimeout(url);
  const body = await response.text();

  assert.equal(response.status, 200, `static request should be served: ${url}`);
  if (typeof expectedBody === 'function') {
    expectedBody(body);
  } else {
    assert.equal(body, expectedBody, `static response body should match fixture: ${url}`);
  }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function urlFor(baseUrl, ...parts) {
  return new URL(parts.join(String.fromCharCode(47)), baseUrl).toString();
}

async function getAvailablePort() {
  const net = await import('node:net');
  const server = net.createServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const port = address && typeof address === 'object' ? address.port : 0;

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return port;
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  const exited = await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(2000).then(() => false),
  ]);

  if (exited === false && child.exitCode === null) {
    child.kill('SIGKILL');
    await new Promise((resolve) => child.once('exit', resolve));
  }
}
