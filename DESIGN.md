# Letters to Grow · design context, revision 4

## Purpose and audience

An English-only campaign experience for TEDxUniversitasIndonesia 2027 / **Still, We Grow**, intended for people arriving from campus QR posters, activations, ambassadors and shared letter links. It offers a small encounter with someone else’s everyday uncertainty. The experience should feel personal, readable and tactile. It should not resemble an event sales site or a wellbeing assessment.

## Current direction

Revision 4 replaces the former black chalkboard direction with olive/moss green, warm cream paper, flowing serif headings, a genuine project logo and restrained botanical collage. This direction is inferred from the Instagram screenshots supplied by the user. The supplied references do not establish exact official colour values or typefaces, so the implementation uses a coherent working palette and quality local font substitutes.

The root is a single campaign opening, not a homepage. “What are you still figuring out?” introduces **I’m feeling…** and four readable choices: Ready to start again, A little out of place, Stretched thin and Curious. They are everyday states, not diagnoses. They select an editorially tagged letter rather than promising personalised advice. A direct `?letter=` link bypasses this opening.

## Materials and typography

`src/style.css` owns the main visual tokens. Current values include olive `#57652e`, ground `#89954f`, paper `#fffbed`, paper ink `#302b20`, ground ink `#11170b`, cream `#fffde9` and restrained red `#ca301d`. `src/share.ts` adapts this palette for image export.

- **LetterDisplay:** Cormorant Garamond medium, regular and italic. Used for flowing headings, wordmarks and signatures, with Georgia fallback.
- **LetterTypewriter:** Courier Prime. Used for letter paragraphs and excerpt choices, with Courier New fallback.
- **CampaignSans:** DM Sans. Used for controls, labels and supporting copy, with Arial fallback.

Fonts are local. Body text remains live, selectable HTML. Decorative artwork never contains the functional labels or letter paragraphs. The reading sheet always has a solid cream layer below the optional paper texture, so ink remains readable when art is delayed or blocked. Plant cutouts sit at the edges rather than across reading text or controls. Earlier unused assets remain only for replacement compatibility.

## Layout and interaction

The opening has four still, clickable paper shapes. Desktop uses a loose two-column composition; mobile stacks the choices. The reader has a compact identity rail on wider screens and a stacked identity on small screens. The full letter scrolls naturally, with actions below the complete sheet. The writing flow uses the same readable paper treatment.

The entrance uses a short opacity/translation sequence once per session. A selected starting point makes a brief transition into its letter. No continuous floating targets, particles, typewriter reveal, scroll hijacking or required animation gate. Reduced-motion preference removes decorative animation and transition delays.

Keep semantic buttons, visible focus states, keyboard access and native-dialog focus isolation. About and share dialogs support Escape and focus restoration. Stable letter URLs, missing-link recovery and browser Back/Forward are part of the experience.

## Content and writing

The collection contains twelve clearly disclosed fictional editorial examples. Each letter is a small concrete story, with ordinary details and an unresolved or modest ending. Avoid slogans, fabricated testimonials, generic reassurance, inflated campaign language or claims that a letter understands a reader’s emotional state. Each letter has three exact excerpts, chosen from its own text.

**Write a letter** must remain visible. This frontend version permits editing, preview, explicit local draft save, saved-copy removal and `.txt` download. It does not submit or publish a letter. Unsaved words survive in-app navigation through memory; only an explicit save persists them in browser local storage. Explain this distinction plainly. Never imply the draft is saved online.

## Sharing

**Save a line** prepares a local 1080 × 1920 PNG with one of three curated excerpt choices. The displayed preview is the actual export. Solid green and cream are painted before optional art. Fonts and textures have a one-second deadline; unavailable decoration must not prevent a readable export.

Native sharing is files-only and capability-based. Unsupported/error paths download; cancellation does not. Clipboard failure exposes a selectable URL. The interface explains that posting on Instagram requires adding the image to a Story and adding the copied URL separately as a link sticker. Do not promise a clickable exported image or direct Instagram publishing.

## Scope and handoff

React, TypeScript and Vite, frontend only. No database, accounts, public submissions, analytics, ticket integration or new collection service. No automatic uploads of user writing. Event facts remain absent unless supplied and confirmed.

The delivery contract is a repository-root replacement ZIP: extract inside the existing repo and replace files, with no nested project folder or deletion step. Deployment uses the existing Vercel Vite configuration. Do not introduce an unrelated hosting or backend dependency during routine edits.
