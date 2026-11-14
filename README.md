# Letters to Grow · revision 2

An English-language campaign proof of concept for TEDxUniversitasIndonesia 2027, under **Still, We Grow**. It opens straight into a letter. Eight fictional editorial examples, one at a time. No homepage, accounts, database, analytics, or submission service.

## Replace your current version

This archive has the same root structure as the previous ZIP. Extract it **inside your existing repository folder**, choose **Replace all** when asked, then commit/upload the changed files. `package.json` and `src` must remain at the repo root, not inside another nested folder. No files need deleting. Existing Vercel settings can stay the same; redeploy after updating the repo. No secrets or environment files are included or overwritten.

This revision rebuilds the visual interface with a textured black background, original chalk artwork, rough paper, condensed display type and typewriter letters. It also rebuilds the Story image and simplifies sharing to a single panel.

## Deploy on Vercel

1. Extract this ZIP.
2. Upload the **contents** of this folder to your Git repository. `package.json`, `index.html`, `src`, and `public` belong at the repository root. Do not upload the ZIP as the only file.
3. Import the repository into Vercel.
4. Select **Vite** if Vercel does not detect it. Build command: `npm run build`. Output directory: `dist`. Node.js: 22 or 24.
5. Deploy. No environment variables or database setup required.

This is a source project: double-clicking `index.html` will not run the app. Use Vercel or the local commands below.

## Local development

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm run preview
```

Use `npx vite --host 127.0.0.1` if a restricted development environment does not allow network-interface discovery.

## Share a letter

Every letter has a stable `?letter=` URL. Sharing a letter link or using it in a printed QR opens that exact letter. For example, append `?letter=the-old-staircase` to your deployed URL. The browser Back button returns to previous letters.

**Save or share** prepares a real 1080 × 1920 PNG with an excerpt. The displayed preview is the actual exported image.

- **Share image:** uses native file sharing when `navigator.canShare()` reports support. Installed apps and targets depend on the phone/browser. The app does not publish to Instagram or any account on your behalf.
- **Save image:** downloads the PNG. Open Instagram, choose Story, and add it from your photos/downloads. Copy the letter link and add an Instagram link sticker separately. A saved PNG has no clickable link.
- Unsupported or failed native sharing starts an image download. Cancelling the native share menu leaves the image in the preview without downloading.
- **Copy letter link:** copies the URL. If clipboard access is unavailable, the app exposes a selectable URL instead.

Some in-app browsers handle downloading and sharing differently. Real iOS/Android Instagram handoff and photo-library placement require device testing. Use the regular browser if an in-app browser cannot save the image.

## Edit content and design

- `src/letters.ts`: eight letters, salutations, signoffs, topics, and exact excerpts. Keep stable IDs after sharing/printing URLs. Each body is 150–250 words. The example disclosure is intentional: replace it only after replacing the demonstration content with permissioned real contributions.
- `src/main.tsx`: reading and sharing UI; About copy.
- `src/style.css`: visual tokens, typography, layouts, responsive treatment, reduced motion, focus states.
- `src/share.ts`: image design and capability-based sharing/download/clipboard fallbacks. Its export palette and local artwork follow the revised reader.
- `public/fonts`: local fonts and their Open Font Licenses. No external font request at runtime.
- `DESIGN.md`: durable design context for later edits.

The page has `noindex,nofollow` while it is a fictional-content preview. Change that in `index.html` when preparing a real public launch. No event date, venue, speaker lineup, ticket link or stock is invented.

## Later, if you want public contributions

There is no decorative or fake Submit button in this build. Add a backend and an editorial review workflow separately before accepting letters. Private text should never silently become a public contribution. This prototype makes no network request to collect or store writing.

## Credits

Concept and code created for this project. Visual references: Reasons to Stay (immediate reading and paper), Unlikely Collaborators (graphic character), and Inspo reference captures (typographic restraint). No letters or artwork copied from those websites. Demo letters are original fictional editorial examples.

Fonts: Barlow Condensed, Courier Prime, Caveat, DM Sans. Earlier fonts remain for replacement compatibility. Their upstream Open Font Licenses are included in `public/fonts`. Original generated artwork and prompts are documented in `ART-CREDITS.md`.
