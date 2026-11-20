import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { supabaseStore } from './store.mjs';

const messages = {
  VALIDATION: 'Check your letter and try again.',
  LETTER_UNAVAILABLE: 'This letter is unavailable.',
  IDEMPOTENCY_CONFLICT: 'This publication attempt belongs to different text. Start a new publication attempt.',
  RATE_LIMITED: 'You have sent several requests. Please try again in an hour.',
  SERVICE_UNAVAILABLE: 'Letters are temporarily unavailable. Please try again.',
};
function fail(res, status, code, message = messages[code]) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: { code, message } }));
}
function json(res, value, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(value));
}
function clean(value) { return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : ''; }
function exactExcerpt(body, excerpt) {
  if (body.includes(excerpt)) return true;
  if (!excerpt.endsWith('…')) return false;
  const passage = excerpt.slice(0, -1);
  const start = body.indexOf(passage);
  if (!passage || start < 0) return false;
  const end = start + passage.length;
  const segments = new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(body);
  const boundary = end === body.length || Array.from(segments).some(part => part.index === end);
  if (!boundary) return false;
  const next = body[end];
  return !next || /\s|[.,!?;:…—–]/u.test(next) || !/\s/u.test(passage);
}
const validKey = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
function fingerprint(value) { return createHash('sha256').update(value).digest('hex'); }
function digest(value) {
  return createHmac('sha256', process.env.REQUEST_HASH_SECRET || localSecret).update(value).digest('hex');
}
// An ephemeral default is sufficient for an isolated local process. Hosted writes
// are disabled until a stable secret is configured.
const localSecret = randomUUID();
export function requestOrigin(req) {
  if (process.env.PUBLIC_ORIGIN) return new URL(process.env.PUBLIC_ORIGIN).origin;
  const host = req.headers.host || 'localhost:4173';
  const scheme = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${scheme}://${host}`;
}
function sessionId(req) {
  const value = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('ltg_session='))?.slice(12);
  if (!value) return randomUUID();
  const [id, signature] = value.split('.');
  const expected = digest(id);
  if (!validKey(id) || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return randomUUID();
  return id;
}
function setSession(res, req, id) {
  res.setHeader('Set-Cookie', `ltg_session=${id}.${digest(id)}; Path=/; HttpOnly; SameSite=Lax${requestOrigin(req).startsWith('https:') ? '; Secure' : ''}`);
}
async function readBody(req) {
  if (req.body !== undefined) {
    const encoded = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(encoded) > 30000) throw new Error('SIZE');
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 30000) throw new Error('SIZE');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
}
function rpcError(res, result) {
  if (!result?.error) return false;
  const code = result.error;
  fail(res, code === 'RATE_LIMITED' ? 429 : code === 'IDEMPOTENCY_CONFLICT' ? 409 : 410, code);
  return true;
}
export async function handleApi(req, res, store = supabaseStore()) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Cookie');
  const url = new URL(req.url, 'http://local');
  const path = url.pathname;
  try {
    if (req.method === 'GET' && path.startsWith('/api/letters/')) {
      const id = decodeURIComponent(path.slice('/api/letters/'.length));
      if (!validId(id)) return fail(res, 404, 'LETTER_UNAVAILABLE');
      const session = sessionId(req);
      const letter = await store.rpc('ltg_letter', { p_id: id, p_session: session });
      if (!letter) return fail(res, 404, 'LETTER_UNAVAILABLE');
      setSession(res, req, session);
      return json(res, { letter });
    }
    if (req.method === 'GET' && path === '/api/rotation') {
      const session = sessionId(req);
      const exclude = url.searchParams.get('exclude') || '';
      const letter = await store.rpc('ltg_rotation', { p_session: session, p_exclude: validId(exclude) ? exclude : '' });
      if (!letter) return fail(res, 404, 'LETTER_UNAVAILABLE');
      setSession(res, req, session);
      return json(res, { letter });
    }
    if (req.method === 'GET' && path === '/api/community') {
      let cursor = null;
      if (url.searchParams.has('cursor')) {
        try {
          const raw = url.searchParams.get('cursor');
          if (raw.length > 500) throw new Error();
          cursor = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
          if (!validId(cursor.id) || !Number.isFinite(Date.parse(cursor.at))) throw new Error();
        } catch { return fail(res, 400, 'VALIDATION', 'This page link is invalid. Refresh Community letters.'); }
      }
      const rows = await store.rpc('ltg_community', { p_before: cursor?.at || null, p_id: cursor?.id || '', p_limit: 11 });
      const letters = rows.slice(0, 10);
      const last = letters.at(-1);
      const nextCursor = rows.length > 10 ? Buffer.from(JSON.stringify({ at: last.createdAt, id: last.id })).toString('base64url') : null;
      return json(res, { letters, nextCursor });
    }
    if (req.method !== 'POST' || !['/api/letters', '/api/reports'].includes(path)) return fail(res, 404, 'LETTER_UNAVAILABLE');
    const origin = req.headers.origin;
    if (origin !== requestOrigin(req)) return fail(res, 403, 'ORIGIN', 'Open this form on the Letters to Grow website.');
    if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return fail(res, 415, 'VALIDATION');
    if (process.env.VERCEL && !process.env.REQUEST_HASH_SECRET) throw new Error('Stable request secret missing');
    let input;
    try { input = await readBody(req); } catch { return fail(res, 400, 'VALIDATION'); }
    if (!input || typeof input !== 'object' || !validKey(input.submissionKey)) return fail(res, 422, 'VALIDATION');
    // Vercel overwrites x-vercel-forwarded-for. Local processes ignore forwarded headers.
    const ip = process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() : req.socket?.remoteAddress || 'local';
    const actor = digest(`ip:${ip}`);
    if (path === '/api/letters') {
      if (typeof input.body !== 'string' || (input.to !== undefined && typeof input.to !== 'string') || (input.signature !== undefined && typeof input.signature !== 'string') || typeof input.excerpt !== 'string') return fail(res, 422, 'VALIDATION');
      const normalized = { to: clean(input.to), body: clean(input.body), signature: clean(input.signature), excerpt: clean(input.excerpt) };
      if (normalized.to.length > 100 || normalized.body.length < 1 || normalized.body.length > 5000 || normalized.signature.length > 80 || normalized.excerpt.length < 1 || normalized.excerpt.length > 280 || !exactExcerpt(normalized.body, normalized.excerpt)) return fail(res, 422, 'VALIDATION', 'Use an exact passage of up to 280 characters from your letter for the Story.');
      const result = await store.rpc('ltg_publish', {
        p_key: input.submissionKey, p_fingerprint: fingerprint(JSON.stringify(normalized)), p_id: randomUUID(),
        p_salutation: normalized.to || 'To someone still growing,', p_body: normalized.body,
        p_signoff: normalized.signature || 'Anonymous', p_excerpt: normalized.excerpt, p_actor: actor,
      });
      if (rpcError(res, result)) return;
      return json(res, result, 201);
    }
    const reason = clean(input.reason);
    if (!validId(input.letterId) || reason.length < 3 || reason.length > 500) return fail(res, 422, 'VALIDATION', 'Please add a reason between 3 and 500 characters.');
    const result = await store.rpc('ltg_report', { p_key: input.submissionKey, p_fingerprint: fingerprint(JSON.stringify([input.letterId, reason])), p_id: randomUUID(), p_letter: input.letterId, p_reason: reason, p_actor: actor });
    if (rpcError(res, result)) return;
    return json(res, result, 201);
  } catch {
    return fail(res, 503, 'SERVICE_UNAVAILABLE');
  }
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function renderPage(req, html, store = supabaseStore()) {
  const url = new URL(req.url, requestOrigin(req));
  const id = url.searchParams.get('letter');
  let title = 'Letters to Grow · Still, We Grow';
  let description = 'Letters about things we’re still figuring out. TEDxUniversitasIndonesia 2027.';
  let canonical = `${requestOrigin(req)}/`;
  if (id) {
    canonical += `?letter=${encodeURIComponent(id)}`;
    try {
      const letter = validId(id) ? await store.rpc('ltg_letter', { p_id: id }) : null;
      if (letter) { title = `${letter.salutation} · Letters to Grow`; description = letter.excerpt; }
      else { title = 'This letter is unavailable · Letters to Grow'; description = 'Read another letter from Letters to Grow.'; }
    } catch { title = 'Letters to Grow'; description = 'Letters are temporarily unavailable. Please try again.'; }
  }
  const escaped = { title: escapeHtml(title), description: escapeHtml(description), canonical: escapeHtml(canonical) };
  const robots = process.env.INDEXING_ENABLED === 'true' ? 'index,follow' : 'noindex,nofollow';
  return html.replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["'](?:description|robots)["'][^>]*>/gi, '')
    .replace('</head>', `<title>${escaped.title}</title><meta name="description" content="${escaped.description}"><meta name="robots" content="${robots}"><link rel="canonical" href="${escaped.canonical}"><meta property="og:title" content="${escaped.title}"><meta property="og:description" content="${escaped.description}"><meta property="og:url" content="${escaped.canonical}"><meta property="og:type" content="website"><meta property="og:image" content="${escapeHtml(requestOrigin(req))}/art/social-cover.png"><meta name="twitter:card" content="summary_large_image"></head>`);
}
