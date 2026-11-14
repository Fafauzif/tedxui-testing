import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  DownloadSimple,
  ShareNetwork,
  LinkSimple,
  X,
  Check,
  EnvelopeSimple,
  Info,
} from "@phosphor-icons/react";
import { letters } from "./letters";
import { createShareCard, downloadCard, shareCard, copyLink } from "./share";
import type { ShareCard } from "./share";
import "./style.css";

const getId = () => new URLSearchParams(window.location.search).get("letter");
const initial = () => {
  const id = getId();
  return (
    letters.find((l) => l.id === id)?.id ??
    (id ? "not-found" : letters[Math.floor(Math.random() * letters.length)].id)
  );
};

function App() {
  const [id, setId] = useState(initial);
  const [modal, setModal] = useState<"share" | "about" | null>(null);
  const [card, setCard] = useState<ShareCard | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [manualLink, setManualLink] = useState(false);
  const [smallNote, setSmallNote] = useState("");
  const [error, setError] = useState("");
  const [cycle, setCycle] = useState<string[]>(() =>
    id === "not-found" ? [] : [id],
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const savedFocus = useRef<HTMLElement | null>(null);
  const requestToken = useRef(0);
  const letter = letters.find((l) => l.id === id);
  const letterUrl = letter
    ? (() => {
        const url = new URL(window.location.href);
        url.search = "";
        url.hash = "";
        url.searchParams.set("letter", letter.id);
        return url.href;
      })()
    : window.location.href;
  useEffect(() => {
    const onPop = () => {
      const next = getId();
      setId(letters.some((l) => l.id === next) ? next! : "not-found");
      setModal(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (letter) {
      document.title = `${letter.salutation.replace(/,$/, "")} · Letters to Grow`;
      const url = new URL(window.location.href);
      if (!url.searchParams.has("letter")) {
        url.searchParams.set("letter", id);
        history.replaceState(null, "", url);
      }
    }
  }, [id, letter]);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (modal) {
      savedFocus.current = document.activeElement as HTMLElement;
      el.showModal();
    } else if (el.open) {
      el.close();
      savedFocus.current?.focus();
    }
    return () => {
      if (el.open) el.close();
    };
  }, [modal]);
  useEffect(() => {
    return () => {
      if (card) URL.revokeObjectURL(card.url);
    };
  }, [card]);
  useEffect(
    () => () => {
      requestToken.current++;
    },
    [],
  );
  const close = () => {
    requestToken.current++;
    setModal(null);
    setCard(null);
    setBusy(false);
    setStatus("");
    setError("");
    setManualLink(false);
  };
  const nextLetter = () => {
    let pool = letters.filter((l) => l.id !== id && !cycle.includes(l.id));
    if (!pool.length) pool = letters.filter((l) => l.id !== id);
    const next = pool[Math.floor(Math.random() * pool.length)].id;
    setCycle(
      pool.length === letters.length - 1 ? [id, next] : [...cycle, next],
    );
    setId(next);
    const url = new URL(window.location.href);
    url.searchParams.set("letter", next);
    history.pushState(null, "", url);
    setSmallNote("");
    window.scrollTo({ top: 0, behavior: "instant" });
    window.setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
  };
  const openShare = async () => {
    if (!letter) return;
    setModal("share");
    setBusy(true);
    setError("");
    setStatus("");
    setManualLink(false);
    const token = ++requestToken.current;
    try {
      const result = await createShareCard({
        excerpt: letter.excerpt,
        salutation: letter.salutation,
        letterUrl,
      });
      if (token !== requestToken.current) {
        URL.revokeObjectURL(result.url);
        return;
      }
      setCard(result);
    } catch {
      if (token === requestToken.current)
        setError(
          "The image could not be made. You can still copy the letter link.",
        );
    } finally {
      if (token === requestToken.current) setBusy(false);
    }
  };
  const handleShare = () => {
    if (!card || shareBusy) return;
    setShareBusy(true);
    shareCard(card)
      .then((result) => {
        if (result === "downloaded")
          setStatus(
            "Image download started. Open Instagram, choose Story, and add it from your photos or downloads.",
          );
        if (result === "shared")
          setStatus("Image handed to your device’s share menu.");
        if (result === "cancelled")
          setStatus("Sharing cancelled. Your image is still here.");
      })
      .catch(() => setError("Sharing did not work. Try Save image instead."))
      .finally(() => setShareBusy(false));
  };
  const handleCopy = async () => {
    const ok = await copyLink(letterUrl);
    if (ok) {
      setStatus("Letter link copied.");
      setSmallNote("Letter link copied.");
    } else {
      setManualLink(true);
      setStatus("Select and copy the link below.");
      if (!modal) setSmallNote("Select and copy the link below.");
    }
  };
  return (
    <>
      <a href="#letter" className="skip">
        Skip to the letter
      </a>
      <header className="site-header">
        <div className="sender" aria-label="TEDxUniversitasIndonesia">
          <span className="ted">
            TED<span className="ted-x">x</span>
          </span>
          <span className="university">UniversitasIndonesia</span>
          <span className="sender-note">independently organized TED event</span>
        </div>
        <button
          className="about-button"
          aria-label="About this project"
          onClick={() => setModal("about")}
        >
          About <Info size={17} />
        </button>
      </header>
      <main id="letter" className="workbench">
        <div className="identity">
          <h1>
            <span>LETTERS</span>
            <span className="outline-word">
              TO GROW<span className="wordmark-dot">.</span>
            </span>
          </h1>
          <p className="theme-note">Still, We Grow.</p>
          <img
            className="chalk-envelope"
            src="/art/envelope-chalk.webp"
            alt=""
            width="420"
            height="420"
            aria-hidden="true"
          />
        </div>
        <div className="reading-column">
          {letter ? (
            <>
              <article
                className="letter"
                key={id}
                aria-labelledby="letter-salutation"
              >
                <div className="paper-tape" aria-hidden="true" />
                <div className="letter-meta">
                  <span className="example-label">Example letter</span>
                  <span className="letter-topic">{letter.topic}</span>
                </div>
                <div className="letter-body">
                  <h2 id="letter-salutation" tabIndex={-1} ref={heading}>
                    {letter.salutation}
                  </h2>
                  {letter.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <p className="signoff">{letter.signoff}</p>
                </div>
              </article>
              <nav className="reader-actions" aria-label="Letter actions">
                <button className="next-button" onClick={nextLetter}>
                  Read another <ArrowRight size={23} />
                </button>
                <button className="save-letter" onClick={openShare}>
                  <ShareNetwork size={18} />
                  Save or share
                </button>
              </nav>
            </>
          ) : (
            <div className="not-found">
              <EnvelopeSimple size={44} />
              <h2>This letter isn’t here.</h2>
              <p>The link may be incomplete. Try another letter.</p>
              <button className="next-button" onClick={nextLetter}>
                Read a letter
                <ArrowRight size={22} />
              </button>
            </div>
          )}
          <p className="page-status" role="status" aria-live="polite">
            {smallNote}
          </p>
        </div>
      </main>
      <footer className="site-footer">
        <span>Letters to Grow · A TEDxUniversitasIndonesia campaign</span>
        <span>Preview. All letters are fictional examples.</span>
      </footer>
      <dialog
        ref={dialog}
        className={`dialog ${modal === "share" ? "share-dialog" : "about-dialog"}`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const r = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            )
              close();
          }
        }}
        aria-labelledby="dialog-title"
        onClose={() => {
          if (modal) close();
        }}
      >
        <button className="close-dialog" onClick={close} aria-label="Close">
          <X size={23} />
        </button>
        {modal === "about" ? (
          <div className="about-content">
            <EnvelopeSimple
              size={36}
              weight="light"
              className="about-envelope"
            />
            <h2 id="dialog-title">Letters to Grow.</h2>
            <p>
              A few letters about things we’re still figuring out. Read one, or
              stay for another.
            </p>
            <p>
              This is a campaign experiment for TEDxUniversitasIndonesia 2027,
              under <em>Still, We Grow.</em>
            </p>
            <p>
              The letters in this preview are fictional editorial examples. Real
              contributions can replace them later.
            </p>
            <div className="about-footnote">
              <p>
                No accounts, submissions, or tracking. Saving and sharing happen
                on your device.
              </p>
              <p>
                More campaign and Main Event information will be added when
                ready.
              </p>
            </div>
            <button className="text-action" onClick={close}>
              <ArrowLeft size={18} />
              Back to the letter
            </button>
          </div>
        ) : (
          <div className="share-layout">
            <div className="card-preview">
              {busy ? (
                <div className="preview-loading" role="status">
                  Making your image…
                </div>
              ) : card ? (
                <img
                  src={card.url}
                  alt={`Story image preview: ${letter?.excerpt}`}
                  width="1080"
                  height="1920"
                />
              ) : (
                <div className="preview-loading">
                  Your image will appear here.
                </div>
              )}
            </div>
            <div className="share-content">
              <h2 id="dialog-title">Save or share</h2>
              <p className="share-description">
                An image for your Story. The preview is what you’ll save.
              </p>
              <div className="share-actions">
                <button
                  className="primary-button"
                  disabled={!card || shareBusy}
                  onClick={handleShare}
                >
                  <ShareNetwork size={20} />
                  {shareBusy ? "Opening…" : "Share image"}
                </button>
                <button
                  className="secondary-button"
                  disabled={!card}
                  onClick={() => {
                    if (card) {
                      try {
                        downloadCard(card);
                        setStatus(
                          "Image download started. Find it in your downloads.",
                        );
                      } catch {
                        setError(
                          "The image could not be saved. Try Share image.",
                        );
                      }
                    }
                  }}
                >
                  <DownloadSimple size={20} />
                  Save image
                </button>
                <button className="secondary-button" onClick={handleCopy}>
                  <LinkSimple size={20} />
                  Copy letter link
                </button>
              </div>
              <div className="instagram-note">
                <strong>For Instagram Stories</strong>
                <p>
                  Save the image, open Instagram, and add it to your Story. Add
                  a link sticker with this letter’s link.
                </p>
                <p>Your phone may also offer Instagram in its share menu.</p>
              </div>
              <p className="share-status" role="status" aria-live="polite">
                {status && <Check size={17} />}
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
                    readOnly
                    value={letterUrl}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
