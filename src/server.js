import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const app = createApp(path.join(dataDir, 'fiberis.json'), path.join(dataDir, 'import-preview.json'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const response = await app.fetch(request); res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
  }
  const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = path.resolve(publicDir, relative);
  if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' }); fs.createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => console.log(`Fiberis ready: http://127.0.0.1:${port}`));
