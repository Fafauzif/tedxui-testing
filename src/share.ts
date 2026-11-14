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
const INK = "#171717";
const RED = "#e62b1e";
const PAPER = "#fffefa";

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

function line(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width = 2,
) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
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

export async function createShareCard(input: CardInput): Promise<ShareCard> {
  if (!input.excerpt.trim())
    throw new Error("Choose a sentence before making a card.");

  // Explicit loads matter: a canvas family may not have appeared in the DOM.
  // A rejected font load can use the defined serif/sans fallbacks instead.
  await Promise.allSettled([
    document.fonts.load("400 66px LetterSerif"),
    document.fonts.load("700 78px CampaignSans"),
  ]);
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "This browser could not create an image. Copy the letter link instead.",
    );

  ctx.fillStyle = "#f0efeb";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // A real paper-and-envelope composition, rather than an app screenshot.
  ctx.fillStyle = PAPER;
  ctx.fillRect(61, 188, 958, 1478);
  line(
    ctx,
    [
      [62, 188],
      [1018, 188],
      [1018, 1666],
      [62, 1666],
      [62, 188],
    ],
    "#dedbd4",
    2,
  );

  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 78px CampaignSans, Arial, sans-serif";
  ctx.fillText("Letters", 132, 307);
  ctx.fillText("to Grow", 132, 390);

  // Postmark: a small material cue, not an invented metric or official stamp.
  ctx.save();
  ctx.translate(854, 315);
  ctx.rotate(-0.12);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 59, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.textAlign = "center";
  ctx.font = "700 19px CampaignSans, Arial, sans-serif";
  ctx.fillText("STILL,", 0, -3);
  ctx.fillText("WE GROW", 0, 22);
  ctx.restore();

  ctx.fillStyle = "#575550";
  ctx.font = "400 27px LetterSerif, Georgia, serif";
  const salutationLines = wrapText(ctx, input.salutation, 796);
  salutationLines.forEach((text, index) =>
    ctx.fillText(text, 134, 536 + index * 38),
  );

  const quoteTop = Math.max(656, 578 + salutationLines.length * 38);
  const quoteBottom = 1194;
  const availableHeight = quoteBottom - quoteTop;
  let quoteSize = 66;
  let quoteLines: string[] = [];
  for (; quoteSize >= 24; quoteSize -= 2) {
    ctx.font = `400 ${quoteSize}px LetterSerif, Georgia, serif`;
    quoteLines = wrapText(ctx, input.excerpt, 796);
    if (quoteLines.length * quoteSize * 1.32 <= availableHeight) break;
  }
  if (quoteSize < 24) {
    throw new Error(
      "This excerpt is too long for a Story card. Choose a shorter sentence.",
    );
  }
  ctx.fillStyle = INK;
  const lineHeight = quoteSize * 1.32;
  quoteLines.forEach((text, index) =>
    ctx.fillText(text, 134, quoteTop + quoteSize + index * lineHeight),
  );

  // Red folded envelope. All content stays above/below its fold for readability.
  const envelopeTop = 1280;
  const envelopeBottom = 1534;
  ctx.fillStyle = RED;
  ctx.fillRect(102, envelopeTop, 876, envelopeBottom - envelopeTop);
  line(
    ctx,
    [
      [102, envelopeTop],
      [540, 1462],
      [978, envelopeTop],
    ],
    "#fffefa",
    3,
  );
  line(
    ctx,
    [
      [102, envelopeBottom],
      [394, 1401],
    ],
    "#c31d12",
    2,
  );
  line(
    ctx,
    [
      [978, envelopeBottom],
      [686, 1401],
    ],
    "#c31d12",
    2,
  );

  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.font = "400 24px CampaignSans, Arial, sans-serif";
  ctx.fillText("TEDxUniversitasIndonesia", 134, 1601);
  ctx.fillStyle = "#575550";
  ctx.textAlign = "right";
  ctx.font = "400 20px CampaignSans, Arial, sans-serif";
  ctx.fillText("Example letter", 946, 1601);

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
