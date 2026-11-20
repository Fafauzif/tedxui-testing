# Story compositor

`src/share.ts` creates one 1080 × 1920 PNG. The displayed preview, saved image and `File` passed to Web Share contain the same bytes. The UI must prepare this file before the share tap, invalidate out-of-date rendering promises, and revoke replaced object URLs. `shareCard` invokes `navigator.share` before its first await and checks `navigator.canShare({files})`. Cancel returns `cancelled` and keeps the image. Unsupported or failed native sharing downloads the same image.

The quote, exact signature, editorial/community attribution, campaign title, configured URL host and supplied TEDxUI mark are painted in code. Artwork contains no text. The official mark retains its original aspect ratio. Failure to load the mark asks the reader to retry. Optional decorative artwork has a bounded load and a solid olive/scalloped cream shape fallback.

The primary palette follows the approved campaign tokens. Cormorant Garamond handles the Story quote and title, with DM Sans for small attribution. Quote type starts at 72 px and stays at least 62 px. Text that cannot fit the central paper field returns an actionable error asking for a shorter passage, rather than reducing readability. Signatures wrap at their original wording. `Intl.Segmenter` keeps emoji and combining characters together when breaking an unbroken token.

`src/excerpts.ts` proposes three contiguous passages from a community letter. It prefers complete sentences and preserves exact words. If a passage needs shortening it stops at a word boundary and adds an ellipsis. A giant unbroken token cannot be shortened at a whole-word boundary, so the compositor safely wraps it and rejects excessive length. The original editorial excerpt arrays remain untouched.

Native handoff into Instagram, iPhone Safari and Android Chrome requires physical-device verification. Browser emulation cannot confirm an installed app target, actual saved-photo behavior, system share permissions or the final link sticker. This module makes no claim that sharing posts a Story.

## Source references

- User-supplied *Art-direction.md*, *Product-and-Story.md* and campaign tile `references/evidence/letter-tile.png` in the approved build handoff.
- The runtime logo is `public/art/tedx-logo.png` supplied with the original source.
- Existing local Cormorant Garamond and DM Sans font files retain their bundled OFL licences.
- New GPT Image master provenance and optimized derivative information is maintained with the accepted assets in the main handoff.
