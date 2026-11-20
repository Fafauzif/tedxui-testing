import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { localStore } from '../server/local-store.mjs';
import { handleApi, renderPage } from '../server/app.mjs';

let store, server, origin;
before(async () => {
  store = await localStore('memory://');
  server = http.createServer((req, res) => handleApi(req, res, store));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  await store.db.close();
});
beforeEach(async () => { await store.db.exec('delete from private.request_limits'); });
const body = (extra = {}) => ({ to: 'To the next person,', body: 'I took the longer way home. The flowers were worth it.', signature: 'A neighbour', excerpt: 'The flowers were worth it.', submissionKey: randomUUID(), ...extra });
async function request(route, payload, headers = {}) {
  const response = await fetch(origin + route, payload === undefined ? { headers } : {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: JSON.stringify(payload),
  });
  return { response, data: await response.json() };
}

test('all 12 editorial records preserve IDs, full original text and excerpt options', async () => {
  const source = await fs.readFile(new URL('../src/letters.ts', import.meta.url), 'utf8');
  const ts = await import('typescript');
  const code = ts.default.transpile(source, { module: ts.default.ModuleKind.ESNext });
  const { letters } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  assert.equal(letters.length, 12);
  for (const original of letters) {
    const { data, response } = await request(`/api/letters/${original.id}`);
    assert.equal(response.status, 200);
    const { origin: kind, createdAt, ...value } = data.letter;
    assert.deepEqual(value, original);
    assert.equal(kind, 'editorial');
    assert.ok(createdAt);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});

test('publication is atomic and duplicate concurrent retries return one permanent ID', async () => {
  const payload = body();
  const result = await Promise.all([request('/api/letters', payload), request('/api/letters', payload)]);
  assert.ok(result.every(value => value.response.status === 201));
  const id = result[0].data.letter.id;
  assert.equal(result[1].data.letter.id, id);
  assert.equal(result[0].data.letter.origin, 'community');
  assert.equal((await store.db.query('select count(*)::int as count from public.letters where id = $1', [id])).rows[0].count, 1);
  const direct = await request(`/api/letters/${id}`);
  assert.equal(direct.data.letter.excerpt, payload.excerpt);
  assert.equal((await request('/api/community')).data.letters[0].id, id);
});

test('changed retry conflicts, hidden replay never republishes, and hidden text leaves every public read', async () => {
  const payload = body({ to: 'Secret only while visible' });
  const first = await request('/api/letters', payload);
  const id = first.data.letter.id;
  assert.equal((await request('/api/letters', { ...payload, signature: 'changed' })).response.status, 409);
  await store.db.query("update public.letters set status = 'hidden' where id = $1", [id]);
  const replay = await request('/api/letters', payload);
  assert.equal(replay.response.status, 410);
  assert.equal(replay.data.error.code, 'LETTER_UNAVAILABLE');
  assert.equal((await request(`/api/letters/${id}`)).response.status, 404);
  assert.ok(!(await request('/api/community')).data.letters.some(value => value.id === id));
  for (let i = 0; i < 15; i++) assert.notEqual((await request('/api/rotation')).data.letter.id, id);
  const html = await renderPage({ url: `/?letter=${id}`, headers: { host: 'localhost:4173' } }, '<html><head><title>Old</title></head></html>', store);
  assert.ok(!html.includes(payload.to));
  assert.match(html, /This letter is unavailable/);
});

test('rate limits are atomic and rejected writes do not reserve submission keys or insert letters', async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => request('/api/letters', body())));
  assert.equal(results.filter(r => r.response.status === 201).length, 5);
  assert.equal(results.filter(r => r.response.status === 429).length, 3);
  assert.equal((await store.db.query("select count(*)::int as count from private.request_limits where bucket = 'publish'")).rows[0].count, 1);
});

test('invalid, oversized and cross-origin writes do not publish', async () => {
  assert.equal((await request('/api/letters', body({ excerpt: 'invented quote' }))).response.status, 422);
  assert.equal((await request('/api/letters', body({ body: 'a'.repeat(5001) }))).response.status, 422);
  assert.equal((await request('/api/letters', body(), { Origin: 'https://foreign.example' })).response.status, 403);
  assert.equal((await request('/api/letters', body({ submissionKey: 'wrong' }))).response.status, 422);
  assert.equal((await request('/api/letters', body({ body: 'a'.repeat(35000) }))).response.status, 400);
});

test('report retry is deduplicated, dashboard owns resolution, and editorial reports are rejected', async () => {
  const published = await request('/api/letters', body());
  const payload = { letterId: published.data.letter.id, reason: 'Contains personal information', submissionKey: randomUUID() };
  assert.equal((await request('/api/reports', payload)).data.saved, true);
  assert.equal((await request('/api/reports', payload)).data.saved, true);
  const report = await store.db.query('select * from public.letter_reports where letter_id = $1', [payload.letterId]);
  assert.equal(report.rows.length, 1);
  assert.equal(report.rows[0].status, 'open');
  assert.equal((await request('/api/reports', { ...payload, letterId: 'outside-the-feed', submissionKey: randomUUID() })).response.status, 410);
});

test('community cursor orders equal timestamps by ID and has no missing or duplicate rows', async () => {
  await store.db.exec("delete from public.letter_reports; delete from public.letters where origin = 'community';");
  for (let index = 0; index < 23; index++) await store.db.query("insert into public.letters(id,origin,salutation,paragraphs,signoff,excerpt,created_at) values($1,'community','To you,',array['A page'],'Anonymous','A page','2026-02-01T00:00:00Z')", [`page-${String(index).padStart(2, '0')}`]);
  const ids = [];
  let cursor = null;
  do {
    const { data } = await request('/api/community' + (cursor ? `?cursor=${cursor}` : ''));
    ids.push(...data.letters.map(l => l.id));
    cursor = data.nextCursor;
  } while (cursor);
  assert.equal(ids.length, 23);
  assert.equal(new Set(ids).size, 23);
  assert.equal(ids[0], 'page-22');
  assert.equal(ids.at(-1), 'page-00');
  assert.equal((await request('/api/community?cursor=invalid')).response.status, 400);
});

test('rotation avoids repeats through the signed session cookie and includes fresh commits', async () => {
  const visited = new Set();
  let cookie = '';
  for (let i = 0; i < 12; i++) {
    const { data, response } = await request('/api/rotation', undefined, { Cookie: cookie });
    assert.ok(!visited.has(data.letter.id));
    visited.add(data.letter.id);
    cookie = response.headers.get('set-cookie').split(';')[0];
  }
  const fresh = await request('/api/letters', body());
  let found = false;
  for (let i = 0; i < 40; i++) {
    const result = await request('/api/rotation', undefined, { Cookie: cookie });
    if (result.data.letter.id === fresh.data.letter.id) found = true;
    cookie = result.response.headers.get('set-cookie').split(';')[0];
  }
  assert.equal(found, true);
});

test('rotation retains full repeat avoidance beyond 80 letters with a compact opaque cookie', async () => {
  await store.db.exec(`insert into public.letters(id,origin,salutation,paragraphs,signoff,excerpt)
    select 'bulk-' || n,'community','To you,',array['A letter'],'Anonymous','A letter'
    from generate_series(1,100) n on conflict(id) do nothing`);
  const visited = new Set();
  let cookie = '';
  for (let index = 0; index < 100; index++) {
    const { data, response } = await request('/api/rotation', undefined, { Cookie: cookie });
    assert.ok(!visited.has(data.letter.id));
    visited.add(data.letter.id);
    cookie = response.headers.get('set-cookie').split(';')[0];
    assert.ok(cookie.length < 200);
  }
  assert.equal(visited.size, 100);
});

test('shortened exact excerpts accept word or exceptional token boundaries and preserve graphemes', async () => {
  const token = 'x'.repeat(600);
  assert.equal((await request('/api/letters', body({ body: token, excerpt: token.slice(0,179) + '…' }))).response.status, 201);
  assert.equal((await request('/api/letters', body({ body: 'Some words are still being written.', excerpt: 'Some words…' }))).response.status, 201);
  assert.equal((await request('/api/letters', body({ body: 'Some words are still being written.', excerpt: 'Some wor…' }))).response.status, 422);
  const families = '👩‍👩‍👧‍👧'.repeat(50);
  assert.equal((await request('/api/letters', body({ body: families, excerpt: families.slice(0,3) + '…' }))).response.status, 422);
});

test('anon cannot read tables, reports, private metadata or execute server RPCs', async () => {
  await store.db.exec('set role anon');
  for (const sql of ['select * from public.letters', 'select * from public.letter_reports', 'select * from private.submissions', "select public.ltg_letter('outside-the-feed')"]) {
    await assert.rejects(store.db.query(sql), /permission denied/);
  }
  await store.db.exec('reset role');
});

test('metadata escapes hostile text and exposes no bundled fallback during outage', async () => {
  const payload = body({ to: '\"><script>alert(1)</script>', body: 'An exact <script> quote. & Friends.', excerpt: 'An exact <script> quote.' });
  const result = await request('/api/letters', payload);
  const req = { url: `/?letter=${result.data.letter.id}`, headers: { host: 'localhost:4173' } };
  const shell = '<html><head><title>Old</title><meta name="description" content="Old"></head></html>';
  const html = await renderPage(req, shell, store);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  const outage = await renderPage(req, shell, { rpc() { throw new Error('offline'); } });
  assert.ok(!outage.includes(payload.excerpt));
  assert.ok(outage.includes('temporarily unavailable'));
  const outageServer = http.createServer((req, res) => handleApi(req, res, { rpc() { throw new Error('offline'); } }));
  await new Promise(resolve => outageServer.listen(0, '127.0.0.1', resolve));
  const response = await fetch(`http://127.0.0.1:${outageServer.address().port}/api/letters/outside-the-feed`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'SERVICE_UNAVAILABLE');
  await new Promise(resolve => outageServer.close(resolve));
});

test('reapplying seed preserves dashboard edits and hidden editorial status', async () => {
  await store.db.query("update public.letters set status = 'hidden', salutation = 'Dashboard edited' where id = 'the-old-staircase'");
  await store.db.exec(await fs.readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
  assert.equal(await store.rpc('ltg_letter', { p_id: 'the-old-staircase' }), null);
  const row = (await store.db.query("select salutation, status from public.letters where id = 'the-old-staircase'")).rows[0];
  assert.deepEqual(row, { salutation: 'Dashboard edited', status: 'hidden' });
  await assert.rejects(store.db.query("update public.letters set id = 'replaced' where id = 'the-old-staircase'"), /immutable/);
});

test('committed letters persist after closing and reopening an isolated PostgreSQL database', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ltg-persistence-'));
  const dbPath = path.join(dir, 'postgres');
  let persisted = await localStore(dbPath);
  const id = randomUUID();
  const result = await persisted.rpc('ltg_publish', { p_key: randomUUID(), p_fingerprint: 'persistent-fixture', p_id: id, p_salutation: 'To tomorrow,', p_body: 'I will keep going.', p_signoff: 'Synthetic test', p_excerpt: 'I will keep going.', p_actor: 'isolated' });
  assert.equal(result.letter.id, id);
  await persisted.db.close();
  persisted = await localStore(dbPath);
  assert.equal((await persisted.rpc('ltg_letter', { p_id: id })).signoff, 'Synthetic test');
  await persisted.db.close();
  await fs.rm(dir, { recursive: true, force: true });
});
