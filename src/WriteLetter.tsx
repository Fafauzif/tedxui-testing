import { useEffect, useRef, useState } from "react";
import {
  DownloadSimple,
  FloppyDisk,
  PencilSimple,
} from "@phosphor-icons/react";
import type { PublicLetter } from "./api";
import { excerptOptions } from "./excerpts";
import "./writer.css";

type Draft = { to: string; body: string; signature: string };
type Submission = Draft & { excerpt: string; submissionKey: string };
const STORAGE_KEY = "letters-to-grow:private-draft:v1";
const PENDING_KEY = "letters-to-grow:pending-publication:v1";
const EMPTY_DRAFT: Draft = { to: "", body: "", signature: "" };
let memoryDraft: Draft | null = null;
let memoryPending: Submission | null = null;

function validDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.to === "string" &&
    candidate.to.length <= 100 &&
    typeof candidate.body === "string" &&
    candidate.body.length <= 5000 &&
    typeof candidate.signature === "string" &&
    candidate.signature.length <= 80
  );
}

function readStored<T>(
  key: string,
  validate: (value: unknown) => value is T,
): T | null {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validSubmission(value: unknown): value is Submission {
  if (!validDraft(value)) return false;
  const candidate = value as unknown as Record<string, unknown>;
  return (
    typeof candidate.excerpt === "string" &&
    typeof candidate.submissionKey === "string"
  );
}

function restore() {
  const saved = readStored(STORAGE_KEY, validDraft);
  const pending = memoryPending ?? readStored(PENDING_KEY, validSubmission);
  const draft = pending
    ? { to: pending.to, body: pending.body, signature: pending.signature }
    : (memoryDraft ?? saved ?? { ...EMPTY_DRAFT });
  memoryDraft = draft;
  memoryPending = pending;
  return { draft, saved, pending };
}

function textFile(draft: Draft): string {
  return [draft.to.trim(), draft.body.trim(), draft.signature.trim()]
    .filter(Boolean)
    .join("\n\n");
}

function requestKey(): string {
  return crypto.randomUUID();
}

export default function WriteLetter({
  onBack,
  onPublished,
}: {
  onBack: () => void;
  onPublished: (letter: PublicLetter) => void;
}) {
  const initial = useRef<ReturnType<typeof restore> | null>(null);
  if (!initial.current) initial.current = restore();
  const [draft, setDraft] = useState<Draft>(initial.current.draft);
  const [saved, setSaved] = useState<Draft | null>(initial.current.saved);
  const [pending, setPending] = useState<Submission | null>(
    initial.current.pending,
  );
  const [preview, setPreview] = useState(Boolean(initial.current.pending));
  const [excerpt, setExcerpt] = useState(
    initial.current.pending?.excerpt ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [status, setStatus] = useState(
    initial.current.pending
      ? "A publication is awaiting confirmation. Retry publication to check its permanent link."
      : "",
  );
  const [error, setError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const confirmed = useRef(false);
  const choices = excerptOptions(draft.body.trim());
  const selectedExcerpt = excerpt || choices[0] || "";
  const unsaved =
    Boolean(textFile(draft)) && JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!unsaved && !pending) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (confirmed.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved, pending]);

  useEffect(() => {
    if (preview) previewHeading.current?.focus({ preventScroll: true });
  }, [preview]);

  function change(field: keyof Draft, value: string) {
    const next = { ...draft, [field]: value };
    memoryDraft = next;
    setDraft(next);
    if (field === "body") {
      setExcerpt("");
      setBodyError("");
    }
    setStatus("");
    setError("");
    setRemoved(false);
  }

  function checkBody(): boolean {
    if (draft.body.trim()) {
      setBodyError("");
      return true;
    }
    setBodyError("Write a few words in your letter first.");
    setPreview(false);
    bodyInput.current?.focus();
    return false;
  }

  function saveDraft() {
    if (!textFile(draft)) {
      setError("Add a line before saving a draft.");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaved({ ...draft });
      setStatus("Saved on this device.");
      setError("");
    } catch {
      setError(
        "This browser could not save your draft. Download your letter to keep a copy.",
      );
    }
  }

  function removeSaved() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSaved(null);
      setStatus("Saved copy removed. Your current words are still here.");
      setError("");
    } catch {
      setError(
        "This browser could not remove the saved copy. Your current words are still here.",
      );
    }
  }

  function download() {
    if (!checkBody()) return;
    try {
      const url = URL.createObjectURL(
        new Blob([textFile(draft) + "\n"], {
          type: "text/plain;charset=utf-8",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "my-letter-to-grow.txt";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus("Letter download started.");
      setError("");
    } catch {
      setError(
        "The download could not start. You can still select and copy your words.",
      );
    }
  }

  function clearPending() {
    memoryPending = null;
    setPending(null);
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      /* Current-tab state still reconciles. */
    }
  }

  async function publish() {
    if (submitting.current || removed) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    const submission = pending ?? {
      to: draft.to.trim(),
      body: draft.body.trim(),
      signature: draft.signature.trim(),
      excerpt: selectedExcerpt,
      submissionKey: requestKey(),
    };
    memoryPending = submission;
    setPending(submission);
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(submission));
    } catch {
      setStatus(
        "Keep this tab open until publication is confirmed. This browser could not keep a recovery copy.",
      );
    }
    const timeout = new AbortController();
    const timer = window.setTimeout(() => timeout.abort(), 25000);
    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        signal: timeout.signal,
      });
      const result = (await response.json()) as {
        letter?: PublicLetter;
        visibility?: string;
        error?: { code?: string; message?: string };
      };
      if (!mounted.current) return;
      if (response.ok && result.letter && result.visibility === "visible") {
        confirmed.current = true;
        clearPending();
        onPublished(result.letter);
        return;
      }
      if (response.status === 410) {
        clearPending();
        setRemoved(true);
        setError(
          "This letter is unavailable. Your words are still here to download or save on this device.",
        );
      } else if (
        response.status === 409 &&
        result.error?.code === "IDEMPOTENCY_CONFLICT"
      ) {
        clearPending();
        setError(
          "This publication attempt belongs to different text. Review your letter, then publish it as a new attempt.",
        );
      } else if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 409
      ) {
        clearPending();
        setError(
          result.error?.message ||
            "Your letter could not be published. Check your writing and try again.",
        );
      } else {
        setError(
          result.error?.message ||
            "Publication could not be confirmed. Retry publication to check the same letter.",
        );
      }
    } catch {
      if (mounted.current)
        setError(
          "Publication could not be confirmed. Your words are kept here. Retry publication to check the same letter.",
        );
    } finally {
      window.clearTimeout(timer);
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function edit() {
    setPreview(false);
    setError("");
    window.setTimeout(() => bodyInput.current?.focus(), 0);
  }

  return (
    <section className="writer" aria-labelledby="writer-heading">
      <div className="writer-heading-row">
        <button
          className="writer-back"
          type="button"
          onClick={onBack}
          disabled={busy}
        >
          Back to letters
        </button>
        <p className="eyebrow">What are you still figuring out?</p>
        <h1 id="writer-heading">
          Write <span>a letter.</span>
        </h1>
        <p className="writer-introduction">
          For someone going through it. For the person you used to be. Start
          wherever you like.
        </p>
      </div>
      <p className="writer-privacy" id="writer-privacy">
        Your draft stays with you until you choose Publish letter.
      </p>
      <div className="writer-paper">
        {preview ? (
          <div>
            <article
              className="writer-preview"
              aria-labelledby="writer-preview-heading"
            >
              <div className="writer-preview-topline">
                <span>Letter preview</span>
                <button
                  className="writer-inline-button"
                  type="button"
                  onClick={edit}
                  disabled={busy || Boolean(pending)}
                >
                  <PencilSimple size={16} aria-hidden="true" /> Back to editing
                </button>
              </div>
              <h2
                id="writer-preview-heading"
                ref={previewHeading}
                tabIndex={-1}
              >
                {draft.to.trim() || "To someone still growing,"}
              </h2>
              <div className="writer-preview-body">{draft.body.trim()}</div>
              <p className="writer-signature">
                {draft.signature.trim() || "Anonymous"}
              </p>
              <p className="writer-preview-origin">Community letter</p>
            </article>
            <fieldset
              className="writer-excerpts"
              disabled={busy || Boolean(pending)}
            >
              <legend>A line for your Story</legend>
              <p>This line appears on the card readers can share.</p>
              {Array.from(new Set([selectedExcerpt, ...choices]))
                .filter(Boolean)
                .map((option) => (
                  <label
                    key={option}
                    className={selectedExcerpt === option ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="writer-excerpt"
                      checked={selectedExcerpt === option}
                      onChange={() => setExcerpt(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
            </fieldset>
            <div className="writer-publish">
              <p>
                Anyone can read and share this letter as soon as you publish it.
              </p>
              {pending && (
                <p className="writer-recovery-note">
                  Confirm this publication before making further edits.
                </p>
              )}
              <button
                className="btn primary"
                type="button"
                disabled={busy || removed || !selectedExcerpt}
                onClick={() => void publish()}
              >
                {busy
                  ? "Publishing…"
                  : pending
                    ? "Retry publication"
                    : "Publish letter"}
              </button>
            </div>
          </div>
        ) : (
          <form
            className="writer-form"
            aria-describedby="writer-privacy"
            onSubmit={(event) => {
              event.preventDefault();
              if (checkBody()) {
                setPreview(true);
                setStatus("");
                setError("");
              }
            }}
          >
            <label htmlFor="letter-to">
              Who is it for? <span>(optional)</span>
            </label>
            <input
              id="letter-to"
              value={draft.to}
              onChange={(event) => change("to", event.target.value)}
              maxLength={100}
              autoComplete="off"
              placeholder="To someone starting over,"
            />
            <label htmlFor="letter-body">Your letter</label>
            <textarea
              id="letter-body"
              ref={bodyInput}
              value={draft.body}
              onChange={(event) => change("body", event.target.value)}
              maxLength={5000}
              placeholder="Start with a thought you keep coming back to…"
              aria-describedby={
                bodyError ? "writer-length writer-body-error" : "writer-length"
              }
              aria-invalid={Boolean(bodyError)}
              spellCheck
            />
            {bodyError && (
              <p className="writer-error" id="writer-body-error" role="alert">
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
              value={draft.signature}
              onChange={(event) => change("signature", event.target.value)}
              maxLength={80}
              autoComplete="off"
              placeholder="Someone still learning"
            />
            <button className="btn primary writer-preview-button" type="submit">
              Preview letter
            </button>
          </form>
        )}
      </div>
      <div className="writer-actions" aria-label="Keep your letter">
        <button
          className="btn secondary writer-save"
          type="button"
          onClick={saveDraft}
        >
          <FloppyDisk size={18} aria-hidden="true" /> Save draft on this device
        </button>
        <button
          className="btn secondary writer-download"
          type="button"
          onClick={download}
        >
          <DownloadSimple size={18} aria-hidden="true" /> Download letter
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
      {saved && (
        <button className="writer-remove" type="button" onClick={removeSaved}>
          Remove saved copy from this browser
        </button>
      )}
      <p className="writer-device-note">
        Save a draft to return to it in this browser. Download a copy to take
        your words to another device.
      </p>
    </section>
  );
}
