# Vercel build verification

The integrated redesign passed an isolated local build with official Vercel CLI 66.5.0, `@vercel/node` 32.0.0 and `@vercel/static-build` 29.0.0 on November 20, 2026. The build used cached builders, offline dependency installation, empty preview environment values and local placeholder project settings. No account credentials or deployment were used.

The official build ran TypeScript and Vite successfully and reported **zero output-validation problems**. Both emitted functions target `nodejs22.x`. The final rebuild used the latest responsive frontend and card controls. Its source and asset inputs matched the checkout byte for byte after the build.

| Verified output | Result |
| --- | --- |
| Root and `/index.html` | Dynamic page route precedes filesystem lookup |
| Letter publication, nested letter reader, rotation, community and report paths | Explicit API routes precede filesystem lookup |
| Page function packaging | Built `dist/index.html` resolves through the official `filePathMap` |
| Static build | Official mark, still-life artwork, social cover and local reading font present |
| Lazy loading | Separate `ShareBuilder` and `WriteLetter` JavaScript chunks present |

Direct invocation of the emitted functions passed nested letter and community reads, one-request featured-root and deep-link rendering, initial semantic letter HTML, inert bootstrap JSON, escaped metadata and canonical links, no-store responses, session cookies and server timing. Writer entry performed zero reader database requests. Hidden-letter checks returned API 404 and bootstrap `missing` with no letter text. An outage returned API 503 and bootstrap `service` with no letter text.

Those emitted-function invocations used synthetic Supabase RPC responses. Actual PostgreSQL visibility, publication retries, removal and persistence were tested separately. All 28 tracked checks and `npm run check` passed in the integrated source.

Hosted Vercel edge behavior and the project's actual Supabase environment remain release checks. The local build does not establish a hosted deployment. Production deployment still requires the owner's explicit approval.

Vercel. (n.d.). *vercel build*. Retrieved November 20, 2026, from https://vercel.com/docs/cli/build

Vercel. (n.d.). *Static configuration with vercel.json*. Retrieved November 20, 2026, from https://vercel.com/docs/project-configuration/vercel-json
