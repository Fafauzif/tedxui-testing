# Redesign verification

Start the bundled build with `npm ci` and `npm start`. The default URL is http://localhost:4173. It uses a local PostgreSQL database seeded with the 12 original letters. Review publications in that database use synthetic test content.

## Where to look

| Review file | Content |
| --- | --- |
| `review/desktop-reader.png`, `review/mobile-reader-390.png`, `review/mobile-reader-320.png` | The featured letter in the final layout |
| `review/desktop-share.png`, `review/mobile-share.png` | The working card builder and actual generated preview |
| `review/mobile-writer.png`, `review/mobile-publication.png`, `review/mobile-community.png` | Writer, publication confirmation and resulting Community entry |
| `review/desktop-community.png` | Community empty state on a clean database |
| `review/exports/matrix-contact-sheet.png` | Three formats by three designs |
| `review/exports/story-*.png`, `square-*.png`, `portrait-*.png` | Full-size downloads, including a synthetic community Story |

## Verified behavior

- All 28 backend tests pass. They cover exact editorial texts and IDs, publication and duplicate-retry handling, pagination, reporting, Dashboard-controlled visibility, database permissions and server-rendered behavior.
- The editor’s public preview and publication flow passed in Firefox, and the new entry appeared in Community letters. The reader and editor fit 320 and 390 CSS px. The first paragraph is visible without scrolling at 390 × 844.
- The initial HTML contains the full featured letter. The client reuses that data. Deep links preserve their exact title, excerpt data and canonical URL. A hidden or missing deep link shows the unavailable state. An unavailable featured letter uses a visible replacement.
- The share matrix passed 360 render and text-fidelity checks, including all 36 curated excerpts in every format and design, plus longer signatures and Unicode stress cases. Firefox checks at 320, 390 and 1440 CSS px covered selecting designs and formats, Escape and focus return, clipboard fallback and saving. Downloads and simulated device files matched the exact preview PNG bytes.
- The official Vercel CLI produced a verified Build Output API directory offline. The emitted function was exercised with synthetic Supabase responses. See [Vercel verification](VERCEL-VERIFICATION.md).

## Performance

The controlled 390 px Firefox comparison used the same local PostgreSQL test data and a constrained network profile. Median first readable text on the opening route improved from 3.32 s to 0.41 s. A cold load fell from 886 KB to 145 KB of response bodies. The reader now fetches no separate letter JSON on entry. “Read another” uses one request. The share renderer and card artwork load when the builder opens. These are lab results. See [the measurements](PERFORMANCE.md) for the profile and repeat counts.

## Staging checks

Verify the hosted Vercel and Supabase pairing on an isolated branch before switching the live site. Check the native share sheet, image saving and Instagram link sticker with iPhone and Android devices. The bundled tests used desktop Firefox and a simulated native share API. This redesign was built and tested locally.
