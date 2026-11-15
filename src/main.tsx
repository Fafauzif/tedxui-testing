import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Shuffle,
  X,
  DownloadSimple,
  ShareNetwork,
  LinkSimple,
  PencilSimple,
  Info,
  Check,
} from "@phosphor-icons/react";
import { letters } from "./letters";
import type { EntryPathId, Letter } from "./letters";
import { createShareCard, downloadCard, shareCard, copyLink } from "./share";
import type { ShareCard } from "./share";
import WriteLetter from "./WriteLetter";
import "./style.css";

type View =
  | { kind: "entry" }
  | { kind: "read"; id: string }
  | { kind: "write" }
  | { kind: "missing" };
const choices: { id: EntryPathId; label: string; short: string }[] = [
  {
    id: "starting-again",
    label: "Ready to start again",
    short: "Starting again",
  },
  {
    id: "out-of-place",
    label: "A little out of place",
    short: "Finding your place",
  },
  { id: "stretched-thin", label: "Stretched thin", short: "Doing too much" },
  { id: "curious", label: "Curious", short: "Following a question" },
];
const entryKey = "letters-to-grow-entry-seen-v4";
const seenEntry = () => {
  try {
    return sessionStorage.getItem(entryKey) === "yes";
  } catch {
    return false;
  }
};
const readLocation = (): View => {
  const q = new URLSearchParams(location.search);
  if (q.has("write")) return { kind: "write" };
  const id = q.get("letter");
  if (id)
    return letters.some((l) => l.id === id)
      ? { kind: "read", id }
      : { kind: "missing" };
  if (q.has("letter")) return { kind: "missing" };
  return { kind: "entry" };
};
const randomLetter = (pool: Letter[]) =>
  pool[Math.floor(Math.random() * pool.length)];
function Botanical({
  className = "",
  flower = false,
}: {
  className?: string;
  flower?: boolean;
}) {
  return (
    <img
      className={"botanical " + className}
      src={flower ? "/art/white-flower.webp" : "/art/botanical-sprig.webp"}
      alt=""
      aria-hidden="true"
      width={flower ? 600 : 840}
      height={flower ? 900 : 560}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}
function App() {
  const [view, setView] = useState<View>(readLocation);
  const [animateEntry, setAnimateEntry] = useState(
    () => readLocation().kind === "entry" && !seenEntry(),
  );
  const [opening, setOpening] = useState<EntryPathId | "any" | null>(null);
  const [path, setPath] = useState<EntryPathId | null>(null);
  const cycle = useRef<string[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const openingRef = useRef(false);
  const firstMount = useRef(true);
  const [modal, setModal] = useState<"about" | "share" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const savedFocus = useRef<HTMLElement | null>(null);
  const request = useRef(0);
  const cardRef = useRef<ShareCard | null>(null);
  const [card, setCard] = useState<ShareCard | null>(null);
  const [excerptIndex, setExcerptIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [manualLink, setManualLink] = useState(false);
  const letter =
    view.kind === "read" ? letters.find((l) => l.id === view.id) : undefined;
  const letterUrl = letter
    ? new URL("?letter=" + letter.id, location.href).href
    : location.href;
  const clearCard = () => {
    if (cardRef.current) URL.revokeObjectURL(cardRef.current.url);
    cardRef.current = null;
    setCard(null);
  };
  const closeModal = () => {
    request.current++;
    setModal(null);
    clearCard();
    setBusy(false);
    setStatus("");
    setError("");
    setManualLink(false);
  };
  const cancelOpening = () => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    openingRef.current = false;
    setOpening(null);
  };
  const navigate = (next: View) => {
    cancelOpening();
    closeModal();
    if (next.kind !== "entry") setAnimateEntry(false);
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    if (next.kind === "read") url.searchParams.set("letter", next.id);
    if (next.kind === "write") url.searchParams.set("write", "1");
    history.pushState(null, "", url);
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const onPop = () => {
      setAnimateEntry(false);
      cancelOpening();
      closeModal();
      setPath(null);
      setView(readLocation());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      request.current++;
      if (cardRef.current) URL.revokeObjectURL(cardRef.current.url);
    };
  }, []);
  useEffect(() => {
    if (view.kind === "entry") {
      try {
        sessionStorage.setItem(entryKey, "yes");
      } catch {
        /* optional session preference */
      }
    }
    document.title = letter
      ? `${letter.salutation.replace(/,$/, "")} · Letters to Grow`
      : view.kind === "write"
        ? "Write a letter · Letters to Grow"
        : "Letters to Grow · Still, We Grow";
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    const target =
      view.kind === "read"
        ? "letter-salutation"
        : view.kind === "write"
          ? "writer-heading"
          : "entry-heading";
    const raf = requestAnimationFrame(() =>
      document.getElementById(target)?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(raf);
  }, [view, letter]);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (modal && !el.open) {
      savedFocus.current = document.activeElement as HTMLElement;
      el.showModal();
    }
    if (!modal && el.open) {
      el.close();
      savedFocus.current?.focus({ preventScroll: true });
    }
  }, [modal]);
  const openLetter = (selected: EntryPathId | "any") => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(selected);
    setPath(selected === "any" ? null : selected);
    const pool =
      selected === "any"
        ? letters
        : letters.filter((l) => l.paths.includes(selected));
    const chosen = randomLetter(pool);
    cycle.current = [chosen.id];
    const finish = () => {
      setAnimateEntry(false);
      navigate({ kind: "read", id: chosen.id });
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else timer.current = window.setTimeout(finish, 320);
  };
  const nextLetter = () => {
    if (!letter) return;
    const pool = path ? letters.filter((l) => l.paths.includes(path)) : letters;
    let available = pool.filter(
      (l) => l.id !== letter.id && !cycle.current.includes(l.id),
    );
    if (!available.length) {
      cycle.current = [letter.id];
      available = pool.filter((l) => l.id !== letter.id);
    }
    const chosen = randomLetter(
      available.length ? available : letters.filter((l) => l.id !== letter.id),
    );
    cycle.current.push(chosen.id);
    navigate({ kind: "read", id: chosen.id });
  };
  const openShare = () => {
    setExcerptIndex(0);
    setStatus("");
    setError("");
    setManualLink(false);
    setModal("share");
  };
  useEffect(() => {
    if (modal !== "share" || !letter) return;
    const token = ++request.current;
    setBusy(true);
    setError("");
    clearCard();
    void createShareCard({
      excerpt: letter.excerpts[excerptIndex] ?? letter.excerpt,
      salutation: letter.salutation,
      letterUrl,
    })
      .then((result) => {
        if (token !== request.current) {
          URL.revokeObjectURL(result.url);
          return;
        }
        cardRef.current = result;
        setCard(result);
      })
      .catch(() => {
        if (token === request.current)
          setError(
            "The image could not be made. You can still copy the letter link.",
          );
      })
      .finally(() => {
        if (token === request.current) setBusy(false);
      });
    return () => {
      request.current++;
    };
  }, [modal, letter, excerptIndex, letterUrl]);
  const onShare = () => {
    if (!card || sharing) return;
    setSharing(true);
    setError("");
    void shareCard(card)
      .then((result) =>
        setStatus(
          result === "cancelled"
            ? "Sharing cancelled. Your image is still here."
            : result === "downloaded"
              ? "Image download started. You can add it to your Story from photos or downloads."
              : "Image handed to your device’s share menu.",
        ),
      )
      .catch(() => setError("Sharing did not work. Try Save image instead."))
      .finally(() => setSharing(false));
  };
  const onCopy = async () => {
    const ok = await copyLink(letterUrl);
    setStatus(ok ? "Letter link copied." : "Select and copy the link below.");
    setManualLink(!ok);
  };
  return (
    <div className={"app view-" + view.kind}>
      <a className="skip" href="#main">
        Skip to the content
      </a>
      <header className="site-header">
        <button
          className="brand-home"
          aria-label="Letters to Grow opening"
          onClick={() => navigate({ kind: "entry" })}
        >
          <img
            src="/art/tedx-logo.png"
            alt="TEDxUniversitasIndonesia independently organized TED event"
            width="260"
            height="64"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
          <span className="logo-fallback" aria-hidden="true">
            <b>TEDx</b>
            <span>UniversitasIndonesia</span>
          </span>
        </button>
        <nav className="header-actions" aria-label="Project">
          <button
            className="write-button"
            onClick={() => navigate({ kind: "write" })}
          >
            <PencilSimple size={17} />
            Write a letter
          </button>
          <button
            className="about-button"
            aria-label="About this project"
            onClick={() => setModal("about")}
          >
            <Info size={19} />
            <span>About</span>
          </button>
        </nav>
      </header>
      <main id="main">
        {view.kind === "entry" && (
          <section
            className={
              "entry " +
              (animateEntry ? "first-entrance " : "") +
              (opening ? "is-opening" : "")
            }
            aria-labelledby="entry-heading"
          >
            <Botanical className="entry-sprig" />
            <Botanical className="entry-flower" flower />
            <div className="entry-title">
              <p className="theme-label">Still, We Grow.</p>
              <h1 id="entry-heading" tabIndex={-1}>
                What are you
                <br />
                <em>still figuring out?</em>
              </h1>
              <p className="entry-prompt">I’m feeling…</p>
            </div>
            <div className="thoughts" aria-label="Choose a starting point">
              {choices.map((choice, i) => (
                <button
                  key={choice.id}
                  disabled={opening !== null}
                  className={
                    "thought thought-" +
                    i +
                    (opening === choice.id ? " selected" : "")
                  }
                  onClick={() => openLetter(choice.id)}
                >
                  <span>{choice.label}</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="entry-bottom">
              <button
                className="any-letter"
                disabled={opening !== null}
                onClick={() => openLetter("any")}
              >
                <Shuffle size={17} />
                Read any letter
              </button>
              <p>A letter from someone still working things out.</p>
            </div>
          </section>
        )}
        {view.kind === "read" && letter && (
          <section className="reader-shell" aria-label="Letter reader">
            <aside className="reader-aside">
              <button
                className="back-link"
                onClick={() => navigate({ kind: "entry" })}
              >
                <ArrowLeft size={17} />
                Choose a starting point
              </button>
              <p className="letter-wordmark">
                Letters
                <br />
                <em>to Grow</em>
                <span>.</span>
              </p>
              <p className="reader-theme">Still, We Grow.</p>
              <Botanical className="reader-flower" flower />
            </aside>
            <div className="reading-column">
              <article
                className="letter"
                key={letter.id}
                aria-labelledby="letter-salutation"
              >
                <span className="paper-fastener" aria-hidden="true" />
                <div className="letter-meta">
                  <span className="example-label">Example letter</span>
                  <span>{letter.topic}</span>
                </div>
                <div className="letter-body">
                  <h1 id="letter-salutation" tabIndex={-1}>
                    {letter.salutation}
                  </h1>
                  {letter.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                  <p className="signoff">{letter.signoff}</p>
                </div>
              </article>
              <nav className="reader-actions" aria-label="Letter actions">
                <button className="paper-button" onClick={nextLetter}>
                  Read another
                  <ArrowRight size={20} />
                </button>
                <button className="save-letter" onClick={openShare}>
                  <ShareNetwork size={18} />
                  Save a line
                </button>
              </nav>
              <p className="after-letter">
                Have something of your own to write?{" "}
                <button onClick={() => navigate({ kind: "write" })}>
                  Write a letter <ArrowRight size={15} />
                </button>
              </p>
            </div>
          </section>
        )}
        {view.kind === "write" && (
          <WriteLetter onBack={() => navigate({ kind: "entry" })} />
        )}
        {view.kind === "missing" && (
          <section className="not-found">
            <h1 id="entry-heading" tabIndex={-1}>
              This letter isn’t here.
            </h1>
            <p>The link may be incomplete. There are other letters to read.</p>
            <button
              className="paper-button"
              onClick={() => navigate({ kind: "entry" })}
            >
              Find a letter
              <ArrowRight size={20} />
            </button>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>Letters to Grow · TEDxUniversitasIndonesia</span>
        <span>Preview collection · Fictional example letters</span>
      </footer>
      <dialog
        ref={dialog}
        className={
          "dialog " + (modal === "share" ? "share-dialog" : "about-dialog")
        }
        aria-labelledby="dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const b = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < b.left ||
              e.clientX > b.right ||
              e.clientY < b.top ||
              e.clientY > b.bottom
            )
              closeModal();
          }
        }}
        onClose={() => {
          if (modal) closeModal();
        }}
      >
        <button
          className="close-dialog"
          aria-label="Close"
          onClick={closeModal}
        >
          <X size={22} />
        </button>
        {modal === "about" && (
          <div className="about-content">
            <p className="theme-label">Still, We Grow.</p>
            <h2 id="dialog-title">Letters to Grow</h2>
            <p>
              A few letters about things we’re still figuring out. Choose a
              starting point, or read whatever comes your way.
            </p>
            <p>
              A campaign experiment by TEDxUniversitasIndonesia 2027. The
              collection contains fictional editorial examples.
            </p>
            <p>
              You can write a private draft and keep it on your device. This
              frontend preview does not accept or publish submissions. Reading,
              writing and image exports do not send your text to a server.
            </p>
            <button className="text-button" onClick={closeModal}>
              <ArrowLeft size={17} />
              Back
            </button>
          </div>
        )}
        {modal === "share" && letter && (
          <div className="share-content">
            <h2 id="dialog-title">Keep a line.</h2>
            <p className="share-description">
              Choose the part you’d like to send to someone.
            </p>
            <div className="share-body">
              <div className="card-preview">
                {busy ? (
                  <div className="preview-loading" role="status">
                    Making your image…
                  </div>
                ) : card ? (
                  <img
                    src={card.url}
                    width="1080"
                    height="1920"
                    alt={"Story card: " + letter.excerpts[excerptIndex]}
                  />
                ) : (
                  <div className="preview-loading">
                    Your image will appear here.
                  </div>
                )}
              </div>
              <fieldset className="excerpt-options">
                <legend>Choose a line</legend>
                {letter.excerpts.map((excerpt, i) => (
                  <label
                    key={excerpt}
                    className={excerptIndex === i ? "chosen" : ""}
                  >
                    <input
                      type="radio"
                      name="excerpt"
                      value={i}
                      checked={excerptIndex === i}
                      onChange={() => {
                        setExcerptIndex(i);
                        setStatus("");
                      }}
                      disabled={sharing}
                    />
                    <span>{excerpt}</span>
                  </label>
                ))}
              </fieldset>
            </div>
            <div className="share-actions">
              <button
                className="paper-button"
                disabled={!card || busy || sharing}
                onClick={onShare}
              >
                <ShareNetwork size={18} />
                {sharing ? "Opening…" : "Share image"}
              </button>
              <button
                className="outline-button"
                disabled={!card || busy}
                onClick={() => {
                  if (card)
                    try {
                      downloadCard(card);
                      setStatus(
                        "Image download started. Find it in your downloads.",
                      );
                    } catch {
                      setError("Could not save the image. Try Share image.");
                    }
                }}
              >
                <DownloadSimple size={18} />
                Save image
              </button>
              <button className="text-button copy-link" onClick={onCopy}>
                <LinkSimple size={17} />
                Copy letter link
              </button>
            </div>
            <p className="instagram-note">
              For Instagram, add the saved image to your Story. Add this
              letter’s link with a separate link sticker.
            </p>
            <p className="share-status" role="status" aria-live="polite">
              {status && <Check size={16} />}
              <span>{status}</span>
            </p>
            {error && (
              <p className="share-error" role="alert">
                {error}
              </p>
            )}
            {manualLink && (
              <label className="manual-link">
                Letter link
                <input
                  value={letterUrl}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
