import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { normalizeApiUrl } from '../api/handler.js';

const config = JSON.parse(await fs.readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const routes = config.routes;
const filesystem = routes.findIndex(route => route.handle === 'filesystem');

test('dynamic letter HTML runs before static filesystem lookup', () => {
  for (const pathname of ['/', '/index.html']) {
    const index = routes.findIndex(route => route.src && new RegExp(route.src).test(pathname) && route.dest);
    assert.ok(index >= 0 && index < filesystem);
    assert.equal(routes[index].dest, '/api/page');
  }
});

test('explicit API route covers nested letter links and preserves cursors', () => {
  const route = routes.find(route => route.dest?.includes('__ltg_route'));
  for (const pathname of ['/api/letters', '/api/letters/outside-the-feed', '/api/rotation', '/api/community', '/api/reports']) {
    const match = pathname.match(new RegExp(route.src));
    assert.ok(match, pathname);
    const destination = route.dest.replace('$1', match[1]);
    assert.equal(normalizeApiUrl(destination), pathname);
  }
  assert.equal(normalizeApiUrl('/api/handler?__ltg_route=community&cursor=abc123'), '/api/community?cursor=abc123');
  assert.equal(normalizeApiUrl('/api/rotation?exclude=outside-the-feed'), '/api/rotation?exclude=outside-the-feed');
});
