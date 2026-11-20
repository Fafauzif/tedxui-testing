# Release review

Open a letter, choose **Share to Story**, and save an image with its exact words and byline. Write a letter, preview the words and Story line, and choose **Publish letter**. The same permalink opens in a second browser and the letter appears in **Community letters**. A report reaches the staff queue, and changing visibility in PostgreSQL removes the letter from public reads.

## Review files

The images in `review/` come from Chromium running the built site with isolated PostgreSQL. Desktop captures use a 1,440 px viewport. The mobile captures use a 390 × 844 CSS px viewport with touch emulation.

| File | Surface |
| --- | --- |
| `desktop-reader.png`, `mobile-reader.png` | Original editorial letter at `/?letter=outside-the-feed` |
| `desktop-story.png`, `mobile-story.png` | The actual Story preview, exact excerpt selection and sharing actions |
| `mobile-writer.png`, `mobile-writer-preview.png` | Restored saved draft, the public preview and the publication disclosure |
| `mobile-publication.png`, `desktop-community.png` | Confirmed publication and the entry as seen from a second browser session |
| `story-editorial.png` | Real 1,080 × 1,920 export from **Outside the Feed** |
| `story-community.png` | Real 1,080 × 1,920 export from the synthetic **To someone taking their time,** letter |
| `firefox-reader-320.png`, `firefox-sharing-fallback.png` | Firefox narrow reader and the selectable permalink after clipboard access is denied |

The signed community letter, **A slow beginner**, was written for this release review. The screenshots record its publication through the public writer into an isolated database. The bundled SQL seed contains the original editorial letters. The setup guide includes a separate local-only community fixture for repeatable review.

## What was verified

- TypeScript, Vite production build, source snapshot identity, and all 12 editorial IDs, paragraphs, bylines and curated excerpts.
- Chromium opened a letter at the root, replaced history with its permanent URL, and retained the URL when revisiting the tab. Back, Forward and Read another worked. A delayed rotation request could not interrupt writing after navigation.
- At 390 px, the opening paragraph appeared above the fold. At 320 px, the tested reader did not overflow horizontally. The mobile context requested reduced motion. Escape closed the Story dialog and returned focus to its trigger.
- Firefox 153 passed the reader and Story checks at 320, 390 and 1,440 CSS px. The narrow masthead was adjusted after Firefox exposed an overlap at 320 px. Downloaded PNGs matched their preview bytes. The exact link remained selectable after clipboard denial, and the unsupported share path downloaded the PNG.
- Chromium's native 200% zoom produced a 681 CSS px viewport. The reader and writer used 674 CSS px without horizontal overflow. The open Story dialog scrolled vertically and its scroll width matched its 625 CSS px client width. Its image and save action were available.
- Editorial and community Story downloads were actual PNGs with IHDR dimensions of 1,080 × 1,920. Their SHA-256 hashes matched the corresponding preview blobs. Clipboard readback matched the exact editorial permalink. A simulated native share handler received the same File bytes and verified cancellation. The unsupported-share path saved the PNG.
- Draft save and reload restored the writer’s words. A test committed a publication and interrupted the response. Retry used the same key, returned one permanent link and left one visible row. The next reader session opened it, found it in Community letters and saved a report.
- Eighteen backend and configuration tests passed. They covered durable persistence, concurrent duplicate publication, hidden-letter replay, fresh rotation visibility and repeat avoidance past 80 letters, reports and limits, cursor paging, anonymous permission denial, escaped metadata, service failure, non-destructive seed reapplication, Vercel route order and both Supabase key formats.
- The Supabase adapter also passed a separate end-to-end run against official PostgreSQL 17.11 and PostgREST 16.5 binaries on loopback. It applied the migration and 12 seeds, rejected an anonymous RPC, read an editorial letter, published and replayed the same request concurrently, returned the letter in Community, saved a report, and removed the letter and its public metadata after an owner status change. A local HTTP adapter forwarded the `/rest/v1` path and the test service-role JWT to PostgREST. The opaque secret-key branch was verified separately at the HTTP request boundary.
- The official Vercel build caught a nested-route and metadata precedence problem. Both were fixed. The corrected output passed validation and its emitted functions passed isolated checks. See [Vercel verification](VERCEL-VERIFICATION.md).
- Independent review found issues in navigation, focus, publication recovery and database rotation. The release includes the resulting fixes.

## Release verification still open

Hosted Vercel routing, the hosted Supabase gateway and the actual Dashboard interaction require access to configured staging projects. This review used isolated local services. The Dashboard workflow and the distinction between a site rollback and a database restore are in the setup and staff documents.

The physical iPhone Safari, Android Chrome and Instagram in-app browser share sheets, save-to-Photos and Story sticker placement could not be observed here. We installed desktop WebKit for an additional engine check, but missing runtime libraries prevented launch. PNG download and link handling were tested in Chromium and Firefox.

Production deployment is subject to explicit owner approval.

## Technical references

Mozilla. (n.d.). *Navigator: share() method*. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

Mozilla. (n.d.). *Navigator: canShare() method*. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare

Supabase. (n.d.). *Tables and data*. https://supabase.com/docs/guides/database/tables

Vercel. (n.d.). *Vite on Vercel*. https://vercel.com/docs/frameworks/frontend/vite
