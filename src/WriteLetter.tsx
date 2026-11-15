import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  DownloadSimple,
  FloppyDisk,
  PencilSimple,
} from "@phosphor-icons/react";
import "./writer.css";

type Draft = { to: string; body: string; signature: string };
const STORAGE_KEY = "letters-to-grow:private-draft:v1";
const EMPTY_DRAFT: Draft = { to: "", body: "", signature: "" };
let memoryDraft: Draft | null = null;

function restoreDraft(): {
  draft: Draft;
  saved: boolean;
  savedDraft: Draft | null;
} {
  let stored: Draft | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (value && typeof value === "object") {
        const candidate = value as Record<string, unknown>;
        if (
          typeof candidate.to === "string" &&
          typeof candidate.body === "string" &&
          typeof candidate.signature === "string"
        ) {
          stored = {
            to: candidate.to.slice(0, 100),
            body: candidate.body.slice(0, 5000),
            signature: candidate.signature.slice(0, 80),
          };
        }
      }
    }
  } catch {
    // Writing and downloading still work if browser storage is unavailable.
  }
  const draft = memoryDraft ?? stored ?? { ...EMPTY_DRAFT };
  memoryDraft = draft;
  return { draft, saved: Boolean(stored), savedDraft: stored };
}

function letterText(draft: Draft): string {
  return [draft.to.trim(), draft.body.trim(), draft.signature.trim()]
    .filter(Boolean)
    .join("\n\n");
}

export default function WriteLetter({ onBack }: { onBack: () => void }) {
  const initial = useRef<ReturnType<typeof restoreDraft> | null>(null);
  if (!initial.current) initial.current = restoreDraft();
  const [draft, setDraft] = useState<Draft>(initial.current.draft);
  const [hasSavedCopy, setHasSavedCopy] = useState(initial.current.saved);
  const [savedSnapshot, setSavedSnapshot] = useState<Draft | null>(
    initial.current.savedDraft,
  );
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const returningToEdit = useRef(false);
  const hasUnsavedWriting =
    Boolean(letterText(draft)) &&
    JSON.stringify(draft) !== JSON.stringify(savedSnapshot);

  useEffect(() => {
    if (!hasUnsavedWriting) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedWriting]);

  useEffect(() => {
    if (preview) previewHeading.current?.focus({ preventScroll: true });
    else if (returningToEdit.current) {
      bodyInput.current?.focus({ preventScroll: true });
      returningToEdit.current = false;
    }
  }, [preview]);

  function change(field: keyof Draft, value: string) {
    const next = { ...draft, [field]: value };
    memoryDraft = next;
    setDraft(next);
    setStatus("");
    setError("");
    if (field === "body") setBodyError("");
  }

  function validateBody(): boolean {
    if (draft.body.trim()) {
      setBodyError("");
      return true;
    }
    setError("");
    setBodyError("Write a few words in your letter first.");
    setPreview(false);
    bodyInput.current?.focus();
    return false;
  }

  function saveDraft() {
    setError("");
    setBodyError("");
    if (!letterText(draft)) {
      setBodyError("Add a line before saving a draft.");
      bodyInput.current?.focus();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setHasSavedCopy(true);
      setSavedSnapshot(draft);
      setStatus("Draft saved in this browser on this device.");
    } catch {
      setError(
        "This browser could not save a draft. Your words are still here. Download a copy instead.",
      );
    }
  }

  function downloadLetter() {
    if (!validateBody()) return;
    let url: string | null = null;
    try {
      const file = new Blob([letterText(draft) + "\n"], {
        type: "text/plain;charset=utf-8",
      });
      url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "my-letter-to-grow.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      const downloadUrl = url;
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
      setStatus(
        "Letter download started. Find the text file in your downloads.",
      );
      setError("");
    } catch {
      if (url) URL.revokeObjectURL(url);
      setError(
        "The download could not start. You can still select and copy your words.",
      );
    }
  }

  function removeSavedCopy() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasSavedCopy(false);
      setSavedSnapshot(null);
      setStatus(
        "Saved copy removed from this browser. Your current words are still on this page.",
      );
      setError("");
    } catch {
      setError(
        "This browser could not remove its saved copy. Your current words are still here.",
      );
    }
  }

  return (
    <section className="writer" aria-labelledby="writer-heading">
      <div className="writer-heading-row">
        <button className="writer-back" type="button" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to letters
        </button>
        <h1 id="writer-heading" tabIndex={-1}>
          Write a letter
        </h1>
        <p className="writer-introduction">
          Something you are still figuring out. Someone you have been meaning to
          write to.
        </p>
      </div>
      <p className="writer-privacy" id="writer-privacy">
        Your writing stays on this page unless you save a draft on this device
        or download it. This preview does not send letters.
      </p>
      <div className="writer-paper">
        {preview ? (
          <article
            className="writer-preview"
            aria-labelledby="writer-preview-heading"
          >
            <div className="writer-preview-topline">
              <span>Your draft</span>
              <button
                className="writer-inline-button"
                type="button"
                onClick={() => {
                  returningToEdit.current = true;
                  setPreview(false);
                  setError("");
                }}
              >
                <PencilSimple size={17} aria-hidden="true" />
                Back to editing
              </button>
            </div>
            <h2 id="writer-preview-heading" ref={previewHeading} tabIndex={-1}>
              {draft.to.trim() || "Your letter"}
            </h2>
            <div className="writer-preview-body">{draft.body}</div>
            {draft.signature.trim() && (
              <p className="writer-signature">{draft.signature}</p>
            )}
          </article>
        ) : (
          <form
            className="writer-form"
            aria-describedby="writer-privacy"
            onSubmit={(event) => {
              event.preventDefault();
              if (validateBody()) {
                setError("");
                setStatus("");
                setPreview(true);
              }
            }}
          >
            <label htmlFor="letter-to">
              Who is it for? <span>(optional)</span>
            </label>
            <input
              id="letter-to"
              autoComplete="off"
              value={draft.to}
              onChange={(event) => change("to", event.target.value)}
              maxLength={100}
              placeholder="To someone starting over,"
            />
            <label htmlFor="letter-body">Your letter</label>
            <textarea
              id="letter-body"
              ref={bodyInput}
              value={draft.body}
              onChange={(event) => change("body", event.target.value)}
              maxLength={5000}
              placeholder="Start wherever you like."
              aria-describedby={
                bodyError ? "writer-length writer-body-error" : "writer-length"
              }
              aria-invalid={bodyError ? true : undefined}
              spellCheck
            />
            {bodyError && (
              <p
                className="writer-error writer-body-error"
                id="writer-body-error"
                role="alert"
              >
                {bodyError}
              </p>
            )}
            <p className="writer-length" id="writer-length">
              {draft.body.length.toLocaleString("en-US")} / 5,000 characters
            </p>
            <label htmlFor="letter-signature">
              Sign off <span>(optional)</span>
            </label>
            <input
              id="letter-signature"
              autoComplete="off"
              value={draft.signature}
              onChange={(event) => change("signature", event.target.value)}
              maxLength={80}
              placeholder="Someone still learning"
            />
            <button className="writer-preview-button" type="submit">
              Preview letter <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
      <div className="writer-actions" aria-label="Keep your letter">
        <button className="writer-save" type="button" onClick={saveDraft}>
          <FloppyDisk size={19} aria-hidden="true" />
          Keep draft on this device
        </button>
        <button
          className="writer-download"
          type="button"
          onClick={downloadLetter}
        >
          <DownloadSimple size={19} aria-hidden="true" />
          Download letter
        </button>
      </div>
      <div className="writer-feedback">
        <p className="writer-status" role="status" aria-live="polite">
          {status}
        </p>
        {error && (
          <p className="writer-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {hasSavedCopy && (
        <button
          className="writer-remove"
          type="button"
          onClick={removeSavedCopy}
        >
          Remove saved copy from this browser
        </button>
      )}
      <p className="writer-device-note">
        Edits stay in this tab until you close or refresh it. They are not saved
        automatically. A saved draft belongs to this browser. On a shared
        device, download your letter and remove the saved copy when you are
        done.
      </p>
    </section>
  );
}
