/** The preview, downloaded PNG and native shared file all use these same bytes. */
export interface ShareCard {
  blob: Blob;
  url: string;
  file: File;
}

export type CardInput = {
  excerpt: string;
  salutation: string;
  letterUrl: string;
  signoff: string;
  origin: "editorial" | "community";
};

const WIDTH = 1080;
const HEIGHT = 1920;
const CREAM = "#FFFBED";
const INK = "#302B20";
const OLIVE = "#57652E";
const RED = "#CA301D";
const graphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

function wrapText(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (ctx.measureText(word).width > width) {
      if (current) lines.push(current);
      current = "";
      for (const { segment } of graphemeSegmenter.segment(word)) {
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

function settleWithin<T>(task: Promise<T>, fallback: T, milliseconds = 2000): Promise<T> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(fallback), milliseconds);
    task.then((value) => { window.clearTimeout(timeout); resolve(value); },
      () => { window.clearTimeout(timeout); resolve(fallback); });
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
        decoded.then(() => { loadedArtwork.set(path, image); resolve(image); }, () => resolve(null));
      };
      image.onerror = () => resolve(null);
      image.src = path;
    });
    pendingArtwork.set(path, pending);
    void pending.then(() => pendingArtwork.delete(path));
  }
  return settleWithin(pending, null);
}

async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  await settleWithin(Promise.all([
    document.fonts.load("500 70px LetterDisplay"),
    document.fonts.load("italic 500 120px LetterDisplay"),
    document.fonts.load("400 28px CampaignSans"),
  ]).then(() => undefined), undefined);
}

function drawContained(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
  const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
}

/** A scalloped paper silhouette also works when decorative artwork is unavailable. */
function fallbackHeart(ctx: CanvasRenderingContext2D): void {
  const path = new Path2D();
  path.moveTo(540, 680);
  path.bezierCurveTo(270, 420, 30, 620, 80, 920);
  path.bezierCurveTo(110, 1150, 330, 1390, 540, 1530);
  path.bezierCurveTo(750, 1390, 970, 1150, 1000, 920);
  path.bezierCurveTo(1050, 620, 810, 420, 540, 680);
  path.closePath();
  ctx.fillStyle = CREAM;
  ctx.fill(path);
  ctx.save();
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 28;
  ctx.lineCap = "round";
  ctx.setLineDash([1, 34]);
  ctx.stroke(path);
  ctx.restore();
}

function filenameFromUrl(value: string): string {
  const parsed = new URL(value, window.location.href);
  const id = parsed.searchParams.get("letter") || "excerpt";
  return `letters-to-grow-${id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "excerpt"}.png`;
}

export async function createShareCard(input: CardInput): Promise<ShareCard> {
  if (!input.excerpt.trim()) throw new Error("Choose a sentence before making a card.");
  const [ground, heart, logo] = await Promise.all([
    artwork("/art/olive-ground.webp"),
    artwork("/art/heart-paper.webp"),
    artwork("/art/tedx-logo.png"),
    loadFonts(),
  ]);
  if (!logo) throw new Error("The campaign mark could not load. Try preparing the image again.");
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not create an image. Copy the letter link instead.");

  ctx.fillStyle = OLIVE;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (ground) drawCover(ctx, ground);
  ctx.fillStyle = "rgba(44, 53, 24, .1)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = "400 24px CampaignSans, Arial, sans-serif";
  ctx.fillText("STILL, WE GROW", 540, 286);
  ctx.font = "italic 500 114px LetterDisplay, Georgia, serif";
  ctx.fillText("Letters to Grow", 530, 412);
  const titleWidth = ctx.measureText("Letters to Grow").width;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(530 + titleWidth / 2 + 12, 404, 6, 0, Math.PI * 2);
  ctx.fill();

  if (heart) drawContained(ctx, heart, 20, 520, 1040, 1040);
  else fallbackHeart(ctx);

  // The broad central area remains clear of both the notch and tapered point.
  const quoteWidth = 712;
  let quoteSize = 72;
  let quoteLines: string[] = [];
  for (; quoteSize >= 62; quoteSize -= 2) {
    ctx.font = `500 ${quoteSize}px LetterDisplay, Georgia, serif`;
    quoteLines = wrapText(ctx, input.excerpt, quoteWidth);
    if (quoteLines.length * quoteSize * 1.08 <= 454) break;
  }
  if (quoteSize < 62) {
    throw new Error("This line is too long for a readable Story card. Choose a shorter passage.");
  }
  const lineHeight = quoteSize * 1.08;
  const quoteTop = 773 + (454 - quoteLines.length * lineHeight) / 2;
  ctx.fillStyle = RED;
  ctx.font = "italic 500 100px LetterDisplay, Georgia, serif";
  ctx.fillText("“", 540, 775);
  ctx.fillStyle = INK;
  ctx.font = `500 ${quoteSize}px LetterDisplay, Georgia, serif`;
  quoteLines.forEach((line, index) => ctx.fillText(line, 540, quoteTop + quoteSize + index * lineHeight));

  // The exact byline is always rendered, including anonymous public letters.
  ctx.font = "500 34px LetterDisplay, Georgia, serif";
  const signature = input.signoff.trim() || "Anonymous";
  const signatureLines = wrapText(ctx, signature, 514);
  if (signatureLines.length > 3) throw new Error("This signature is too long for the Story card.");
  signatureLines.forEach((line, index) => ctx.fillText(line, 540, 1252 + index * 37));
  ctx.fillStyle = "#70694F";
  ctx.font = "400 23px CampaignSans, Arial, sans-serif";
  ctx.fillText(input.origin === "editorial" ? "Fictional editorial letter" : "Community letter", 540, 1377);
  drawContained(ctx, logo, 402, 1392, 276, 68);

  ctx.fillStyle = CREAM;
  ctx.font = "italic 500 42px LetterDisplay, Georgia, serif";
  ctx.fillText("A little more room to grow.", 540, 1610);
  const address = new URL(input.letterUrl, window.location.href);
  const host = address.host;
  const isLocalAddress = address.hostname === "localhost" || address.hostname === "127.0.0.1" || address.hostname === "[::1]";
  ctx.font = "400 22px CampaignSans, Arial, sans-serif";
  if (!isLocalAddress && ctx.measureText(host).width < 820) ctx.fillText(host, 540, 1650);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The image could not be prepared. Try again or copy the letter link.")), "image/png");
  });
  return { blob, url: URL.createObjectURL(blob), file: new File([blob], filenameFromUrl(input.letterUrl), { type: "image/png" }) };
}

/** The preview owner revokes card.url after it is replaced or dismissed. */
export function downloadCard(card: ShareCard): void {
  const anchor = document.createElement("a");
  anchor.href = card.url;
  anchor.download = card.file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Invoke directly from a tap with a prepared file to preserve user activation. */
export async function shareCard(card: ShareCard): Promise<"shared" | "cancelled" | "downloaded"> {
  try {
    if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [card.file] })) {
      await navigator.share({ files: [card.file] });
      return "shared";
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
  }
  downloadCard(card);
  return "downloaded";
}

export async function copyLink(url: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(url);
    return true;
  } catch { return false; }
}
