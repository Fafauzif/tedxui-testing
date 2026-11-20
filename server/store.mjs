/** Production uses only server-side Supabase RPCs. Local uses the same PostgreSQL SQL. */
import { withPreviewSamples } from './preview-samples.mjs';

export function supabaseStore() {
  return withPreviewSamples({
    async rpc(name, parameters) {
      const base = process.env.SUPABASE_URL;
      const secretKey = process.env.SUPABASE_SECRET_KEY;
      const key = secretKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!base || !key) throw new Error('Database is not configured');
      const headers = { apikey: key, 'Content-Type': 'application/json' };
      // Opaque Supabase secret keys go in apikey. The legacy key is a JWT.
      if (!secretKey) headers.Authorization = `Bearer ${key}`;
      const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parameters), signal: AbortSignal.timeout(10000), cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Database RPC failed (${response.status})`);
      return response.json();
    },
  });
}
