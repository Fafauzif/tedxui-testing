import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { handleApi, renderPage } from './app.mjs';
import { localStore } from './local-store.mjs';
import { supabaseStore } from './store.mjs';

const root = path.resolve('dist');
const store = process.env.SUPABASE_URL ? supabaseStore() : await localStore();
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://local');
    if (url.pathname.startsWith('/api/')) return handleApi(req, res, store);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(await renderPage(req, await fs.readFile(path.join(root, 'index.html'), 'utf8'), store, res));
      return;
    }
    const filename = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!filename.startsWith(`${root}/`)) { res.statusCode = 404; res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    res.end(await fs.readFile(filename));
  } catch { res.statusCode = 404; res.end('File unavailable'); }
});
server.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log(`Letters to Grow at http://localhost:${process.env.PORT || 4173} (${process.env.SUPABASE_URL ? 'Supabase' : 'isolated persistent PostgreSQL'})`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { if (store.db) await store.db.close(); process.exit(); }));
