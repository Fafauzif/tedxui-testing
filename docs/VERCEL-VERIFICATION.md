# Vercel build and route verification

Checked locally on November 20, 2026 with the official Vercel CLI 66.5.0, `@vercel/node` 32.0.0 and `@vercel/static-build` 29.0.0. The check used a separate temporary source copy with local-only placeholder project settings. It used no account credential and created no deployment or public preview.

The official builder completed successfully and reported zero output-validation problems. Its emitted function runtime is `nodejs22.x`.

The initial builder output exposed two defects that were corrected before delivery. Plain Vite functions treated `api/[...path].js` as one dynamic segment, so it did not match `/api/letters/<id>`. Also, normal rewrites appeared after the filesystem lookup, which allowed the existing static index to bypass dynamic letter metadata. The release now uses explicit routes before filesystem lookup and one conventional `api/handler.js` wrapper.

The emitted configuration applies security headers first, routes dynamic content next, and looks up static files afterward.

| Incoming path | Destination before filesystem lookup |
| --- | --- |
| `/` | `/api/page` |
| `/index.html` | `/api/page` |
| `/api/letters` and `/api/letters/<id>` | `/api/handler` with captured route |
| `/api/rotation` | `/api/handler` with captured route |
| `/api/community` | `/api/handler` with captured route |
| `/api/reports` | `/api/handler` with captured route |

Unknown API paths return 404 after filesystem lookup.

`api/page.js` includes the built `dist/index.html` through the official function `filePathMap`. The referenced source exists after the frontend build. Local invocation materialized that map in the same function-relative location before running the emitted handler.

The emitted functions passed nested letter read, community read, dynamically escaped letter HTML, canonical permalink, no-store response, hidden-letter 404, hidden metadata and outage 503 checks. Those invocations used a synthetic Supabase transport response. The database behavior is covered separately by the PostgreSQL regression suite.

The tracked regression command is

```sh
node --test tests/vercel-routing.test.mjs
```

It verifies route order, the nested letter path and preservation of cursor and exclusion queries. Both checks passed.

Hosted edge routing, actual project environment values and the hosted Supabase service remain account-dependent release checks. A local builder and emitted-function invocation do not demonstrate a deployed edge or database integration. Run those checks in the approved environment before the owner authorizes production.

Vercel. (n.d.). *vercel build*. Retrieved November 20, 2026, from https://vercel.com/docs/cli/build

Vercel. (n.d.). *Static configuration with vercel.json*. Retrieved November 20, 2026, from https://vercel.com/docs/project-configuration/vercel-json
