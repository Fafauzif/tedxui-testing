import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { PGlite } from '@electric-sql/pglite';
export async function localStore(path = process.env.LOCAL_DATABASE_PATH || '.local/postgres') {
  if (!path.includes('://')) await fs.mkdir(nodePath.dirname(nodePath.resolve(path)), { recursive: true });
  const db = new PGlite(path);
  await db.waitReady;
  await db.exec(`do $$ begin
    if not exists(select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists(select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists(select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  end $$;`);
  await db.exec(await fs.readFile(new URL('../supabase/migrations/001_letters.sql', import.meta.url), 'utf8'));
  await db.exec(await fs.readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
  return { db, async rpc(name, parameters) {
    const keys = Object.keys(parameters);
    const args = keys.map((key, index) => `${key} => $${index + 1}`).join(', ');
    // Only known application functions can be called, never interpolate user input.
    if (!/^ltg_(letter|rotation|community|publish|report)$/.test(name)) throw new Error('Unknown RPC');
    const result = await db.query(`select public.${name}(${args}) as value`, Object.values(parameters));
    return result.rows[0].value;
  } };
}
