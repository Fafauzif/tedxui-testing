# Run Letters to Grow

The root opens a visible letter. Writers preview and publish, receive a permanent `/?letter=<id>` link, and can share its Story immediately. Community letters lists the same committed collection. A staff member removes a letter through Supabase Dashboard.

## Local working build

Use Node.js 22.12 or later. Run from the source directory.

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:4173`. The first start creates `.local/postgres`, an isolated persistent embedded PostgreSQL database using PGlite. It applies the same SQL migration and non-destructive editorial seed used by Supabase. Publication and reports write actual PostgreSQL rows. Two browsers share the server database. Restarting the server retains those rows.

This local equivalent runs without Supabase or Docker. The hosted transport and Supabase Dashboard require a Supabase project. The local adapter is never imported into the Vercel functions. Development data stays outside the source archive and static build.

For frontend-only editing, `npm run dev` serves Vite, while publication requires the full server. Rebuild and use `npm start` for the complete release. A different port can be supplied with `PORT=4174 npm start`.

Run the backend regression checks with `npm run test:backend`. They use separate temporary databases and do not modify `.local/postgres`.

## Supabase with Vercel

1. Create a separate Supabase project for preview. Do not select the existing live campaign database for synthetic data.
2. In SQL Editor, run `supabase/migrations/001_letters.sql` as the project database owner, then `supabase/seed.sql`. The seed uses `ON CONFLICT DO NOTHING`, so repeated runs preserve edits and hidden status.
3. In Vercel, import a separate copy of the source into a preview project. Set the framework to Vite and use the bundled `vercel.json`. Build with `npm run build` and output `dist`.
4. Configure server environment values `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `REQUEST_HASH_SECRET`. Use the project's server secret key (`sb_secret_…`). For a project that still uses a legacy `service_role` JWT, configure `SUPABASE_SERVICE_ROLE_KEY` instead and leave `SUPABASE_SECRET_KEY` empty. Generate the request secret with `openssl rand -hex 32`. Keep it stable across deployments so reading-session signatures and abuse counters remain consistent. Publication fingerprints are stable SHA-256 values independent of this secret. Never prefix any privileged value with `VITE_`.
5. Set `PUBLIC_ORIGIN` to that environment's HTTPS origin. When using Vercel-generated preview hosts that change per deployment, omit this value so the request host supplies the origin. Leave `VITE_SHARE_ORIGIN` empty for each preview's own exact permalinks. Set it only to a stable, approved origin serving the same database.
6. Leave `INDEXING_ENABLED=false` during review. It controls the server-rendered robots metadata. The browser does not communicate directly with Supabase. All reads and writes use same-origin server routes.
7. After the owner explicitly approves production, prepare the production Supabase schema and seed, configure the production environment, deploy that approved build, then verify the reader, a disposable publication, its permalink, Community letters, report and Dashboard removal. Use `INDEXING_ENABLED=true` for the approved public launch.

A database connection is the only publication dependency. An outage serves the shell, draft editor and retry controls while public reads return a distinct temporary-error response. It never substitutes bundled letters for an unknown visibility state.

## Upgrading an existing installation

This redesign uses the original database schema and seed. For a previously configured Vercel project, keep its current environment variables and database. Deploying a preview in a new project or environment requires values for that environment. Apply the bundled migration and seed only when setting up a fresh database. Use a branch and isolated database for review involving publications.

## Local Supabase alternative

If Docker and Supabase CLI are installed, use `supabase init`, retain the bundled migrations and seed in that project, and run `supabase start`. Apply the same SQL with `supabase db reset --local` in that isolated project. Copy its API URL and server secret key into a local `.env`, add a stable `REQUEST_HASH_SECRET`, and set `PUBLIC_ORIGIN=http://localhost:4173`. `npm start` selects Supabase when `SUPABASE_URL` is present.

The `.env.example` values are placeholders. Do not use the production key on an untrusted computer. Keep preview and production values separate in Vercel's environment settings.

## Publication contract

| Route | Result |
| --- | --- |
| `GET /api/letters/:id` | `{letter}` for a currently visible row, otherwise 404 |
| `GET /api/rotation?exclude=<id>` | `{letter}` from the current visible pool, with repeat avoidance stored server-side behind a compact signed HttpOnly session cookie |
| `GET /api/community?cursor=<cursor>` | `{letters,nextCursor}`, newest first by timestamp and ID |
| `POST /api/letters` | `{to,body,signature,excerpt,submissionKey}` becomes `{letter,visibility:"visible"}` |
| `POST /api/reports` | `{letterId,reason,submissionKey}` becomes `{saved:true}` |

Publication keys and report keys are UUIDs. The client reuses a key and identical normalized payload while a response is uncertain. Concurrent duplicates return one ID. A changed payload returns 409. A hidden publication replay returns 410 and keeps its hidden status. Publication is limited to five new letters per salted-IP hourly bucket, reports to ten. Idempotent retries do not consume another slot. The database stores short-lived salted counters rather than raw IPs.

All public responses select only reader fields. Private submission fingerprints, report-request keys and full reading-session seen sets live in the `private` schema. Reading sessions expire after seven days of inactivity. Only an opaque signed session ID appears in the browser cookie, so its size does not grow with the collection. RLS is enabled and anonymous/authenticated direct access is revoked. Server-only security-definer functions have a pinned empty search path and explicit service-role execution grants. Public letter content is plain text. Dynamic metadata is HTML escaped and looked up with current visibility on every response.

## Application rollback and data recovery

To roll back the application, redeploy a previously approved Vercel build with the same database environment. Keep the additive schema and current letters. A frontend rollback must never reset or reseed away community submissions.

Before a production schema change, create an appropriate database backup using Supabase's available backup facilities or a `pg_dump` from a secured owner connection. Back up both `public` and `private` application schemas so publication keys and letters remain consistent. Restore first into a separate project, verify visibility and retries there, then plan the owner-approved production recovery. Restoring a backup rewinds data and is a different action from reverting the frontend.

## Technical references

Supabase. (n.d.). *Database functions*. Retrieved November 20, 2026, from https://supabase.com/docs/guides/database/functions

Supabase. (n.d.). *Migrating to publishable and secret API keys*. Retrieved November 20, 2026, from https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys

Supabase. (n.d.). *Row level security*. Retrieved November 20, 2026, from https://supabase.com/docs/guides/database/postgres/row-level-security

Vercel. (n.d.). *Static configuration with vercel.json*. Retrieved November 20, 2026, from https://vercel.com/docs/project-configuration/vercel-json

Vercel. (n.d.). *Using the Node.js runtime with Vercel Functions*. Retrieved November 20, 2026, from https://vercel.com/docs/functions/runtimes/node-js

## Synthetic community fixture

For a repeatable local community example, stop the server, run `node scripts/local-fixtures.mjs`, then restart `npm start`. The script refuses Supabase and Vercel environments and writes only to the local embedded database. Its example is **To someone taking their time,**, signed **A slow beginner**, ID `d86a557e-50b5-44c2-a50c-85139e458de3`. It is synthetic review content, not an audience submission. Do not import it into the production project.
