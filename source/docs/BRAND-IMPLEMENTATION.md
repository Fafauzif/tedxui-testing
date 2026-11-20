# Letters to Grow brand implementation

The supplied TEDxUniversitasIndonesia 2027 quick guidelines establish the typography, color swatches, marks and campaign material. The accompanying campaign grids establish the textured olive ground, ivory paper, expressive display lettering and botanical cutouts used for Letters to Grow.

## Supplied typography

| Role | Family in the supplied guideline | Guideline setting | Installed web asset |
| --- | --- | --- | --- |
| Heading | Basteleur | 100% line height, −11% letter spacing | `public/fonts/Basteleur-Moonlight.woff2` and `public/fonts/Basteleur-Bold.woff2` |
| Body | Helvetica Neue | 100% line height, −2% letter spacing | Use the reader’s locally installed font and system fallbacks |
| Accent | Luxurious Script | Expressive accent lettering | `public/fonts/LuxuriousScript-Campaign.woff2` |

The source specifies sentence case for long headlines and uppercase for highlighted words shorter than six letters. It demonstrates ivory outlines around expressive headlines, olive printed textures, botanical imagery and red accents. The supplied document contains its own layout examples and a separate tutorial link.

The guideline’s body and headline settings describe its campaign artwork. Extended reading, form controls and narrow-screen layouts require their own measured line spacing and wrapping. The source settings above remain recorded so each web adaptation can be assessed against the actual guideline.

A suitable local sans-serif stack is `"Helvetica Neue", HelveticaNeue, "Liberation Sans", Arial, sans-serif`. This release distributes the licensed Basteleur and Luxurious Script files. A locally installed Helvetica Neue can render through the system font lookup.

Moonlight and Bold have separate internal family names. Moonlight reports weight 300 and Bold reports weight 400 in their source metadata. Declare the cuts explicitly in `@font-face` and select the intended face in CSS. Luxurious Script reports regular weight 400. Each asset includes its source character coverage, kerning and OpenType substitutions.

## Palette and material

The guideline provides color swatches and gradients. The separate Color Styles Template referenced in the PDF was unavailable. The supplied swatches and campaign artwork establish the starting palette. The interface uses darker variants for controls, text and focus indicators. The following RGB values were sampled from the flat interiors of the supplied PDF raster. They document the sampled reference and do not imply named color tokens were embedded in the PDF.

| Swatch | Sampled RGB hex |
| --- | --- |
| Red | `#EC2806` |
| Orange | `#FF7B33` |
| Yellow | `#FFAA33` |
| Green | `#5B8734` |
| Ivory | `#FFFFEA` |

Campaign references add mottled olive and yellow-green texture, cream paper edges, layered flowers and swash lettering. Keep the reading sheet opaque and keep the exact letter words clear of the ornamental edge. Story text, attribution, mark and permanent-link address are composed in code over the campaign art.

## Supplied marks

Both runtime marks are exact bytes extracted from the supplied `TEDx Universitas Indonesia 2027 (3).zip`. The black and white wordmarks retain the supplied red TEDx lettering, tagline, transparency, internal spacing and original aspect ratio.

| Runtime asset | ZIP member | Intrinsic dimensions | Bytes |
| --- | --- | --- | --- |
| `public/art/tedx-logo.png` | `Logo Transparant 1.png` | 1121 × 277 | 132,381 |
| `public/art/tedx-logo-light.png` | `Transparent 1.png` | 1152 × 299 | 67,542 |

Use the black wordmark on a light sheet and the white wordmark on a dark field. The website header uses the same black mark at 460 × 114 in a 19,896-byte WebP. The exports and source package retain the full-resolution originals. Scale each mark proportionally. Preserve the complete lockup and its transparent bounds. The mark is supplied campaign artwork and has its own provenance, separate from the generated background material.

## Font provenance and verification

| Asset | Upstream source | Processing | Bytes |
| --- | --- | --- | --- |
| Basteleur Moonlight | Velvetyne Type Foundry’s Basteleur repository, commit `f32302d63d46e9b996f329648b0f2df01c9190f5` | Copied the official WOFF2 directly | 44,820 |
| Basteleur Bold | The same official repository and commit | Copied the official WOFF2 directly | 48,040 |
| Luxurious Script Regular | Google Fonts’ `ofl/luxuriousscript/LuxuriousScript-Regular.ttf` | Full-font WOFF2 compression through FontTools and Brotli, preserving names and outlines | 127,940 |

The Basteleur copyright and SIL Open Font License 1.1 are included as `Basteleur-COPYRIGHT.md` and `Basteleur-OFL.txt`. Luxurious Script’s copyright and SIL Open Font License 1.1 are included as `Luxurious-Script-OFL.txt`. Keep those files with redistributed font assets.

The campaign-only WOFF2 contains the characters for “What are you still figuring out?”, “Grow”, “a letter.” and “yours.”. FontTools successfully reopened each full WOFF2. Moonlight contains 522 glyphs, Bold contains 493 glyphs, and Luxurious Script contains 1,287 glyphs. These are file measurements. They describe the installed files and do not establish browser rendering performance.

| File | SHA-256 |
| --- | --- |
| `Basteleur-Moonlight.woff2` | `9517a47c65fcdb75c82fa138130593f86deda1b977b98f5bd9738a352802e64a` |
| `Basteleur-Bold.woff2` | `2a43b63af007450e81a19fb184a8bb19f4a72e9a9d8461694fd495087ce3d4af` |
| `LuxuriousScript-Regular.woff2` | `c1518f3f43713ddd198bda29d88889675c58b294161fc32fdac2113ae14f2cf0` |
| `tedx-logo.png` | `fdd71a9ffe4b82c3428b188b4d5d74b93592e858caa71877ff4307c36b5253cc` |
| `tedx-logo-light.png` | `ea45476fa0fa8007a35e0ddb815701dae4202771de7e47a7f2d62b5282ccb059` |

## Design references

| Primary material | Implementation relationship |
| --- | --- |
| Supplied *QUICK GUIDELINES* PDF | Typography roles, headline capitalization, visual palette, marks and campaign composition |
| Supplied campaign grids and heart tile in the approved build brief | Scalloped ivory paper, olive print texture, botanical layers and exact campaign identity |
| Reasons to Stay | A letter appears as the primary experience, with reading and writing actions close at hand |
| Unlikely Collaborators’ *Perception Box* | A strong central visual object and distinctive editorial lettering guide the page hierarchy |

The external websites supply interface and composition references. The TEDxUI campaign material supplies the project identity. All twelve original editorial letters retain their original words, sign-offs and permanent IDs.

## Sources

TEDxUniversitasIndonesia. (2026). *QUICK GUIDELINES (DILARANG MENGUBAH ISI SECTION INI, CUKUP COPY PASTE AJA)* [Supplied campaign guideline PDF].

TEDxUniversitasIndonesia. (2026). *TEDx Universitas Indonesia 2027 (3)* [Supplied ZIP containing two logo PNGs].

Keussel. (2023). *Basteleur* [Font files, documentation and SIL Open Font License]. Velvetyne Type Foundry. https://gitlab.com/velvetyne/basteleur/-/tree/f32302d63d46e9b996f329648b0f2df01c9190f5

Google Fonts. (n.d.). *Luxurious Script* [Font files and SIL Open Font License]. Retrieved November 20, 2026, from https://github.com/google/fonts/tree/main/ofl/luxuriousscript

Leuschke, R. (n.d.). *Luxurious Script*. Google Fonts. https://fonts.google.com/specimen/Luxurious+Script

Reasons to Stay. (n.d.). *Home*. Retrieved November 20, 2026, from https://reasonstostay.org/

Unlikely Collaborators. (n.d.). *Perception Box*. Retrieved November 20, 2026, from https://www.unlikelycollaborators.com/
