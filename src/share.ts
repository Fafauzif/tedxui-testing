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
const RED = "#f33123";

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

function withTimeout<T>(
  task: Promise<T>,
  message: string,
  milliseconds = 7000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error(message)),
      milliseconds,
    );
    task.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function loadArtwork(path: string): Promise<HTMLImageElement> {
  return withTimeout(
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        image.decode().then(
          () => resolve(image),
          () =>
            reject(
              new Error(
                "The card artwork could not be read. Try again or copy the letter link.",
              ),
            ),
        );
      };
      image.onerror = () =>
        reject(
          new Error(
            "The card artwork could not be loaded. Try again or copy the letter link.",
          ),
        );
      image.src = path;
    }),
    "The card artwork took too long to load. Try again or copy the letter link.",
  );
}

let artwork: Promise<[HTMLImageElement, HTMLImageElement]> | undefined;
function cardArtwork(): Promise<[HTMLImageElement, HTMLImageElement]> {
  artwork ??= Promise.all([
    loadArtwork("/art/black-paper.webp"),
    loadArtwork("/art/letter-paper.webp"),
  ]).catch((error) => {
    artwork = undefined;
    throw error;
  });
  return artwork;
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

  const [images] = await Promise.all([
    cardArtwork(),
    withTimeout(
      Promise.all([
        document.fonts.load("800 112px CampaignDisplay"),
        document.fonts.load("400 60px LetterTypewriter"),
        document.fonts.load("400 24px CampaignSans"),
        document.fonts.load("400 44px Handwritten"),
        document.fonts.ready,
      ]),
      "The card fonts took too long to load. Try again or copy the letter link.",
    ),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "This browser could not create an image. Copy the letter link instead.",
    );

  const [board, paper] = images;
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // One original black-paper texture, cropped rather than stretched.
  const boardScale = Math.max(
    WIDTH / board.naturalWidth,
    HEIGHT / board.naturalHeight,
  );
  const boardWidth = board.naturalWidth * boardScale;
  const boardHeight = board.naturalHeight * boardScale;
  ctx.drawImage(
    board,
    (WIDTH - boardWidth) / 2,
    (HEIGHT - boardHeight) / 2,
    boardWidth,
    boardHeight,
  );

  // Hand-arranged condensed lettering belongs to the board, not the letter.
  // Its safe-area position leaves room for Story controls above and below.
  ctx.fillStyle = "#fffdf7";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 112px CampaignDisplay, Impact, sans-serif";
  ctx.save();
  ctx.translate(136, 316);
  ctx.rotate(-0.025);
  ctx.fillText("LETTERS", 0, 0);
  ctx.fillText("TO GROW.", 36, 112);
  ctx.restore();

  ctx.save();
  ctx.translate(833, 335);
  ctx.rotate(0.09);
  ctx.fillStyle = RED;
  ctx.font = "400 44px Handwritten, cursive";
  ctx.fillText("Still,", -80, -8);
  ctx.fillText("We Grow.", -80, 28);
  ctx.restore();

  // The generated sheet has real alpha edges and fine paper fibers.
  // Keep its geometry upright so the excerpt stays comfortable to read.
  ctx.drawImage(paper, 104, 476, 872, 1114);

  // A small irregular strip holds the page to the board. It never covers text.
  ctx.save();
  ctx.translate(551, 491);
  ctx.rotate(-0.075);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(-132, -31);
  ctx.lineTo(126, -28);
  ctx.lineTo(132, -19);
  ctx.lineTo(126, -8);
  ctx.lineTo(133, 2);
  ctx.lineTo(126, 14);
  ctx.lineTo(130, 29);
  ctx.lineTo(-127, 32);
  ctx.lineTo(-132, 20);
  ctx.lineTo(-126, 9);
  ctx.lineTo(-133, -2);
  ctx.lineTo(-127, -13);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(-118, -19, 235, 2);
  ctx.fillRect(-116, 14, 232, 1);
  ctx.restore();

  const left = 173;
  const textWidth = 734;
  ctx.fillStyle = INK;
  ctx.font = '400 29px LetterTypewriter, "Courier New", monospace';
  const salutationLines = wrapText(ctx, input.salutation, textWidth);
  salutationLines.forEach((text, index) =>
    ctx.fillText(text, left, 640 + index * 40),
  );

  const quoteTop = Math.max(762, 692 + salutationLines.length * 40);
  const quoteBottom = 1406;
  const availableHeight = quoteBottom - quoteTop;
  let quoteSize = 60;
  let quoteLines: string[] = [];
  for (; quoteSize >= 24; quoteSize -= 2) {
    ctx.font = `400 ${quoteSize}px LetterTypewriter, "Courier New", monospace`;
    quoteLines = wrapText(ctx, input.excerpt, textWidth);
    if (quoteLines.length * quoteSize * 1.29 <= availableHeight) break;
  }
  if (quoteSize < 24)
    throw new Error(
      "This excerpt is too long for a Story card. Choose a shorter sentence.",
    );
  const lineHeight = quoteSize * 1.29;
  quoteLines.forEach((text, index) =>
    ctx.fillText(text, left, quoteTop + quoteSize + index * lineHeight),
  );

  // Quiet editorial disclosure on paper, with sender attribution on the board.
  ctx.fillStyle = "#57534c";
  ctx.font = '400 23px LetterTypewriter, "Courier New", monospace';
  ctx.fillText("Example letter", left, 1512);
  ctx.fillStyle = "#fffdf7";
  ctx.font = "400 25px CampaignSans, Arial, sans-serif";
  ctx.fillText("TEDxUniversitasIndonesia", 134, 1662);

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
