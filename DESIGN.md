# Letters to Grow

## Purpose and audience

English-language, frontend-only participatory campaign proof of concept for TEDxUniversitasIndonesia 2027 / Still, We Grow. Students and young adults enter from QR posters, social links or ambassadors. The first screen contains the beginning of a letter. No conventional landing page. Short fictional demonstration letters are disclosed individually. No database, accounts, collection, analytics, public submissions or invented social proof.

## References and direction

Reasons to Stay: immediate reading, paper surface, simple continuation. Unlikely Collaborators: confident grotesque type, drawn material details. Inspo captures of Letters from Sweden and Participant Inc: deliberate typographic scale and restrained navigation. Original implementation, not copied content or art.

## Tokens and ownership

src/style.css :root is the runtime token owner. White paper #fff against neutral page #f5f4f0, ink #20201e, secondary #62615b, accent #d82d22 (prototype campaign accent). No gradients, fake metric blocks, equal-card grids, repeated poetic headings. Sharp paper; rounded pill only for functional controls. Local fonts: Archivo Black (CampaignDisplay), DM Sans (CampaignSans), Source Serif 4 (LetterSerif). Fonts retain upstream OFL licenses in public/fonts.

## Signature

Open correspondence: clean paper, restrained fold shadow, red postal mark, pencil-like envelope line at the bottom of the reading sheet. The actual letter text is selectable HTML. Big masthead is identity, not a sales hero. Texture is restrained enough for long reading. One letter at a time. The envelope outline is original geometric art that describes the content; no decorative photographic filler.

## Behavior

Direct links use ?letter=<stable-id>. Initial unlinked visit chooses a random example; cycling avoids repeats until all letters read. Previous via browser Back. Sharing pre-generates an actual 1080x1920 excerpt image before the user chooses native share; unsupported sharing saves image and explains manual Instagram upload. Cancel does not download. Copy fallback exposes selectable URL. No automated social publication or simulated success.

## Accessibility and motion

Semantic actions, visible focus, minimum 44px targets, readable contrast, selectable text, natural page scrolling. Native dialog for image preview with focus containment, Escape and restoration; about in native dialog. Letter change subtle 220ms sheet entrance; reduced motion removes it. Main letter remains flat and still while read. No scroll hijacking, autoplay, mandatory envelope gesture, chat, or typing animation.

## Verification

Build and TypeScript, browser narrow/desktop, direct links, history, short/long letter, keyboard, focus, export dimensions/readability, native-share fallback and cancellation simulations. Real Instagram share target and phone app availability must not be claimed from desktop testing.
