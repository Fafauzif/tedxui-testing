import { handleApi } from '../server/app.mjs';

/** Advanced Vercel routes pass their captured path explicitly. Plain Vite
 * functions do not implement Next.js [...path] catch-all semantics. */
export function normalizeApiUrl(value) {
  const url = new URL(value, 'http://local');
  const routedPath = url.searchParams.get('__ltg_route');
  if (routedPath) url.pathname = `/api/${routedPath}`;
  url.searchParams.delete('__ltg_route');
  return url.pathname + url.search;
}

export default function handler(req, res) {
  req.url = normalizeApiUrl(req.url);
  return handleApi(req, res);
}
