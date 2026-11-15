# Letters to Grow · current implementation context

This file records the current website decisions for the next person or assistant editing the project. Revision 4 supersedes the former black chalkboard direction and the earlier read-only, letter-first root.

## Campaign role

- Project: TEDxUniversitasIndonesia 2027, **Still, We Grow**.
- Campaign question: **What are you still figuring out?**
- Experience name: **Letters to Grow**.
- Language: English throughout.
- Intended entry points: campus QR posters, campaign activations, ambassador sharing and social letter links.
- Purpose: a brief, thoughtful exchange through ordinary stories. Ticket selling is not the primary interaction.

## Approved experience

The root URL presents **I’m feeling…** with four starting points: Ready to start again, A little out of place, Stretched thin and Curious. The first three draw from relevant editorially tagged letters; Curious and Read any letter use the entire collection. These choices do not diagnose a reader or claim psychological personalisation.

The root always shows this selector. Its decorative entrance runs once per session. A stable `?letter=ID` URL opens the matching letter directly and bypasses the selector. Invalid letter links have a recovery state. Back/Forward navigates previous views, and Read another avoids immediate repetition.

There are twelve fictional editorial example letters. The original eight IDs remain intact for existing links. Four additions cover returning to a group, divided work/class commitments, message expectations and trying swimming again. Preserve the fictional-example disclosure until permissioned real content replaces the demonstrations. Every letter has three curated excerpt choices drawn from that letter.

**Write a letter** is a real frontend flow at `?write=1`, with recipient, body and signoff fields, preview, explicit local draft save and text download. It does not send or publish letters. Unsaved text stays in app memory during navigation but can be lost on reload or closing the tab. Saving explicitly writes to this browser’s local storage. Saved-copy removal does not clear the current text. Current limits are 100 characters for recipient, 5,000 for body and 80 for signoff.

**Save a line** generates a 1080 × 1920 PNG locally. People choose one of three excerpts, share through native file sharing where supported, save the image, or copy the stable letter link. Instagram posting uses a saved image plus a separately added link sticker. No direct Instagram publishing or clickable PNG is promised.

## Visual decisions

Use the supplied Instagram references as the current brand anchor: olive/moss, cream, tactile paper, flowing serif headings and sparse botanical cutouts. Exact official brand colours/fonts were not supplied. Cormorant Garamond, Courier Prime and DM Sans are bundled working choices. The genuine project logo comes from supplied material. GPT Image produced only the isolated sprig and flower elements.

Keep the reading area quiet and high contrast. Text remains HTML, and a cream surface is always present even when textures fail. The mobile layout must retain clear reading, large enough controls and no overlapping artwork. Motion is brief and purposeful, with reduced-motion support. Do not add moving click targets, particles, generic feature grids, excessive headings, fake statistics or motivational filler.

## Technical boundaries

React 19, TypeScript and Vite; frontend only. No accounts, database, server submission, analytics or ticket integration. User writing is not uploaded. The prototype does not moderate or store public contributions. Later public submission work needs its own service, consent and editorial process.

No event date, venue, ticket price, speakers or public-launch facts should be invented. The site remains marked `noindex,nofollow` for its fictional preview.

## Delivery contract

Maintain repository-root-relative paths for the replacement ZIP. The user extracts into the existing repo and chooses Replace all. Keep `package.json`, `src`, `public` and `index.html` at the root. Do not require deletion of old assets, a new backend or different hosting. Vercel uses Vite, `npm run build`, output `dist`; no environment variables are required.

`README.md` covers operation and sharing. `DESIGN.md` records the design rules. `ART-CREDITS.md` records provenance and font licences. None of these documents should claim physical-device, Instagram-app or real-user testing unless that testing actually occurred.
