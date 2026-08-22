import crypto from 'node:crypto';
import fs from 'node:fs';
import nodePath from 'node:path';

const seed = {
  users: [
    { id: 1, username: 'admin', role: 'ADMIN' },
    { id: 2, username: 'operator', role: 'OPERATOR' },
    { id: 3, username: 'viewer', role: 'VIEWER' },
  ],
  devices: [
    { id: 1, code: 'DEV-ALPHA', name: 'Alpha POP', location: 'Jakarta', status: 'ONLINE' },
    { id: 2, code: 'DEV-BETA', name: 'Beta POP', location: 'Bekasi', status: 'ONLINE' },
    { id: 3, code: 'DEV-GAMMA', name: 'Gamma POP', location: 'Cikarang', status: 'DEGRADED' },
    { id: 4, code: 'DEV-DELTA', name: 'Delta POP', location: 'Karawang', status: 'ONLINE' },
  ],
  cables: [
    { id: 1, code: 'FO-JKT-BKS', name: 'Jakarta — Bekasi', capacity: 4, status: 'ACTIVE' },
    { id: 2, code: 'FO-BKS-CKR', name: 'Bekasi — Cikarang', capacity: 4, status: 'ACTIVE' },
  ],
  routes: [
    { id: 1, code: 'RTE-ALPHA-GAMMA', name: 'Alpha → Gamma', source: 1, target: 3, status: 'ACTIVE', cableIds: [1, 2] },
    { id: 2, code: 'RTE-BETA-DELTA', name: 'Beta → Delta', source: 2, target: 4, status: 'PROTECTION', cableIds: [1] },
  ],
  cores: [
    { id: 1, cableId: 1, number: 1, status: 'IN_USE' }, { id: 2, cableId: 1, number: 2, status: 'IN_USE' },
    { id: 3, cableId: 1, number: 3, status: 'IN_USE' }, { id: 4, cableId: 1, number: 4, status: 'AVAILABLE' },
    { id: 5, cableId: 2, number: 1, status: 'IN_USE' }, { id: 6, cableId: 2, number: 2, status: 'AVAILABLE' },
    { id: 7, cableId: 2, number: 3, status: 'AVAILABLE' }, { id: 8, cableId: 2, number: 4, status: 'FAULTY' },
  ],
  assignments: [{ id: 1, routeId: 1, coreId: 1, sourceDeviceId: 1, targetDeviceId: 3, status: 'ACTIVE', version: 1 }],
  incidents: [{ id: 1, reporterId: 2, type: 'FO_CUT', summary: 'Planned synthetic drill — west segment', status: 'OPEN', resourceType: 'cable', resourceId: 1, createdAt: '2026-08-22T08:30:00Z' }],
  history: [],
};

const clone = value => structuredClone(value);
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
const parseBody = async request => { try { return await request.json(); } catch { return {}; } };
const id = () => crypto.randomUUID();
const demoPassword = username => process.env[`FIBERIS_${username.toUpperCase()}_PASSWORD`];
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function validPassword(password, stored) {
  const [, salt, expected] = stored.split('$');
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}

export function createApp(file = ':memory:', previewFile = null) {
  let db = clone(seed);
  if (file !== ':memory:' && fs.existsSync(file)) db = JSON.parse(fs.readFileSync(file, 'utf8'));
  const persist = () => { if (file !== ':memory:') fs.writeFileSync(file, JSON.stringify(db, null, 2)); };
  for (const user of db.users) {
    if (!user.passwordHash) {
      const password = user.password || demoPassword(user.username);
      if (!password) throw new Error(`Missing FIBERIS_${user.username.toUpperCase()}_PASSWORD`);
      user.passwordHash = hashPassword(password);
    }
    delete user.password;
  }
  persist();
  const sessions = new Map();

  function auth(request) {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    return sessions.get(token);
  }
  function requireUser(request) { const user = auth(request); return user || json(401, { error: 'AUTH_REQUIRED' }); }
  function requireRole(request, roles) {
    const user = auth(request);
    if (!user) return { response: json(401, { error: 'AUTH_REQUIRED' }) };
    if (!roles.includes(user.role)) return { response: json(403, { error: 'FORBIDDEN' }) };
    return { user };
  }
  function routePath(route) {
    const source = db.devices.find(d => d.id === route.source);
    const target = db.devices.find(d => d.id === route.target);
    const cables = route.cableIds.map(cid => db.cables.find(c => c.id === cid)).filter(Boolean);
    return { route, nodes: [source, ...cables.map(c => ({ id: `cable-${c.id}`, code: c.code, name: c.name, type: 'cable' })), target], edges: cables.map((c, i) => ({ id: `edge-${i}`, label: c.code })), steps: [source?.name, ...cables.map(c => c.name), target?.name].filter(Boolean), warnings: [] };
  }

  return {
    async fetch(request) {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      if (method === 'POST' && path === '/api/login') {
        const body = await parseBody(request);
        const user = db.users.find(u => u.username === body.username && validPassword(body.password || '', u.passwordHash));
        if (!user) return json(401, { error: 'INVALID_CREDENTIALS' });
        const token = id(); sessions.set(token, { id: user.id, username: user.username, role: user.role });
        return json(200, { token, user: { username: user.username, role: user.role } });
      }
      if (path.startsWith('/api/')) {
        const user = auth(request);
        if (!user) return json(401, { error: 'AUTH_REQUIRED' });
        if (method === 'GET' && path === '/api/me') return json(200, { user });
        const mappingFile = previewFile ? nodePath.join(nodePath.dirname(previewFile), 'domain-mapping.json') : null;
        const reviewFile = previewFile ? nodePath.join(nodePath.dirname(previewFile), 'domain-mapping-reviews.json') : null;
        const readMapping = () => mappingFile && fs.existsSync(mappingFile) ? JSON.parse(fs.readFileSync(mappingFile, 'utf8')) : null;
        const readReviews = () => reviewFile && fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile, 'utf8')) : [];
        if (method === 'POST' && path === '/api/domain-mapping/reviews') {
          if (user.role !== 'ADMIN') return json(403, { error: 'FORBIDDEN' });
          const body = await parseBody(request); const mapping = readMapping();
          if (!mapping) return json(404, { error: 'MAPPING_NOT_READY' });
          const candidate = mapping.candidates?.find(x => x.workbook === body.workbook && x.sheet === body.sheet && x.sha256 === body.sha256);
          if (!candidate) return json(409, { error: 'CANDIDATE_OR_HASH_MISMATCH' });
          if (!['AUTHORITATIVE', 'REJECTED', 'REVIEW_REQUIRED'].includes(body.decision)) return json(400, { error: 'INVALID_DECISION' });
          const review = { id: id(), workbook: candidate.workbook, sheet: candidate.sheet, sha256: candidate.sha256, domain: candidate.domain, decision: body.decision, note: String(body.note || '').trim(), actorId: user.id, createdAt: new Date().toISOString() };
          // ponytail: synchronous JSON is single-process only; replace with a database transaction before production.
          const reviews = readReviews().filter(x => !(x.workbook === review.workbook && x.sheet === review.sheet && x.sha256 === review.sha256)); reviews.push(review);
          fs.writeFileSync(reviewFile, JSON.stringify(reviews, null, 2));
          return json(201, review);
        }
        if (method === 'GET' && path === '/api/import-preview') {
          if (!previewFile || !fs.existsSync(previewFile)) return json(404, { error: 'PREVIEW_NOT_READY' });
          const report = JSON.parse(fs.readFileSync(previewFile, 'utf8')); report.domain_mapping = readMapping();
          if (report.domain_mapping) { report.domain_mapping.reviews = readReviews(); report.domain_mapping.approval_enabled = false; }
          report.publish_enabled = false;
          return json(200, report);
        }
        if (method === 'GET' && path === '/api/dashboard') return json(200, { counts: { devices: db.devices.length, routes: db.routes.length, cores: db.cores.length, activeIncidents: db.incidents.filter(i => i.status === 'OPEN').length }, incidents: db.incidents.slice(-8).reverse(), user });
        if (method === 'GET' && path === '/api/search') {
          const q = (url.searchParams.get('q') || '').toLowerCase();
          const all = [...db.devices.map(x => ({ ...x, type: 'device' })), ...db.cables.map(x => ({ ...x, type: 'cable' })), ...db.routes.map(x => ({ ...x, type: 'route' })), ...db.cores.map(x => ({ ...x, type: 'core' }))];
          return json(200, all.filter(x => JSON.stringify(x).toLowerCase().includes(q)).slice(0, 50));
        }
        const routeMatch = path.match(/^\/api\/routes\/(\d+)\/path$/);
        if (method === 'GET' && routeMatch) { const route = db.routes.find(x => x.id === Number(routeMatch[1])); return route ? json(200, routePath(route)) : json(404, { error: 'NOT_FOUND' }); }
        if (method === 'GET' && path === '/api/cores') return json(200, { cores: db.cores.map(c => ({ ...c, cable: db.cables.find(x => x.id === c.cableId)?.code })) });
        if (method === 'GET' && path === '/api/incidents') return json(200, { incidents: db.incidents });
        const incidentMatch = path.match(/^\/api\/incidents\/(\d+)$/);
        if (method === 'PATCH' && incidentMatch) {
          if (!['ADMIN', 'OPERATOR'].includes(user.role)) return json(403, { error: 'FORBIDDEN' });
          const incident = db.incidents.find(x => x.id === Number(incidentMatch[1]));
          if (!incident) return json(404, { error: 'NOT_FOUND' });
          const body = await parseBody(request);
          if (!['OPEN', 'INVESTIGATING', 'RESOLVED'].includes(body.status)) return json(400, { error: 'INVALID_STATUS' });
          if (body.status === 'RESOLVED' && !body.resolution?.trim()) return json(400, { error: 'RESOLUTION_REQUIRED' });
          incident.status = body.status; incident.resolution = body.resolution?.trim() || null; incident.updatedAt = new Date().toISOString();
          db.history.push({ id: id(), type: body.status === 'RESOLVED' ? 'INCIDENT_RESOLVED' : 'INCIDENT_UPDATED', actorId: user.id, incidentId: incident.id, summary: incident.summary, createdAt: incident.updatedAt });
          persist(); return json(200, incident);
        }
        if (method === 'POST' && path === '/api/incidents') {
          if (!['ADMIN', 'OPERATOR'].includes(user.role)) return json(403, { error: 'FORBIDDEN' });
          const body = await parseBody(request); if (!body.type || !body.summary || !body.resourceType || !body.resourceId) return json(400, { error: 'VALIDATION_ERROR' });
          const incident = { id: db.incidents.length + 1, reporterId: user.id, type: body.type, summary: body.summary, status: 'OPEN', resourceType: body.resourceType, resourceId: Number(body.resourceId), createdAt: new Date().toISOString() };
          db.incidents.push(incident); persist(); return json(201, incident);
        }
        const preview = path === '/api/change-overs/preview';
        const commit = path === '/api/change-overs';
        if ((method === 'POST' && preview) || (method === 'POST' && commit)) {
          if (!['ADMIN', 'OPERATOR'].includes(user.role)) return json(403, { error: 'FORBIDDEN' });
          const body = await parseBody(request); const assignment = db.assignments.find(x => x.id === Number(body.assignmentId)); const target = db.cores.find(x => x.id === Number(body.targetCoreId));
          const errors = []; if (!assignment) errors.push({ code: 'ASSIGNMENT_NOT_FOUND' }); if (!target) errors.push({ code: 'CORE_NOT_FOUND' }); if (target && target.status !== 'AVAILABLE') errors.push({ code: 'CORE_NOT_AVAILABLE', status: target.status });
          if (errors.length) return json(409, { errors });
          if (preview) return json(200, { version: assignment.version, current: assignment, target, valid: true });
          if (Number(body.version) !== assignment.version) return json(409, { errors: [{ code: 'STALE_PREVIEW' }] });
          if (!body.reason?.trim()) return json(400, { error: 'REASON_REQUIRED' });
          const old = clone(assignment); const oldCore = db.cores.find(x => x.id === old.coreId); oldCore.status = 'AVAILABLE'; target.status = 'IN_USE'; assignment.coreId = target.id; assignment.version += 1;
          const record = { id: id(), actorId: user.id, assignmentId: assignment.id, oldCoreId: old.coreId, newCoreId: target.id, reason: body.reason, status: 'COMMITTED', createdAt: new Date().toISOString() }; db.history.push(record); persist(); return json(201, record);
        }
        if (method === 'GET' && path === '/api/history') return json(200, { history: db.history.slice().reverse() });
        if (method === 'GET' && path === '/api/export/cores') {
          const rows = db.cores.map(core => `${db.cables.find(x => x.id === core.cableId)?.code || ''},${core.number},${core.status}`);
          return json(200, { filename: 'fiberis-cores.csv', csv: ['cable,core,status', ...rows].join('\n') });
        }
        return json(404, { error: 'NOT_FOUND' });
      }
      return json(404, { error: 'NOT_FOUND' });
    },
  };
}
