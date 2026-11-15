# Letters to Grow · revision 4

An English campaign proof of concept for **TEDxUniversitasIndonesia 2027**, under **Still, We Grow**. The opening asks “What are you still figuring out?” Four everyday starting points lead to twelve fictional letters. People can also write a private draft and save an excerpt from a demonstration letter as a Story image.

The green botanical direction follows the Instagram references supplied for this project: olive, cream paper, flowing serif type and a few plant cutouts. This is a campaign experience, with no conventional homepage, marketing sections, accounts, database, analytics or submission service.

## Replace the current repository files

Extract the ZIP **inside your existing repository folder** and choose **Replace all**. `package.json`, `index.html`, `src` and `public` must stay at the repository root, not inside a nested folder. Commit/upload the changed files and redeploy Vercel. No deletion step is required; older unused assets may remain. The archive does not replace your Git history, installed dependencies or environment files.

Existing Vercel settings can stay the same. This is source code, so double-clicking `index.html` does not run the app.

## Deploy on Vercel

1. Put the extracted **contents** in the Git repository. Do not upload the ZIP as the only file.
2. Import the repository into Vercel, or redeploy its existing project.
3. Use the **Vite** framework, build command `npm run build` and output directory `dist`. Node.js 22 or 24 is suitable.
4. Deploy. No environment variables or database setup are needed.

## Run locally

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm run preview
```

If a restricted development environment prevents network-interface discovery, use `npx vite --host 127.0.0.1`.

## Read and write

The root URL opens **I’m feeling…**, with these starting points: **Ready to start again**, **A little out of place**, **Stretched thin** and **Curious**. Each of the first three has several relevant letters. Curious and **Read any letter** draw from the full collection. Another-letter draws avoid the current letter and repeats within the active cycle. The short entrance runs once per session and respects reduced motion.

Every letter keeps a stable `?letter=` URL. Shared links and printed QR codes open that exact letter, bypassing the selector. For example, append `?letter=the-old-staircase` to the deployed URL. Existing eight-letter links still work. Browser Back and Forward restore previous routes.

**Write a letter** opens at `?write=1`. It supports editing, previewing and downloading a UTF-8 `.txt` file. Unsaved words remain in memory while navigating within the app. The browser is asked to warn before leaving or refreshing with unsaved changes, but a reload or closed tab can still lose them. **Keep draft on this device** explicitly saves a copy in that browser’s local storage. There is no automatic server save and no public Submit button. A saved copy can be removed without clearing the current text. On a shared device, download the letter and remove its saved copy when finished.

## Save or share an excerpt

**Save a line** offers three curated excerpts from the current letter and creates a real **1080 × 1920 PNG** locally. The preview shows the actual image to be exported.

- **Share image** opens native file sharing when the browser reports support. The available apps depend on the device. Unsupported or failed native sharing falls back to an image download; cancelling the share menu does not download anything.
- **Save image** downloads the PNG. To post it on Instagram, add the saved image to a Story, then use **Copy letter link** to add a separate link sticker. The PNG has no clickable link and the app does not publish on someone’s behalf.
- **Copy letter link** exposes a selectable URL if clipboard access is unavailable.

Some in-app browsers handle file sharing and downloads differently. Actual Instagram handoff and photo-library placement depend on the device/browser and require device testing. The regular browser is a fallback when an in-app browser cannot save the image.

## Edit the project

| File | Responsibility |
| --- | --- |
| `src/letters.ts` | Twelve fictional letters, stable IDs, topics, route tags and three exact excerpt choices each. |
| `src/main.tsx` | Entry, reader, routes, About and excerpt-sharing dialog. |
| `src/WriteLetter.tsx`, `src/writer.css` | Private draft editing, preview, local save and text download. |
| `src/style.css` | Colour/type tokens, layout, motion, focus states and responsive treatment. |
| `src/share.ts` | PNG design, native sharing, download and clipboard fallbacks. |
| `public/art`, `public/fonts` | Local artwork, fonts and font licences. No third-party font service is called at runtime. |
| `DESIGN.md`, `PROJECT-CONTEXT.md` | Design intent, boundaries and continuity for later work. |

Keep letter IDs stable after sharing or printing links. Keep the example-fiction disclosure until the collection has been replaced with permissioned contributions. Letter text is selectable HTML, and the reader has a permanent cream surface even if artwork fails. Image export also paints a readable background before optional textures or fonts load.

The preview uses `noindex,nofollow` in `index.html`. Review that before a real public launch. No event date, venue, speaker lineup, ticket price or ticket link is invented.

## Future public contributions

This build cannot receive, moderate or publish letters. Public contributions need a separate submission service, consent wording and editorial review workflow. Saving a private draft must never silently turn it into a public contribution.

## Credits

The user’s Instagram references guide the current brand direction. Earlier interaction and visual references include Reasons to Stay, Unlikely Collaborators and Inspo reference captures. No letters or artwork were copied from those websites. The demonstration letters are original fictional editorial examples.

Artwork provenance and local font licences are documented in `ART-CREDITS.md`.
