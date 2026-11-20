import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { localStore } from '../server/local-store.mjs';
import { withPreviewSamples } from '../server/preview-samples.mjs';

const enabled = { SAMPLE_LETTERS_ENABLED: 'true' };
const preview = { ...enabled, VERCEL: '1', VERCEL_ENV: 'preview' };
const sampleId = 'preview-sample-01-early';
const firstPage = { p_before: null, p_id: '', p_limit: 11 };

test('sample letters require explicit opt-in and never appear on Vercel Production', async () => {
  const store = { rpc: async () => null };
  const letter = { p_id: sampleId, p_session: randomUUID() };
  for (const env of [
    { VERCEL: '1', VERCEL_ENV: 'preview' },
    { VERCEL: '1', VERCEL_ENV: 'preview', SAMPLE_LETTERS_ENABLED: 'false' },
    { ...enabled, VERCEL: '1', VERCEL_ENV: 'production' },
    { ...enabled, VERCEL: '1', VERCEL_ENV: 'development' },
    { ...enabled, VERCEL: '1' },
    enabled,
  ]) {
    assert.equal(await withPreviewSamples(store, env).rpc('ltg_letter', letter), null);
  }
  assert.equal((await withPreviewSamples(store, preview).rpc('ltg_letter', letter)).id, sampleId);
  assert.equal((await withPreviewSamples(store, enabled, { local: true }).rpc('ltg_letter', letter)).id, sampleId);
});

test('five preview fixtures are readable without writes and keep real pagination intact', async t => {
  const database = await localStore('memory://');
  t.after(() => database.db.close());
  const store = withPreviewSamples(database, preview);
  for (let index = 1; index <= 15; index++) {
    const id = `real-post-${String(index).padStart(2, '0')}`;
    const published = await store.rpc('ltg_publish', {
      p_key: randomUUID(), p_fingerprint: id, p_id: id, p_salutation: 'To you,',
      p_body: 'This post uses the database.', p_signoff: 'A writer',
      p_excerpt: 'This post uses the database.', p_actor: id,
    });
    assert.equal(published.letter.id, id);
  }

  const first = await store.rpc('ltg_community', firstPage);
  const samples = first.slice(0, 5);
  assert.equal(samples.length, 5);
  assert.equal(new Set(samples.map(letter => letter.id)).size, 5);
  assert.ok(samples.every(letter => letter.id.startsWith('preview-sample-')));
  for (const sample of samples) {
    assert.deepEqual(await store.rpc('ltg_letter', { p_id: sample.id }), sample);
    assert.equal(await database.rpc('ltg_letter', { p_id: sample.id }), null);
    assert.ok(sample.paragraphs.some(paragraph => paragraph.includes(sample.excerpt)));
  }

  const cursor = first[9];
  const second = await store.rpc('ltg_community', { p_before: cursor.createdAt, p_id: cursor.id, p_limit: 11 });
  const allReal = await database.rpc('ltg_community', { ...firstPage, p_limit: 21 });
  assert.deepEqual([...first.slice(5, 10), ...second], allReal);
  assert.equal((await store.rpc('ltg_rotation', { p_session: randomUUID(), p_exclude: '' })).id.startsWith('preview-sample-'), false);
});
