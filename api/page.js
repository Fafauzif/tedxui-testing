import fs from 'node:fs/promises';
import { renderPage } from '../server/app.mjs';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const html = await fs.readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  res.end(await renderPage(req, html));
}
