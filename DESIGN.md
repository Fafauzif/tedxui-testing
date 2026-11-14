# Letters to Grow, revision 2

## Purpose

English-only frontend campaign piece for TEDxUniversitasIndonesia 2027 / Still, We Grow. A reader opens straight into a 150–250-word fictional example letter, can draw another, and save/share a Story image. No homepage, database, account, public collection, writing form, analytics, tickets, or new network service.

## Approved revision

The user rejected the clean publication-like paper/serif interface. They asked for a major revision closer to Unlikely Collaborators' illustrated, graphic UI while retaining the intimate paper feel of Reasons to Stay. This is a new composition, not a replica of either site's art.

## Direction

Textured black sketchbook surface, original chalk envelope illustration, rough-edged paper and red tape. Heavy condensed lettering in a compact side composition on desktop; compact identity above the letter on mobile. A typewriter letter with handwritten topic/signature. The letter is already open. No envelope-opening gate. No marketing sections or decorative numbered counters.

## Tokens and ownership

src/style.css :root owns UI colours and type roles: --board #101010, --paper #f5f0e7, --ink #24221f, --white #f5f2e9, --muted #b9b5ab, --red #f44331. CampaignDisplay: Barlow Condensed 800. CampaignSans: DM Sans 400. LetterTypewriter: Courier Prime regular/italic. Handwritten: Caveat. Fonts bundled locally with their OFLs. src/share.ts has explicit adapted export colours and uses the same local art/fonts.

## Artwork

Original imagegen assets in public/art: black-paper.webp, letter-paper.webp and envelope-chalk.webp. Lossless format conversion only. Source prompts recorded in ART-CREDITS.md. Text stays selectable HTML; no rasterized letter paragraphs. Texture stronger outside the reading surface. Paper alpha edge stretches with natural content height. No decorative text sits behind or across body text or controls.

## Layout

Identity rail plus reader on desktop; stacked composition at <=740px. Reader letter grows naturally for content. Metadata in flex normal flow; tape alone absolute, safely above content. Actions occupy a separate row below the complete sheet. No rotated backing envelope or bottom caption. Sharing is one-column preview/actions rather than a professional split panel.

## Interaction and accessibility

Stable ?letter= IDs retained for existing QR and shared links. Random draw avoids repeats within a cycle and immediately excludes the current ID. Browser Back restores prior letter. Native dialog provides focus isolation, Escape and focus restoration. Visible focus, semantic controls, minimum ~44px controls, natural reading scroll. Reduced motion disables sheet entry animation. Source copy clearly marks example fiction.

## Sharing

1080x1920 actual PNG prepared locally before native Share click. Same texture/paper design, adaptive excerpt layout. Native file-sharing capability detection; unsupported/error path downloads; cancellation never downloads. Clipboard failure exposes a selectable URL. Manual Instagram instructions explain photo upload and separate link sticker. OS/Instagram app availability is not promised.

## Packaging contract

The replacement ZIP contains files at repository-root-relative paths, matching revision 1. Extract into the current repo and replace existing files. All previous files remain safe if unused. No deleting repository or dotgit, node_modules, or environment files is required. No deployment or external repository mutation performed by the assistant.
