# Artwork and fonts · revision 4

The current green botanical direction is informed by the Instagram grids supplied by the user. Those grids are visual references, not a complete formal brand specification. Earlier references include Unlikely Collaborators for expressive graphic character and Reasons to Stay for intimate letter reading. No website artwork or letters were copied from those sites.

## Project artwork

| Runtime asset | Source and use |
| --- | --- |
| `public/art/tedx-logo.png` | Genuine TEDxUniversitasIndonesia project logo from the supplied reference material. It was not generated. |
| `public/art/botanical-sprig.webp` | Original isolated botanical cutout generated with GPT Image for revision 4; 840 × 560, 95,352 bytes, transparent WebP. |
| `public/art/white-flower.webp` | Original isolated ivory flower cutout generated with GPT Image for revision 4; 600 × 900, 78,322 bytes, transparent WebP. |
| `public/art/letter-paper.webp` | Original generated blank paper, resized and compressed in revision 3; optional sheet texture and edge decoration. |
| `public/art/black-paper.webp` | Original generated paper grain, reused subtly over the green ground. |
| `public/art/envelope-chalk.webp` | Earlier original generated chalk envelope, retained for replacement compatibility; not part of the current interface. |

GPT Image was used for isolated elements, not finished website screens, headings, body text, typography or logos. The plant cutouts retain alpha transparency and were resized with Pillow Lanczos, then encoded as WebP at quality 84 and alpha quality 100. Accepted source images and detailed generation records are retained in project working materials outside the deployment package.

## Botanical generation briefs

These summaries describe the generation prompts; exact prompts are retained with the source assets in the project working materials.

**Sprig:** An isolated landscape cutout of gently arching olive-green stems and narrow leaves. Vintage botanical specimen collage with engraved veins, faded earthy ink, cream fibrous paper edges and open negative space. Transparent background; no text, logo, scene, glossy surface, glow or 3D treatment. A targeted edit preserved the plant and removed its broad translucent cream halo.

**Flower:** One isolated ivory cosmos/daisy flower with an ochre centre, long moss-green stem and two narrow olive leaves. A pressed-flower scrapbook treatment with restrained printed detail and a thin cream paper edge. Transparent background; no paper rectangle, scene, shadow, text, logo, glow or 3D treatment.

Runtime SHA-256 values:

```text
botanical-sprig.webp  9f626691f262bb2dc98cd5a949df237e10710356e4ce6b92f21b4dc65f369107
white-flower.webp     af4f5e1ca074206a76310f725c600c4b8719687f4a1394ea1fa7f95b76e37f73
```

## Earlier material briefs

- **black-paper.webp:** Flatbed-style near-black construction-paper scan, fine xerox grain and uneven ink density. Edge-to-edge, no objects, words, borders or lighting effects.
- **letter-paper.webp:** Blank off-white uncoated portrait sheet with small deckled edges, fine fibre and a faint fold. Transparent surroundings; no writing, stamps, objects or perspective scene.
- **envelope-chalk.webp:** Open envelope and blank letter in creamy chalk/crayon with imperfect outlines, hatching and vermilion marks. Transparent surroundings; no words, logos, faces or copied brand artwork.

## Fonts and licences

All fonts are bundled locally. The relevant upstream Open Font License text files are included in `public/fonts`.

| Current role | Family | Files and licence |
| --- | --- | --- |
| Flowing display type | Cormorant Garamond medium, regular/italic | `display-serif.woff2`, `display-serif-italic.woff2`; `Cormorant-Garamond-OFL.txt` |
| Letter body | Courier Prime | `typewriter.woff2`; `Courier-Prime-OFL.txt` |
| Controls and labels | DM Sans | `sans.woff2`; `DM-Sans-OFL.txt` |

Earlier Barlow Condensed, Caveat, Archivo Black and Source Serif 4 files/licences remain for replacement compatibility. An unused local font file does not cause a runtime network request. Cormorant Garamond is a chosen substitute for the supplied references, not a claim about the exact official brand typeface.
