/**
 * A locally generated Story-sized image, ready before a share-button click.
 * No text, images or drafts are sent to a server by this module.
 */
export interface ShareCard {
  blob: Blob;
  url: string;
  file: File;
}

type CardInput = {
  excerpt: string;
  salutation: string;
  letterUrl: string;
};

const WIDTH = 1080;
const HEIGHT = 1920;
const INK = "#302b20";
const MOSS = "#69783e";
const CREAM = "#fffbe9";
const RED = "#d8311f";

function wrapText(
  ctx: CanvasRenderingContext2D,
  value: string,
  width: number,
): string[] {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    // Long URLs or unbroken words must fit too. Break at Unicode characters,
    // rather than assuming every input contains conveniently short words.
    if (ctx.measureText(word).width > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      let piece = "";
      for (const character of Array.from(word)) {
        if (piece && ctx.measureText(piece + character).width > width) {
          lines.push(piece);
          piece = character;
        } else {
          piece += character;
        }
      }
      current = piece;
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Decoration is optional: never make an image wait on the network. */
function settleWithin<T>(
  task: Promise<T>,
  fallback: T,
  milliseconds = 1000,
): Promise<T> {
  return new Promise<T>((resolve) => {
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
function optionalArtwork(path: string): Promise<HTMLImageElement | null> {
  const ready = loadedArtwork.get(path);
  if (ready) return Promise.resolve(ready);
  let pending = pendingArtwork.get(path);
  if (!pending) {
    pending = new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const decoded =
          typeof image.decode === "function"
            ? image.decode()
            : Promise.resolve();
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
  // If loading finishes after this deadline, cache it for the next card.
  return settleWithin(pending, null);
}

const availableFonts = new Set<string>();
async function optionalFonts(): Promise<void> {
  if (!document.fonts || typeof document.fonts.load !== "function") return;
  const specs = [
    ["LetterDisplay", "italic 500 140px LetterDisplay"],
    ["LetterTypewriter", "400 60px LetterTypewriter"],
    ["CampaignSans", "400 24px CampaignSans"],
  ];
  const loading = Promise.all(
    specs.map(async ([family, specification]) => {
      if (availableFonts.has(family)) return;
      try {
        const faces = await document.fonts.load(specification);
        if (faces.some((face) => face.status === "loaded"))
          availableFonts.add(family);
      } catch {
        // The system font is part of the design's readable fallback.
      }
    }),
  ).then(() => undefined);
  await settleWithin(loading, undefined);
}

function filenameFromUrl(value: string): string {
  try {
    const parsed = new URL(value, window.location.href);
    const id =
      parsed.searchParams.get("letter") ||
      parsed.searchParams.get("id") ||
      "excerpt";
    return `letters-to-grow-${id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "excerpt"}.png`;
  } catch {
    return "letters-to-grow-excerpt.png";
  }
}

/** Keep the collage natural without stretching its flowers or leaves. */
function drawContained(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (!image?.naturalWidth || !image.naturalHeight) return;
  const scale = Math.min(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  ctx.drawImage(
    image,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  );
}

export async function createShareCard(input: CardInput): Promise<ShareCard> {
  if (!input.excerpt.trim())
    throw new Error("Choose a sentence before making a card.");

  const [grain, paper, sprig, flower] = await Promise.all([
    optionalArtwork("/art/black-paper.webp"),
    optionalArtwork("/art/letter-paper.webp"),
    optionalArtwork("/art/botanical-sprig.webp"),
    optionalArtwork("/art/white-flower.webp"),
    optionalFonts(),
  ]);
  const displayFamily = availableFonts.has("LetterDisplay")
    ? "LetterDisplay"
    : "Georgia";
  const readingFamily = availableFonts.has("LetterTypewriter")
    ? "LetterTypewriter"
    : '"Courier New"';
  const uiFamily = availableFonts.has("CampaignSans")
    ? "CampaignSans"
    : "Arial";

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "This browser could not create an image. Copy the letter link instead.",
    );

  // Colour and legibility never depend on an illustration or font arriving.
  ctx.fillStyle = MOSS;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (grain?.naturalWidth && grain.naturalHeight) {
    const scale = Math.max(
      WIDTH / grain.naturalWidth,
      HEIGHT / grain.naturalHeight,
    );
    const width = grain.naturalWidth * scale;
    const height = grain.naturalHeight * scale;
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.2;
    ctx.drawImage(
      grain,
      (WIDTH - width) / 2,
      (HEIGHT - height) / 2,
      width,
      height,
    );
    ctx.restore();
  }

  // Two small botanical pieces sit behind the paper, never over its words.
  ctx.save();
  ctx.translate(900, 654);
  ctx.rotate(0.2);
  drawContained(ctx, sprig, -145, -270, 290, 540);
  ctx.restore();
  drawContained(ctx, flower, 12, 1288, 275, 320);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  let displaySize = 140;
  do {
    ctx.font = `italic 500 ${displaySize}px ${displayFamily}, Georgia, serif`;
    if (ctx.measureText("Letters to").width <= 790) break;
    displaySize -= 2;
  } while (displaySize > 80);
  ctx.fillText("Letters to", 129, 321);
  ctx.font = `italic 500 ${Math.min(displaySize + 8, 148)}px ${displayFamily}, Georgia, serif`;
  ctx.fillText("Grow", 256, 434);
  const growWidth = ctx.measureText("Grow").width;
  ctx.fillStyle = RED;
  ctx.fillText(".", 256 + growWidth + 3, 434);

  // A complete cream page is present even with all decorative assets blocked.
  const page = new Path2D();
  page.moveTo(134, 552);
  page.lineTo(941, 548);
  page.lineTo(950, 577);
  page.lineTo(946, 932);
  page.lineTo(952, 1304);
  page.lineTo(941, 1538);
  page.lineTo(135, 1540);
  page.lineTo(127, 1308);
  page.lineTo(132, 925);
  page.lineTo(126, 580);
  page.closePath();
  ctx.save();
  ctx.shadowColor = "rgba(32, 43, 17, 0.16)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = CREAM;
  ctx.fill(page);
  ctx.restore();
  if (paper?.naturalWidth && paper.naturalHeight) {
    ctx.save();
    ctx.clip(page);
    // The same tactile artwork as the on-screen letter, softly blended into cream.
    ctx.globalAlpha = 0.6;
    ctx.drawImage(paper, 104, 524, 872, 1040);
    ctx.restore();
  }

  const left = 177;
  const textWidth = 726;
  ctx.fillStyle = INK;
  ctx.font = `400 29px ${readingFamily}, monospace`;
  const salutationLines = wrapText(ctx, input.salutation, textWidth);
  salutationLines.forEach((text, index) =>
    ctx.fillText(text, left, 668 + index * 40),
  );

  const quoteTop = Math.max(778, 710 + salutationLines.length * 40);
  const quoteBottom = 1382;
  const availableHeight = quoteBottom - quoteTop;
  let quoteSize = 58;
  let quoteLines: string[] = [];
  for (; quoteSize >= 24; quoteSize -= 2) {
    ctx.font = `400 ${quoteSize}px ${readingFamily}, monospace`;
    quoteLines = wrapText(ctx, input.excerpt, textWidth);
    if (quoteLines.length * quoteSize * 1.29 <= availableHeight) break;
  }
  if (quoteSize < 24)
    throw new Error(
      "This excerpt is too long for a Story card. Choose a shorter sentence.",
    );
  ctx.fillStyle = INK;
  const lineHeight = quoteSize * 1.29;
  const textHeight = quoteLines.length * lineHeight;
  const firstBaseline =
    quoteTop + Math.max(0, (availableHeight - textHeight) / 2) + quoteSize;
  quoteLines.forEach((text, index) =>
    ctx.fillText(text, left, firstBaseline + index * lineHeight),
  );

  ctx.fillStyle = "#69634e";
  ctx.font = `400 23px ${readingFamily}, monospace`;
  ctx.fillText("Example letter", left, 1478);

  ctx.fillStyle = CREAM;
  ctx.font = `italic 500 43px ${displayFamily}, Georgia, serif`;
  ctx.fillText("Still, We Grow.", 134, 1654);
  ctx.font = `400 25px ${uiFamily}, Arial, sans-serif`;
  ctx.fillText("TEDxUniversitasIndonesia", 134, 1714);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(
              new Error(
                "The image could not be prepared. Try again or copy the letter link.",
              ),
            ),
      "image/png",
    );
  });

  return {
    blob,
    url: URL.createObjectURL(blob),
    file: new File([blob], filenameFromUrl(input.letterUrl), {
      type: "image/png",
    }),
  };
}

/** The caller retains ownership of card.url and revokes it when its preview closes. */
export function downloadCard(card: ShareCard): void {
  const anchor = document.createElement("a");
  anchor.href = card.url;
  anchor.download = card.file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Call directly from a click with a card that has already been generated.
 * No awaited work runs before navigator.share, preserving transient activation.
 * "shared" means handed to the OS share flow, not published to a social account.
 */
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
    // Permissions, unsupported targets and in-app browser errors all retain
    // a useful fallback. A user cancellation deliberately does not download.
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
