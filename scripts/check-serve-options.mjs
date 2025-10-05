import assert from 'node:assert/strict';
import Path from 'node:path';

import optionsModule from '../bin/src/serve/options.js';

const {
  DEFAULT_API_ROUTE,
  DEFAULT_PORT,
  normalizeServeOptions,
} = optionsModule;

const cwd = process.cwd();

assert.deepEqual(
  normalizeServeOptions({}, cwd),
  {
    dir: cwd,
    port: DEFAULT_PORT,
    apiRoute: DEFAULT_API_ROUTE,
  },
  'defaults should resolve to the current directory, default port, and default static route',
);

assert.deepEqual(
  normalizeServeOptions({ dir: 'public', port: '8080', api: 'assets/' }, cwd),
  {
    dir: Path.resolve(cwd, 'public'),
    port: 8080,
    apiRoute: '/assets',
  },
  'relative dirs, numeric ports, and trailing route slashes should normalize',
);

assert.equal(
  normalizeServeOptions({ port: 8081 }, cwd).port,
  8081,
  'numeric port input should normalize',
);

for (const port of ['', '0', '-1', '70000', '8080abc']) {
  assert.equal(
    normalizeServeOptions({ port }, cwd).port,
    DEFAULT_PORT,
    `invalid port ${JSON.stringify(port)} should fall back to the default`,
  );
}

for (const api of ['api', '/api', '/api/v1', ' api/files ', '/static?x=1', '/static#title']) {
  assert.throws(
    () => normalizeServeOptions({ api }, cwd),
    Error,
    `reserved or non-route alias ${JSON.stringify(api)} should be rejected`,
  );
}

console.log('serve option normalization checks passed');
