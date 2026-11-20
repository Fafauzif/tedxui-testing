import type { PublicLetter } from "./api";

export type ReaderError = "missing" | "service" | "empty";
export interface ReaderBootstrap {
  version: 1;
  requestedId: string | null;
  letter: PublicLetter | null;
  error: ReaderError | null;
}

function isLetter(value: unknown): value is PublicLetter {
  if (!value || typeof value !== "object") return false;
  const letter = value as Record<string, unknown>;
  return (
    typeof letter.id === "string" &&
    (letter.origin === "editorial" || letter.origin === "community") &&
    typeof letter.salutation === "string" &&
    Array.isArray(letter.paragraphs) &&
    letter.paragraphs.every((paragraph) => typeof paragraph === "string") &&
    typeof letter.signoff === "string" &&
    typeof letter.excerpt === "string" &&
    Array.isArray(letter.excerpts) &&
    letter.excerpts.every((excerpt) => typeof excerpt === "string") &&
    typeof letter.topic === "string" &&
    Array.isArray(letter.paths) &&
    typeof letter.createdAt === "string"
  );
}

/** Read once at app startup. Later navigation always checks current visibility. */
export function readReaderBootstrap(): ReaderBootstrap | null {
  const query = new URLSearchParams(location.search);
  if (query.has("write") || query.has("community")) return null;
  const node = document.getElementById("ltg-reader-bootstrap");
  if (!node || node.getAttribute("type") !== "application/json") return null;
  try {
    const value: unknown = JSON.parse(node.textContent || "");
    if (!value || typeof value !== "object") return null;
    const candidate = value as Record<string, unknown>;
    const requestedId = query.has("letter") ? query.get("letter") : null;
    if (
      candidate.version !== 1 ||
      candidate.requestedId !== requestedId ||
      ![null, "missing", "service", "empty"].includes(candidate.error as string | null)
    ) return null;
    if (candidate.letter !== null && !isLetter(candidate.letter)) return null;
    if ((candidate.letter === null) !== (candidate.error !== null)) return null;
    if (
      candidate.letter &&
      requestedId !== null &&
      (candidate.letter as PublicLetter).id !== requestedId
    ) return null;
    return candidate as unknown as ReaderBootstrap;
  } catch {
    return null;
  }
}
