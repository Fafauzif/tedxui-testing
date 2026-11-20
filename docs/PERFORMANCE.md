# Reader performance comparison

Letters are readable earlier in the redesigned build. Across three cold-load trials, the median first readable paragraph appeared at 409 ms on the featured entry and 353 ms on an exact letter link. The prior local build measured 3,319 ms and 2,864 ms respectively.

## Measured entry results

Times are milliseconds from navigation start. Parentheses contain the minimum and maximum of three trials. Byte counts are response-body bytes actually served during the navigation, including scripts, styles, fonts, artwork, HTML and reader JSON. HTTP headers are outside that count.

| Entry | Cache | Prior first readable ms | Prior bytes | Redesigned first readable ms | Redesigned bytes |
| --- | --- | --- | --- | --- | --- |
| featured | cold | 3319 (2844–3936) | 885,818 | 409 (291–520) | 144,771 |
| featured | warm | 339 (326–400) | 1,218 | 138 (132–174) | 1,808 |
| deep | cold | 2864 (2837–3407) | 885,850 | 353 (319–482) | 144,745 |
| deep | warm | 629 (362–1915) | 1,245 | 136 (135–138) | 1,782 |

## Request behavior

| Check | Prior local build | Redesigned build |
| --- | --- | --- |
| Cold requests per entry | 13 | 6 |
| Cold font bytes | 122,692 | 44,820 |
| Cold artwork and favicon bytes | 675,238 | 20,082 |
| Reader JSON requests on featured and exact-link entry | 1 | 0 |
| Warm requests per entry | HTML plus reader JSON | HTML |
| Read another | Rotation followed by a direct-letter JSON request | One rotation request |
| Share builder module requested during entry | Part of the initial bundle | 0 |
| Canvas export observed during warm entry | 1 per observed warm navigation | 0 |

The redesigned entry checks passed in all twelve observed featured and deep-link navigations. All six Read another actions used exactly one rotation request. Neither build produced an uncaught page error during the comparison. The redesigned entry generated no Story canvas exports or share builder requests in these trials.

## Measurement conditions

- Playwright Firefox 153 headless desktop engine with a 390 × 844 CSS-pixel viewport, device pixel ratio 1 and reduced motion requested.
- Both HTTP implementations used one shared in-memory PostgreSQL database seeded with the same twelve original letters.
- Each response waited 100 ms before headers. Each origin shared a response-body queue capped at 125,000 bytes per second, delivered in 1,250-byte chunks at 10 ms intervals.
- Text responses used Brotli compression at quality 5. Static resources used a one-hour browser cache. Cold trials opened a new browser context, and warm trials navigated again in that same context.
- Trial order alternated between builds. Each featured and exact-link case ran three cold loads, three warm loads and three Read another actions.
- First readable time required a non-empty visible first paragraph and loaded external stylesheets. It includes selectable server-rendered text before the client script becomes interactive. The measurement records visible text through a mutation observer and animation frames.
- Request counts and encoded byte totals came from the controlled HTTP servers. Full navigation/resource timing entries and individual request records accompany the measurements.

## Build identity and interpretation

The compared outputs were frozen at the start of the run in build-snapshots. Their file sizes and SHA-256 values are recorded in build-manifest.json. The baseline is the prior delivered local source at letters-to-grow, and the redesign is the isolated redesign/letters-to-grow build. These measurements describe the controlled local comparison. Hosted Vercel, Supabase network latency, physical phones and Instagram’s in-app browser have their own runtime conditions.

The snapshots preceded final masthead and card control spacing. The final card renderer includes a few extra script characters. The campaign script and builder are outside the measured 390 px entry requests. The final screenshots in `review/` show the delivered build.

## Evidence

The raw records and comparison captures are in `review/performance/`.

- measurements.json contains all 36 observed records, network-resource timings and server request records.
- contract-checks.json contains the evaluated entry and next-letter request assertions.
- build-manifest.json identifies every file in both frozen builds.
- prior-featured-cold.png and redesign-featured-cold.png show the compared featured reading states.
- prior-deep-cold.png and redesign-deep-cold.png show the compared exact-letter reading states.
