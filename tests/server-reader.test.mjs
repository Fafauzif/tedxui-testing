import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { renderPage } from '../server/app.mjs';

const shell = '<!doctype html><html lang="en"><head><title>Letters</title><meta name="description" content="Old"></head><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>';
const featured = {
  id: 'outside-the-feed', origin: 'editorial', salutation: 'To someone with a very familiar feed,',
  paragraphs: ['A friend borrowed my phone.', 'The missing cat came home.'],
  signoff: 'Someone whose desk is still a mess', excerpt: 'The missing cat came home.',
  excerpts: ['The missing cat came home.'], topic: 'Technology', paths: ['curious'], createdAt: '2026-01-01T00:00:00Z',
};
const req = url => ({ url, headers: { host: 'localhost:4173' } });
const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value; } });
function bootstrap(html) {
  const encoded = html.match(/<script id="ltg-reader-bootstrap" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  return encoded ? JSON.parse(encoded) : null;
}

// No WASM database is needed for these HTML/boot regression checks. The
// PostgreSQL suite owns atomic visibility and persistence behavior.
test('root renders the featured letter in HTML and bootstrap with one database request', async () => {
  const calls = [];
  const res = response();
  const html = await renderPage(req('/'), shell, { rpc: async (...args) => { calls.push(args); return featured; } }, res);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'ltg_letter');
  assert.equal(calls[0][1].p_id, 'outside-the-feed');
  assert.ok(calls[0][1].p_session);
  assert.ok(html.includes('<h1 id="letter-heading" tabindex="-1">To someone with a very familiar feed,</h1>'));
  assert.ok(html.includes('<p>A friend borrowed my phone.</p>'));
  assert.deepEqual(bootstrap(html), { version: 1, requestedId: null, letter: featured, error: null });
  assert.match(html, /rel="canonical" href="http:\/\/localhost:4173\/\?letter=outside-the-feed"/);
  assert.match(res.headers['Set-Cookie'], /^ltg_session=/);
  assert.equal(res.headers.Vary, 'Cookie');
  assert.match(res.headers['Server-Timing'], /^reader;dur=\d+\.\d$/);
  assert.ok(!html.includes('Opening a letter'));
});

test('hidden featured letter uses only a current visible rotation result', async () => {
  const replacement = { ...featured, id: 'visible-current-community', origin: 'community', signoff: 'Anonymous' };
  const calls = [];
  const html = await renderPage(req('/'), shell, { rpc: async (name, parameters) => {
    calls.push([name, parameters]);
    return name === 'ltg_letter' ? null : replacement;
  } });
  assert.deepEqual(calls.map(call => call[0]), ['ltg_letter', 'ltg_rotation']);
  assert.equal(calls[1][1].p_exclude, featured.id);
  assert.equal(bootstrap(html).letter.id, replacement.id);
  assert.ok(html.includes('Community letter'));
});

test('exact deep links share their one visible lookup with HTML metadata and boot', async () => {
  const calls = [];
  const html = await renderPage(req('/?letter=outside-the-feed'), shell, { rpc: async (...args) => { calls.push(args); return featured; } });
  assert.equal(calls.length, 1);
  assert.equal(bootstrap(html).requestedId, featured.id);
  assert.equal(bootstrap(html).letter.id, featured.id);
  assert.ok(html.includes(`<title>${featured.salutation} · Letters to Grow</title>`));
  assert.ok(html.includes(`content="${featured.excerpt}"`));
});

test('hidden deep links never choose a replacement or expose stale content', async () => {
  const calls = [];
  const html = await renderPage(req('/?letter=outside-the-feed'), shell, { rpc: async (...args) => { calls.push(args); return null; } });
  assert.equal(calls.length, 1);
  assert.equal(bootstrap(html).error, 'missing');
  assert.equal(bootstrap(html).letter, null);
  assert.ok(html.includes('This letter is unavailable.'));
  assert.ok(!html.includes(featured.paragraphs[0]));
  assert.ok(!html.includes(featured.signoff));
});

test('service failure renders a retry state with no bundled editorial fallback', async () => {
  const calls = [];
  const html = await renderPage(req('/'), shell, { rpc: async (...args) => { calls.push(args); throw new Error('database offline'); } });
  assert.equal(calls.length, 1);
  assert.equal(bootstrap(html).error, 'service');
  assert.equal(bootstrap(html).letter, null);
  assert.ok(html.includes('Letters are taking a moment.'));
  assert.ok(!html.includes(featured.paragraphs[0]));
});

test('empty collection and invalid deep link have distinct bootstrap states', async () => {
  const store = { rpc: async () => null };
  assert.equal(bootstrap(await renderPage(req('/'), shell, store)).error, 'empty');
  assert.equal(bootstrap(await renderPage(req('/?letter='), shell, store)).error, 'missing');
});

test('writer and community HTML avoid reader database work and bootstrap', async () => {
  for (const url of ['/?write', '/?community', '/?write&letter=outside-the-feed']) {
    let calls = 0;
    const html = await renderPage(req(url), shell, { rpc: async () => { calls++; return featured; } });
    assert.equal(calls, 0);
    assert.equal(bootstrap(html), null);
    assert.ok(html.includes('<div id="root"></div>'));
  }
});

test('author text is escaped in markup and inert JSON cannot close its script node', async () => {
  const attack = '</script><script>alert("x")</script><img src=x onerror=alert(1)>&\u2028\u2029';
  const letter = { ...featured, origin: 'community', salutation: attack, paragraphs: [attack], signoff: attack, excerpt: attack, excerpts: [attack], topic: attack };
  const html = await renderPage(req('/?letter=outside-the-feed'), shell, { rpc: async () => letter });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;/script&gt;'));
  assert.equal(bootstrap(html).letter.paragraphs[0], attack);
  const encoded = html.match(/id="ltg-reader-bootstrap" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.ok(!encoded.includes('<'));
  assert.ok(!encoded.includes('&'));
  assert.ok(!encoded.includes('\u2028'));
  assert.ok(encoded.includes('\\u003c'));
});

const bootSource = await fs.readFile(new URL('../src/reader-bootstrap.ts', import.meta.url), 'utf8');
const bootJs = ts.transpile(bootSource, { module: ts.ModuleKind.ESNext });
const { readReaderBootstrap } = await import(`data:text/javascript;base64,${Buffer.from(bootJs).toString('base64')}`);
function mockDocument(value, search = '') {
  globalThis.location = { search };
  globalThis.document = { getElementById: id => id === 'ltg-reader-bootstrap' ? {
    textContent: typeof value === 'string' ? value : JSON.stringify(value),
    getAttribute: () => 'application/json',
  } : null };
}
const validBoot = { version: 1, requestedId: null, letter: featured, error: null };

test('browser boot consumes the server result without a network request', () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('bootstrap must not fetch'); };
  mockDocument(validBoot);
  assert.deepEqual(readReaderBootstrap(), validBoot);
  mockDocument({ version: 1, requestedId: 'missing', letter: null, error: 'missing' }, '?letter=missing');
  assert.equal(readReaderBootstrap().error, 'missing');
  globalThis.fetch = oldFetch;
});

test('browser boot rejects malformed, mismatched or nonreader data', () => {
  for (const [value, search] of [
    ['not json', ''],
    [{ ...validBoot, requestedId: 'different' }, ''],
    [{ ...validBoot, letter: null }, ''],
    [{ ...validBoot, letter: { ...featured, paragraphs: [1] } }, ''],
    [{ ...validBoot, requestedId: 'different' }, '?letter=different'],
    [validBoot, '?write'],
    [validBoot, '?community'],
  ]) {
    mockDocument(value, search);
    assert.equal(readReaderBootstrap(), null);
  }
});
