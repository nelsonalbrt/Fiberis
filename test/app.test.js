import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.FIBERIS_ADMIN_PASSWORD = 'test-admin-password';
process.env.FIBERIS_OPERATOR_PASSWORD = 'test-operator-password';
process.env.FIBERIS_VIEWER_PASSWORD = 'test-viewer-password';

async function api(app, path, options = {}) {
  const response = await app.fetch(new Request(`http://fiberis.test${path}`, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }));
  return { status: response.status, body: await response.json() };
}

async function login(app, username = 'operator', password = 'test-operator-password') {
  const result = await api(app, '/api/login', { method: 'POST', body: { username, password } });
  assert.equal(result.status, 200);
  return { authorization: `Bearer ${result.body.token}` };
}

test('operator can see dashboard seeded with synthetic network data', async () => {
  const app = createApp(':memory:');
  const headers = await login(app);
  const result = await api(app, '/api/dashboard', { headers });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.counts, { devices: 4, routes: 2, cores: 8, activeIncidents: 1 });
});

test('viewer cannot create incident but operator can', async () => {
  const app = createApp(':memory:');
  const viewer = await login(app, 'viewer', 'test-viewer-password');
  const denied = await api(app, '/api/incidents', { method: 'POST', headers: viewer, body: { type: 'FO_CUT', summary: 'Synthetic test', resourceType: 'cable', resourceId: 1 } });
  assert.equal(denied.status, 403);

  const operator = await login(app);
  const created = await api(app, '/api/incidents', { method: 'POST', headers: operator, body: { type: 'CONGESTION', summary: 'Synthetic congestion', resourceType: 'device', resourceId: 1 } });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'OPEN');
});

test('search and path expose synthetic topology', async () => {
  const app = createApp(':memory:');
  const headers = await login(app);
  const search = await api(app, '/api/search?q=Alpha', { headers });
  assert.equal(search.status, 200);
  assert.ok(search.body.some(item => item.type === 'device'));
  const path = await api(app, '/api/routes/1/path', { headers });
  assert.equal(path.status, 200);
  assert.deepEqual(path.body.steps, ['Alpha POP', 'Jakarta — Bekasi', 'Bekasi — Cikarang', 'Gamma POP']);
  assert.equal(path.body.warnings.length, 0);
});

test('change over rejects occupied core and commits available protection atomically', async () => {
  const app = createApp(':memory:');
  const headers = await login(app);
  const occupied = await api(app, '/api/change-overs/preview', { method: 'POST', headers, body: { assignmentId: 1, targetCoreId: 3 } });
  assert.equal(occupied.status, 409);
  assert.equal(occupied.body.errors[0].code, 'CORE_NOT_AVAILABLE');

  const preview = await api(app, '/api/change-overs/preview', { method: 'POST', headers, body: { assignmentId: 1, targetCoreId: 6 } });
  assert.equal(preview.status, 200);
  const committed = await api(app, '/api/change-overs', { method: 'POST', headers, body: { assignmentId: 1, targetCoreId: 6, version: preview.body.version, reason: 'Synthetic FO cut drill' } });
  assert.equal(committed.status, 201);
  assert.equal(committed.body.status, 'COMMITTED');

  const stale = await api(app, '/api/change-overs', { method: 'POST', headers, body: { assignmentId: 1, targetCoreId: 7, version: preview.body.version, reason: 'Stale retry' } });
  assert.equal(stale.status, 409);
});

test('operator can resolve incident and resolution is recorded in history', async () => {
  const app = createApp(':memory:');
  const headers = await login(app);
  const result = await api(app, '/api/incidents/1', { method: 'PATCH', headers, body: { status: 'RESOLVED', resolution: 'Cable restored in synthetic drill' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'RESOLVED');
  assert.equal(result.body.resolution, 'Cable restored in synthetic drill');
  const history = await api(app, '/api/history', { headers });
  assert.ok(history.body.history.some(item => item.type === 'INCIDENT_RESOLVED'));
});

test('operator can export current core inventory as CSV', async () => {
  const app = createApp(':memory:');
  const headers = await login(app);
  const result = await api(app, '/api/export/cores', { headers });
  assert.equal(result.status, 200);
  assert.equal(result.body.filename, 'fiberis-cores.csv');
  assert.match(result.body.csv, /^cable,core,status\n/);
  assert.match(result.body.csv, /FO-JKT-BKS,1,IN_USE/);
});

test('import preview report is readable but cannot be published', async () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tmp-preview.json');
  fs.writeFileSync(file, JSON.stringify({ mode: 'PREVIEW_ONLY', publish_enabled: false, summary: { workbooks: 2, rows: 10, duplicate: 2, blank: 1, review: 7, blocked: 0 }, workbooks: [] }));
  try {
    const app = createApp(':memory:', file);
    const headers = await login(app);
    const report = await api(app, '/api/import-preview', { headers });
    assert.equal(report.status, 200);
    assert.equal(report.body.publish_enabled, false);
    const publish = await api(app, '/api/import-preview/publish', { method: 'POST', headers, body: {} });
    assert.equal(publish.status, 404);
  } finally { fs.rmSync(file, { force: true }); }
});

test('stored passwords are hashed and plaintext login still works', async () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tmp-auth-db.json');
  try {
    const app = createApp(file);
    await login(app);
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.ok(stored.users.every(item => item.passwordHash?.startsWith('scrypt$')));
    assert.ok(stored.users.every(item => !('password' in item)));
  } finally { fs.rmSync(file, { force: true }); }
});

test('browser assets support login transition', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, '../public/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(here, '../public/styles.css'), 'utf8');
  assert.doesNotThrow(() => new Function(source));
  assert.match(css, /\[hidden\]\s*\{\s*display\s*:\s*none\s*!important/);
});

test('browser hides write actions from viewer role', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const html = fs.readFileSync(path.join(here, '../public/index.html'), 'utf8');
  const source = fs.readFileSync(path.join(here, '../public/app.js'), 'utf8');
  assert.match(html, /data-write-action/);
  assert.match(source, /function applyRole/);
  assert.match(source, /user\.role==='VIEWER'/);
});

test('unauthenticated API request is rejected', async () => {
  const app = createApp(':memory:');
  const result = await api(app, '/api/dashboard');
  assert.equal(result.status, 401);
});
