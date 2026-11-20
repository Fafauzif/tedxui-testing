import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supabaseStore } from '../server/store.mjs';

const base = 'https://release-check.example';
const secret = 'sb_secret_test_only';
const legacy = 'legacy-test-jwt';

for (const auth of ['secret', 'legacy']) {
  test(`Supabase RPC uses the ${auth} key's HTTP authentication format`, async (context) => {
    const previous = { ...process.env };
    context.after(() => {
      for (const name of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
        if (previous[name] === undefined) delete process.env[name];
        else process.env[name] = previous[name];
      }
    });

    process.env.SUPABASE_URL = `${base}/`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = legacy;
    if (auth === 'secret') process.env.SUPABASE_SECRET_KEY = secret;
    else delete process.env.SUPABASE_SECRET_KEY;

    const request = context.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.equal(url, `${base}/rest/v1/rpc/ltg_letter`);
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { p_id: 'outside-the-feed' });
      assert.equal(options.headers.apikey, auth === 'secret' ? secret : legacy);
      assert.equal(options.headers.Authorization, auth === 'secret' ? undefined : `Bearer ${legacy}`);
      return new Response(JSON.stringify({ id: 'outside-the-feed' }));
    });

    assert.deepEqual(await supabaseStore().rpc('ltg_letter', { p_id: 'outside-the-feed' }), { id: 'outside-the-feed' });
    assert.equal(request.mock.callCount(), 1);
  });
}
