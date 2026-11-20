/** Preview, saved image and native shared file always use the same PNG bytes. */
export interface ShareCard {
  blob: Blob;
  url: string;
  file: File;
}
export type CardFormat = "story" | "square" | "portrait";
export type CardStyle = "heart" | "square" | "folded";
export type CardInput = {
  excerpt: string;
  salutation: string;
  letterUrl: string;
  signoff: string;
  origin: "editorial" | "community";
  format?: CardFormat;
  style?: CardStyle;
};
export const CARD_FORMATS: Record<
  CardFormat,
  { label: string; width: number; height: number }
> = {
  story: { label: "Story", width: 1080, height: 1920 },
  square: { label: "Square", width: 1080, height: 1080 },
  portrait: { label: "Portrait", width: 1080, height: 1350 },
};
export const CARD_STYLES: Record<CardStyle, string> = {
  heart: "Heart",
  square: "Square",
  folded: "Folded Letter",
};
const CREAM = "#f9f6e9";
const INK = "#263324";
const OLIVE = "#37452d";
const CLAY = "#b58d75";
const RED = "#e63322";
const SANS =
  '"Helvetica Neue", CampaignSans, "Liberation Sans", Arial, sans-serif';
const DISPLAY = "LetterDisplay, Georgia, serif";
const SCRIPT = "CampaignScript, Georgia, serif";
const graphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
type Box = { x: number; y: number; width: number; height: number };

function wrapText(
  ctx: CanvasRenderingContext2D,
  value: string,
  width: number,
): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of value.trim().split(/\s+/u).filter(Boolean)) {
    if (ctx.measureText(word).width > width) {
      if (current) lines.push(current);
      current = "";
      for (const { segment } of graphemeSegmenter.segment(word)) {
        if (ctx.measureText(segment).width > width)
          throw new Error(
            "This line contains a character that cannot fit the card. Choose another passage.",
          );
        if (current && ctx.measureText(current + segment).width > width) {
          lines.push(current);
          current = segment;
        } else current += segment;
      }
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > width) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function bounded<T>(
  task: Promise<T>,
  fallback: T,
  milliseconds = 2500,
): Promise<T> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(fallback), milliseconds);
    task.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      () => {
        window.clearTimeout(timeout);
        resolve(fallback);
      },
    );
  });
}
const loadedArtwork = new Map<string, HTMLImageElement>();
const pendingArtwork = new Map<string, Promise<HTMLImageElement | null>>();
function artwork(path: string): Promise<HTMLImageElement | null> {
  const ready = loadedArtwork.get(path);
  if (ready) return Promise.resolve(ready);
  let pending = pendingArtwork.get(path);
  if (!pending) {
    pending = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const decoded = image.decode ? image.decode() : Promise.resolve();
        decoded.then(
          () => {
            loadedArtwork.set(path, image);
            resolve(image);
          },
          () => resolve(null),
        );
      };
      image.onerror = () => resolve(null);
      image.src = path;
    });
    pendingArtwork.set(path, pending);
    void pending.then(() => pendingArtwork.delete(path));
  }
  return bounded(pending, null);
}
async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  await bounded(
    Promise.all([
      document.fonts.load("400 72px LetterDisplay"),
      document.fonts.load("400 100px CampaignScript"),
      document.fonts.load("400 28px CampaignSans"),
    ]).then(() => undefined),
    undefined,
  );
}
function contain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: Box,
): void {
  const scale = Math.min(
    box.width / image.naturalWidth,
    box.height / image.naturalHeight,
  );
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(
    image,
    box.x + (box.width - width) / 2,
    box.y + (box.height - height) / 2,
    width,
    height,
  );
}
function cover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}
function textBlock(
  ctx: CanvasRenderingContext2D,
  value: string,
  box: Box,
  options: {
    max: number;
    min: number;
    family?: string;
    center?: boolean;
    color?: string;
    lineHeight?: number;
  },
): void {
  const family = options.family || DISPLAY;
  const lineHeightRatio = options.lineHeight || 1.15;
  let size = options.max;
  let lines: string[] = [];
  let ascent = 0;
  let lineHeight = 0;
  for (; size >= options.min; size -= 2) {
    ctx.font = `400 ${size}px ${family}`;
    lines = wrapText(ctx, value, box.width);
    const metrics = lines.map((line) => ctx.measureText(line));
    ascent = Math.max(
      size * 0.85,
      ...metrics.map((metric) => metric.actualBoundingBoxAscent),
    );
    const descent = Math.max(
      size * 0.18,
      ...metrics.map((metric) => metric.actualBoundingBoxDescent),
    );
    lineHeight = Math.max(
      size * lineHeightRatio,
      ascent + descent + size * 0.05,
    );
    if (lines.length * lineHeight <= box.height) break;
  }
  if (size < options.min)
    throw new Error(
      "This passage is too long for this card. Choose a shorter line or another format.",
    );
  const top = box.y + (box.height - lines.length * lineHeight) / 2;
  ctx.textAlign = options.center ? "center" : "left";
  ctx.fillStyle = options.color || INK;
  lines.forEach((line, index) =>
    ctx.fillText(
      line,
      options.center ? box.x + box.width / 2 : box.x,
      top + ascent + index * lineHeight,
    ),
  );
}
function header(
  ctx: CanvasRenderingContext2D,
  format: CardFormat,
  color: string,
): void {
  const story = format === "story";
  const y = story ? 288 : format === "portrait" ? 106 : 74;
  const titleSize = story ? 76 : 62;
  const scriptSize = story ? 126 : 104;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = `400 ${story ? 23 : 20}px ${SANS}`;
  ctx.fillText("STILL, WE GROW", 540, y);
  ctx.font = `400 ${titleSize}px ${DISPLAY}`;
  const firstWidth = ctx.measureText("Letters to").width;
  ctx.font = `400 ${scriptSize}px ${SCRIPT}`;
  const secondWidth = ctx.measureText("Grow").width;
  const start = (1080 - firstWidth - secondWidth - 30) / 2;
  ctx.textAlign = "left";
  ctx.font = `400 ${titleSize}px ${DISPLAY}`;
  ctx.fillText("Letters to", start, y + (story ? 104 : 83));
  ctx.font = `400 ${scriptSize}px ${SCRIPT}`;
  ctx.fillText("Grow", start + firstWidth + 16, y + (story ? 115 : 92));
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(
    start + firstWidth + secondWidth + 30,
    y + (story ? 106 : 85),
    story ? 6 : 5,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}
function fallbackHeart(ctx: CanvasRenderingContext2D, box: Box): void {
  ctx.save();
  ctx.translate(box.x, box.y);
  ctx.scale(box.width / 1000, box.height / 1000);
  const path = new Path2D();
  path.moveTo(500, 180);
  path.bezierCurveTo(230, -80, -10, 110, 40, 400);
  path.bezierCurveTo(65, 620, 285, 860, 500, 990);
  path.bezierCurveTo(715, 860, 935, 620, 960, 400);
  path.bezierCurveTo(1010, 110, 770, -80, 500, 180);
  path.closePath();
  ctx.fillStyle = CREAM;
  ctx.fill(path);
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 25;
  ctx.lineCap = "round";
  ctx.setLineDash([1, 30]);
  ctx.stroke(path);
  ctx.restore();
}
function hostLine(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  y: number,
  color: string,
): void {
  const address = new URL(input.letterUrl, window.location.href);
  if (["localhost", "127.0.0.1", "[::1]"].includes(address.hostname)) return;
  ctx.font = `400 21px ${SANS}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  if (ctx.measureText(address.host).width <= 880)
    ctx.fillText(address.host, 540, y);
}
function attribution(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  box: Box,
  color = INK,
  center = true,
): void {
  textBlock(ctx, input.signoff.trim() || "Anonymous", box, {
    max: 32,
    min: 20,
    family: SANS,
    center,
    color,
    lineHeight: 1.18,
  });
}
function originLine(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  x: number,
  y: number,
  color: string,
  center: boolean,
): void {
  ctx.font = `400 20px ${SANS}`;
  ctx.textAlign = center ? "center" : "left";
  ctx.fillStyle = color;
  ctx.fillText(
    input.origin === "editorial"
      ? "Fictional editorial letter"
      : "Community letter",
    x,
    y,
  );
}
function drawHeart(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  format: CardFormat,
  heart: HTMLImageElement | null,
  ground: HTMLImageElement | null,
  logo: HTMLImageElement,
): void {
  const height = CARD_FORMATS[format].height;
  ctx.fillStyle = OLIVE;
  ctx.fillRect(0, 0, 1080, height);
  if (ground) {
    ctx.save();
    ctx.globalAlpha = 0.17;
    cover(ctx, ground, 1080, height);
    ctx.restore();
  }
  header(ctx, format, CREAM);
  const size = format === "story" ? 1010 : format === "portrait" ? 990 : 844;
  const y = format === "story" ? 500 : format === "portrait" ? 280 : 214;
  const paper = { x: (1080 - size) / 2, y, width: size, height: size };
  if (heart) contain(ctx, heart, paper);
  else fallbackHeart(ctx, paper);
  const quote = {
    x: 540 - size * 0.34,
    y: y + size * 0.255,
    width: size * 0.68,
    height: size * 0.415,
  };
  ctx.fillStyle = RED;
  ctx.textAlign = "center";
  ctx.font = `400 ${format === "square" ? 70 : 88}px ${DISPLAY}`;
  ctx.fillText("“", 540, y + size * 0.25);
  textBlock(ctx, input.excerpt, quote, {
    max: format === "square" ? 62 : 72,
    min: format === "square" ? 36 : 42,
    center: true,
    lineHeight: 1.08,
  });
  attribution(ctx, input, {
    x: 540 - size * 0.245,
    y: y + size * 0.675,
    width: size * 0.49,
    height: size * 0.115,
  });
  originLine(ctx, input, 540, y + size * 0.805, INK, true);
  contain(ctx, logo, { x: 418, y: y + size * 0.825, width: 244, height: 58 });
  if (format === "story") hostLine(ctx, input, 1640, CREAM);
  if (format === "portrait") hostLine(ctx, input, 1300, INK);
}
function drawSquare(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  format: CardFormat,
  logo: HTMLImageElement,
): void {
  const height = CARD_FORMATS[format].height;
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, 1080, height);
  header(ctx, format, INK);
  const y = format === "story" ? 505 : format === "portrait" ? 318 : 238;
  const bottom = format === "story" ? 1515 : height - 90;
  const boxHeight = bottom - y;
  ctx.fillStyle = OLIVE;
  ctx.fillRect(80, y, 920, boxHeight);
  ctx.strokeStyle = "rgba(249,246,233,.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(100, y + 20, 880, boxHeight - 40);
  ctx.fillStyle = CLAY;
  ctx.fillRect(80, y, 920, 9);
  ctx.fillStyle = RED;
  ctx.textAlign = "left";
  ctx.font = `400 100px ${DISPLAY}`;
  ctx.fillText("“", 138, y + 120);
  const quoteHeight = boxHeight - 355;
  textBlock(
    ctx,
    input.excerpt,
    { x: 145, y: y + 128, width: 790, height: quoteHeight },
    {
      max: format === "square" ? 62 : 78,
      min: format === "square" ? 38 : 44,
      color: CREAM,
      lineHeight: 1.16,
    },
  );
  const signatureY = bottom - 203;
  ctx.strokeStyle = "rgba(249,246,233,.3)";
  ctx.beginPath();
  ctx.moveTo(145, signatureY - 22);
  ctx.lineTo(935, signatureY - 22);
  ctx.stroke();
  attribution(
    ctx,
    input,
    { x: 145, y: signatureY, width: 790, height: 76 },
    CREAM,
    false,
  );
  originLine(ctx, input, 145, bottom - 91, "#e2e2d1", false);
  contain(ctx, logo, { x: 685, y: bottom - 88, width: 250, height: 58 });
  if (format === "story") hostLine(ctx, input, 1640, INK);
}
function drawFolded(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  format: CardFormat,
  logo: HTMLImageElement,
): void {
  const height = CARD_FORMATS[format].height;
  ctx.fillStyle = CLAY;
  ctx.fillRect(0, 0, 1080, height);
  header(ctx, format, INK);
  const y = format === "story" ? 505 : format === "portrait" ? 315 : 232;
  const bottom = format === "story" ? 1520 : height - 70;
  const paperHeight = bottom - y;
  ctx.fillStyle = "rgba(38,51,36,.1)";
  ctx.fillRect(93, y + 14, 900, paperHeight);
  const paper = new Path2D();
  paper.moveTo(80, y);
  paper.lineTo(902, y);
  paper.lineTo(1000, y + 98);
  paper.lineTo(1000, bottom);
  paper.lineTo(80, bottom);
  paper.closePath();
  ctx.fillStyle = CREAM;
  ctx.fill(paper);
  ctx.fillStyle = "#d8d5c6";
  ctx.beginPath();
  ctx.moveTo(902, y);
  ctx.lineTo(902, y + 98);
  ctx.lineTo(1000, y + 98);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#deddd0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, bottom - 143);
  ctx.lineTo(1000, bottom - 143);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.textAlign = "left";
  ctx.font = `400 100px ${DISPLAY}`;
  ctx.fillText("“", 145, y + 120);
  textBlock(
    ctx,
    input.excerpt,
    { x: 145, y: y + 133, width: 780, height: paperHeight - 365 },
    {
      max: format === "square" ? 60 : 74,
      min: format === "square" ? 38 : 44,
      lineHeight: 1.17,
    },
  );
  attribution(
    ctx,
    input,
    { x: 145, y: bottom - 220, width: 780, height: 82 },
    INK,
    false,
  );
  originLine(ctx, input, 145, bottom - 84, INK, false);
  contain(ctx, logo, { x: 685, y: bottom - 107, width: 250, height: 60 });
  if (format === "story") hostLine(ctx, input, 1640, INK);
}
export async function createShareCard(input: CardInput): Promise<ShareCard> {
  if (!input.excerpt.trim())
    throw new Error("Choose a sentence before making a card.");
  const format = input.format || "story";
  const style = input.style || "heart";
  const [heart, ground, logo] = await Promise.all([
    style === "heart"
      ? artwork("/art/heart-paper.webp")
      : Promise.resolve(null),
    style === "heart"
      ? artwork("/art/olive-ground.webp")
      : Promise.resolve(null),
    artwork(
      style === "square" ? "/art/tedx-logo-light.png" : "/art/tedx-logo.png",
    ),
    loadFonts(),
  ]);
  if (!logo)
    throw new Error(
      "The campaign mark could not load. Try preparing the image again.",
    );
  const canvas = document.createElement("canvas");
  canvas.width = CARD_FORMATS[format].width;
  canvas.height = CARD_FORMATS[format].height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "This browser could not create an image. Copy the letter link instead.",
    );
  ctx.textBaseline = "alphabetic";
  if (style === "heart") drawHeart(ctx, input, format, heart, ground, logo);
  if (style === "square") drawSquare(ctx, input, format, logo);
  if (style === "folded") drawFolded(ctx, input, format, logo);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(
              new Error("The image could not be prepared. Please try again."),
            ),
      "image/png",
    ),
  );
  const id =
    new URL(input.letterUrl, window.location.href).searchParams.get("letter") ||
    "excerpt";
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "excerpt";
  return {
    blob,
    url: URL.createObjectURL(blob),
    file: new File([blob], `letters-to-grow-${safeId}-${format}-${style}.png`, {
      type: "image/png",
    }),
  };
}
export function downloadCard(card: ShareCard): void {
  const anchor = document.createElement("a");
  anchor.href = card.url;
  anchor.download = card.file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
/** Prepared file passed before the first await preserves transient activation. */
export async function shareCard(
  card: ShareCard,
): Promise<"shared" | "cancelled" | "downloaded"> {
  try {
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [card.file] })
    ) {
      await navigator.share({ files: [card.file] });
      return "shared";
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      return "cancelled";
  }
  downloadCard(card);
  return "downloaded";
}
export async function copyLink(url: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
