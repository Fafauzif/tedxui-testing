/** Exact passages for community Story cards. No paraphrasing or word substitution. */
const graphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
const MAX_EXCERPT_UNITS = 280;
const MAX_GRAPHEMES = 180;
const MAX_UNBROKEN_GRAPHEMES = 60;

function graphemes(value: string): string[] {
  return Array.from(graphemeSegmenter.segment(value), (part) => part.segment);
}

function passageLimit(value: string, limit: number): number {
  return /\s/u.test(value) ? limit : Math.min(limit, MAX_UNBROKEN_GRAPHEMES);
}

function fitsExcerpt(value: string): boolean {
  return value.length <= MAX_EXCERPT_UNITS && graphemes(value).length <= passageLimit(value, MAX_GRAPHEMES);
}

/** Prefer a sentence. Shortened ordinary prose ends at a whole word. */
export function shortenExcerpt(value: string, limit = MAX_GRAPHEMES): string {
  const text = value.trim();
  const segments = graphemes(text);
  const availableGraphemes = passageLimit(text, limit);
  if (segments.length <= availableGraphemes && text.length <= MAX_EXCERPT_UNITS) return text;

  // Reserve one UTF-16 unit and one grapheme for the visible ellipsis. Counting
  // both limits keeps complex emoji intact and agrees with server validation.
  let candidate = "";
  for (const segment of segments.slice(0, availableGraphemes - 1)) {
    if ((candidate + segment).length > MAX_EXCERPT_UNITS - 1) break;
    candidate += segment;
  }
  if (!candidate) return "";
  const boundary = candidate.search(/\s+\S*$/u);
  // An exceptional unbroken token has no word boundary. Retain its exact
  // contiguous graphemes and show the same ellipsis in preview and export.
  if (boundary <= 0) return candidate + "…";
  return candidate.slice(0, boundary).trimEnd() + "…";
}

export function excerptOptions(body: string): string[] {
  const sentences = Array.from(sentenceSegmenter.segment(body), (part) => part.segment.trim()).filter(Boolean);
  const fitting = sentences.filter(fitsExcerpt);
  const choices = fitting.length ? fitting : sentences.map((sentence) => shortenExcerpt(sentence));
  return Array.from(new Set(choices)).filter(Boolean).slice(0, 3);
}

export function defaultExcerpt(body: string): string {
  return excerptOptions(body)[0] ?? shortenExcerpt(body);
}

export function isExactExcerpt(body: string, excerpt: string): boolean {
  const text = excerpt.trim();
  if (!text || text.length > MAX_EXCERPT_UNITS) return false;
  if (body.includes(text)) return true;
  if (!text.endsWith("…")) return false;
  const passage = text.slice(0, -1);
  const start = body.indexOf(passage);
  if (start < 0) return false;
  const nextCharacter = body[start + passage.length];
  const endsAtGrapheme = Array.from(graphemeSegmenter.segment(body.slice(start)), (part) => part.index).includes(passage.length);
  return endsAtGrapheme && (!nextCharacter || /\s|[.,!?;:…—–]/u.test(nextCharacter) || !/\s/u.test(passage));
}
