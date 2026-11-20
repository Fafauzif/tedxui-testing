# Share card compositor

`src/share.ts` renders Story (1080 × 1920), Square (1080 × 1080) and Portrait (1080 × 1350) PNGs in three independent designs. The preview, download and native file share use the same PNG data. The quote, exact byline, editorial or community attribution, campaign title and official TEDxUI mark are composed in code. Heart uses the generated paper and olive masters. Clean Square and Folded Letter use vector drawing operations in Canvas.

The renderer wraps exact text, keeps grapheme clusters together, and uses the selected typefaces and a local fallback. The hardened layout is tested against every original excerpt and stress cases. Generated source artwork and font provenance are listed in [Artwork and fonts](../ART-CREDITS.md).

The builder calls the device’s share sheet directly when supported. Save image and Open full-size image work as fallbacks. Copy letter link provides the exact permanent URL for a link sticker. The physical-device share sheet and Instagram import remain staged review steps.
