import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ShareNetwork,
  X,
  DownloadSimple,
  LinkSimple,
  PencilSimple,
  Shuffle,
  Check,
  Flag,
} from "@phosphor-icons/react";
import { ApiError, letterLink, request } from "./api";
import type { PublicLetter } from "./api";
import { createShareCard, downloadCard, shareCard, copyLink } from "./share";
import type { ShareCard } from "./share";
import WriteLetter from "./WriteLetter";
import "./style.css";

type View =
  { kind: "read"; id?: string } | { kind: "write" } | { kind: "community" };
function readLocation(): View {
  const query = new URLSearchParams(location.search);
  if (query.has("write")) return { kind: "write" };
  if (query.has("community")) return { kind: "community" };
  return {
    kind: "read",
    id: query.has("letter") ? query.get("letter") || "invalid" : undefined,
  };
}
function Logo() {
  return (
    <img
      className="official-mark"
      src="/art/tedx-logo.png"
      alt="TEDxUniversitasIndonesia · independently organized TED event"
      width="260"
      height="64"
    />
  );
}
function App() {
  const [view, setView] = useState<View>(readLocation);
  const [letter, setLetter] = useState<PublicLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<
    "missing" | "service" | "empty" | null
  >(null);
  const [refresh, setRefresh] = useState(0);
  const [published, setPublished] = useState(false);
  const [modal, setModal] = useState<"share" | "about" | "report" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const savedFocus = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const generation = useRef(0);
  const navigation = useRef(0);
  const rotation = useRef<AbortController | null>(null);
  const resolvedRoot = useRef<string | undefined>(undefined);
  const activeCard = useRef<ShareCard | null>(null);
  const [preparedCard, setPreparedCard] = useState<{
    key: string;
    card: ShareCard;
  } | null>(null);
  const [excerptIndex, setExcerptIndex] = useState(0);
  const [renderTry, setRenderTry] = useState(0);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [manualLink, setManualLink] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const reportKey = useRef(crypto.randomUUID());
  const [reportError, setReportError] = useState("");
  const [community, setCommunity] = useState<PublicLetter[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");
  const communityGeneration = useRef(0);
  const url = letter ? letterLink(letter.id) : "";
  const excerpt = letter?.excerpts[excerptIndex] || letter?.excerpt || "";
  const cardLetter = view.kind === "read" && !loadError ? letter : null;
  const cardKey = cardLetter
    ? JSON.stringify([
        url,
        excerpt,
        cardLetter.salutation,
        cardLetter.signoff,
        cardLetter.origin,
      ])
    : "";
  const card = preparedCard?.key === cardKey ? preparedCard.card : null;

  function resetNavigation() {
    navigation.current++;
    rotation.current?.abort();
    rotation.current = null;
    resolvedRoot.current = undefined;
    setLetter(null);
    setLoading(true);
    setModal(null);
    setExcerptIndex(0);
    setFeedback("");
    setPublished(false);
    moveFocus.current = true;
  }

  const navigate = useCallback((next: View, replace = false) => {
    const search =
      next.kind === "write"
        ? "?write"
        : next.kind === "community"
          ? "?community"
          : next.id
            ? `?letter=${encodeURIComponent(next.id)}`
            : "/";
    history[replace ? "replaceState" : "pushState"]({}, "", search);
    resetNavigation();
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const back = () => {
      resetNavigation();
      setView(readLocation());
    };
    const resume = () => {
      if (document.visibilityState === "visible") setRefresh((n) => n + 1);
    };
    window.addEventListener("popstate", back);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("popstate", back);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  useEffect(() => {
    if (view.kind !== "read") {
      document.title = `${view.kind === "write" ? "Write a letter" : "Community letters"} · Letters to Grow`;
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const navigationAtStart = navigation.current;
    const id = view.id || resolvedRoot.current;
    setLoading(true);
    setLoadError(null);
    const path = id
      ? `/api/letters/${encodeURIComponent(id)}`
      : "/api/rotation";
    const isCurrent = () =>
      !controller.signal.aborted && navigation.current === navigationAtStart;
    void request<{ letter: PublicLetter | null }>(path, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!isCurrent()) return;
        if (!data.letter) {
          setLoadError("empty");
          return;
        }
        setLetter(data.letter);
        document.title = `${data.letter.salutation} · Letters to Grow`;
        if (!id) {
          resolvedRoot.current = data.letter.id;
          history.replaceState(
            {},
            "",
            `?letter=${encodeURIComponent(data.letter.id)}`,
          );
        }
      })
      .catch((error) => {
        if (!isCurrent()) return;
        setLetter(null);
        setModal(null);
        document.title = "Letters to Grow · Still, We Grow";
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? "missing"
            : "service",
        );
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
    return () => controller.abort();
  }, [view, refresh]);

  useEffect(() => {
    if (
      moveFocus.current &&
      (view.kind !== "read" || !loading) &&
      heading.current
    ) {
      heading.current.focus({ preventScroll: true });
      moveFocus.current = false;
    }
  }, [view, loading, letter, loadError]);

  const loadCommunity = useCallback(async (after?: string) => {
    const token = ++communityGeneration.current;
    setCommunityLoading(true);
    setCommunityError("");
    try {
      const data = await request<{
        letters: PublicLetter[];
        nextCursor: string | null;
      }>(
        `/api/community${after ? `?cursor=${encodeURIComponent(after)}` : ""}`,
      );
      if (token !== communityGeneration.current) return;
      setCommunity((previous) =>
        after
          ? [
              ...previous,
              ...data.letters.filter(
                (item) => !previous.some((old) => old.id === item.id),
              ),
            ]
          : data.letters,
      );
      setCursor(data.nextCursor);
    } catch {
      if (token === communityGeneration.current)
        setCommunityError(
          "Community letters could not be reached. Your connection may be interrupted.",
        );
    } finally {
      if (token === communityGeneration.current) setCommunityLoading(false);
    }
  }, []);
  useEffect(() => {
    if (view.kind === "community") {
      setCommunity([]);
      void loadCommunity();
    }
    return () => {
      communityGeneration.current++;
    };
  }, [view, refresh, loadCommunity]);

  async function nextLetter() {
    if (loading || rotation.current) return;
    const controller = new AbortController();
    rotation.current = controller;
    const navigationAtStart = navigation.current;
    const previousId = letter?.id;
    const isCurrent = () =>
      !controller.signal.aborted && navigation.current === navigationAtStart;
    setLoading(true);
    setLoadError(null);
    try {
      const path = previousId
        ? `/api/rotation?exclude=${encodeURIComponent(previousId)}`
        : "/api/rotation";
      const data = await request<{ letter: PublicLetter | null }>(path, {
        signal: controller.signal,
      });
      if (!isCurrent()) return;
      if (data.letter) {
        navigate({ kind: "read", id: data.letter.id });
      } else {
        setLoadError("empty");
        setLetter(null);
      }
    } catch {
      if (isCurrent()) {
        setLetter(null);
        setLoadError("service");
      }
    } finally {
      if (isCurrent()) setLoading(false);
      if (rotation.current === controller) rotation.current = null;
    }
  }

  function openModal(next: "share" | "about" | "report") {
    savedFocus.current = document.activeElement as HTMLElement;
    setFeedback("");
    setManualLink(false);
    if (next === "report") {
      setReportReason("");
      setReportSent(false);
      setReportError("");
      reportKey.current = crypto.randomUUID();
    }
    setModal(next);
  }
  function closeModal() {
    dialog.current?.close();
    setModal(null);
    savedFocus.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (modal) {
      if (!dialog.current?.open) dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  useEffect(() => {
    const token = ++generation.current;
    setPreparedCard(null);
    setCardError("");
    if (activeCard.current) {
      URL.revokeObjectURL(activeCard.current.url);
      activeCard.current = null;
    }
    if (!cardKey) {
      setCardLoading(false);
      return;
    }

    const [letterUrl, quote, salutation, signoff, origin] = JSON.parse(
      cardKey,
    ) as [string, string, string, string, PublicLetter["origin"]];
    setCardLoading(true);
    void createShareCard({
      excerpt: quote,
      salutation,
      signoff,
      origin,
      letterUrl,
    })
      .then((result) => {
        if (token !== generation.current) {
          URL.revokeObjectURL(result.url);
          return;
        }
        activeCard.current = result;
        setPreparedCard({ key: cardKey, card: result });
      })
      .catch((error) => {
        if (token === generation.current)
          setCardError(
            error instanceof Error
              ? error.message
              : "The image could not be prepared. Try again.",
          );
      })
      .finally(() => {
        if (token === generation.current) setCardLoading(false);
      });

    return () => {
      generation.current++;
    };
  }, [cardKey, renderTry]);

  useEffect(
    () => () => {
      if (activeCard.current) URL.revokeObjectURL(activeCard.current.url);
    },
    [],
  );

  function onShare() {
    if (!card || sharing) return;
    setSharing(true);
    setFeedback("");
    void shareCard(card)
      .then((result) =>
        setFeedback(
          result === "cancelled"
            ? "Sharing cancelled. Your image is still here."
            : result === "downloaded"
              ? "Image download started. You can also open the image below to save it."
              : "Image handed to your device’s share menu.",
        ),
      )
      .catch(() =>
        setFeedback("Sharing could not open. Save the image instead."),
      )
      .finally(() => setSharing(false));
  }
  async function onCopy() {
    const copied = await copyLink(url);
    setManualLink(!copied);
    setFeedback(
      copied
        ? "Letter link copied."
        : "Select and copy your letter link below.",
    );
  }
  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!letter || reportBusy) return;
    setReportBusy(true);
    setReportError("");
    try {
      await request("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          letterId: letter.id,
          reason: reportReason.trim(),
          submissionKey: reportKey.current,
        }),
      });
      setReportSent(true);
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Your report could not be saved. Please try again.",
      );
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <a
          href="/"
          className="brand-home"
          aria-label="Read Letters to Grow"
          onClick={(event) => {
            event.preventDefault();
            navigate({ kind: "read" });
          }}
        >
          <Logo />
        </a>
        <nav aria-label="Main navigation">
          <a
            className={view.kind === "community" ? "active" : ""}
            href="/?community"
            onClick={(event) => {
              event.preventDefault();
              navigate({ kind: "community" });
            }}
          >
            Community letters
          </a>
          <a
            className={"nav-write " + (view.kind === "write" ? "active" : "")}
            href="/?write"
            onClick={(event) => {
              event.preventDefault();
              navigate({ kind: "write" });
            }}
          >
            <PencilSimple size={16} aria-hidden="true" />
            Write a letter
          </a>
        </nav>
      </header>
      <main id="main" className="layout">
        <aside className="identity">
          <a
            href="/"
            className="wordmark"
            aria-label="Letters to Grow, read a letter"
            onClick={(event) => {
              event.preventDefault();
              navigate({ kind: "read" });
            }}
          >
            Letters
            <br />
            <span>
              to <em>Grow</em>
              <b>.</b>
            </span>
          </a>
          <p className="campaign-line">Still, We Grow.</p>
          <div className="identity-flower" aria-hidden="true">
            <img src="/art/white-flower.webp" alt="" />
          </div>
          <div className="rail-invitation">
            <p>
              What are you
              <br />
              <em>still figuring out?</em>
            </p>
            <a
              href="/?write"
              onClick={(event) => {
                event.preventDefault();
                navigate({ kind: "write" });
              }}
            >
              Put it into words
            </a>
          </div>
        </aside>
        <div className="content-column">
          {view.kind === "read" && (
            <>
              {published && (
                <div className="publication-success" role="status">
                  <Check size={20} aria-hidden="true" />
                  <div>
                    <strong>Your letter is public.</strong>
                    <p>
                      It has joined Community letters. Keep its link or share a
                      line.
                    </p>
                  </div>
                </div>
              )}
              {loading ? (
                <section className="paper state-paper" aria-busy="true">
                  <p className="eyebrow">Letters to Grow</p>
                  <h1>Opening a letter…</h1>
                  <p role="status">A few words are on their way.</p>
                </section>
              ) : loadError ? (
                <section className="paper state-paper">
                  <p className="eyebrow">Letters to Grow</p>
                  <h1 ref={heading} tabIndex={-1}>
                    {loadError === "missing"
                      ? "This letter is unavailable."
                      : loadError === "empty"
                        ? "A little room for words."
                        : "Letters are taking a moment."}
                  </h1>
                  <p>
                    {loadError === "missing"
                      ? "There are other letters waiting to be read."
                      : loadError === "empty"
                        ? "Be the first to leave a letter for someone."
                        : "The collection could not be reached. Try again in a moment."}
                  </p>
                  <button
                    className="btn primary"
                    onClick={
                      loadError === "service"
                        ? () => setRefresh((n) => n + 1)
                        : nextLetter
                    }
                  >
                    {loadError === "service" ? "Retry" : "Read another"}
                  </button>
                  {loadError === "empty" && (
                    <a
                      className="btn secondary"
                      href="/?write"
                      onClick={(event) => {
                        event.preventDefault();
                        navigate({ kind: "write" });
                      }}
                    >
                      Write a letter
                    </a>
                  )}
                </section>
              ) : (
                letter && (
                  <>
                    <article
                      className="paper letter"
                      aria-labelledby="letter-heading"
                    >
                      <div className="letter-meta">
                        <span>
                          {letter.origin === "editorial"
                            ? "Fictional editorial letter"
                            : "Community letter"}
                        </span>
                        {letter.topic && <span>{letter.topic}</span>}
                      </div>
                      <h1 id="letter-heading" ref={heading} tabIndex={-1}>
                        {letter.salutation}
                      </h1>
                      <div className="letter-body">
                        {letter.paragraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      <p className="letter-signoff">{letter.signoff}</p>
                      <div className="paper-ending" aria-hidden="true">
                        ✳
                      </div>
                    </article>
                    <div className="reader-actions">
                      <button className="btn primary" onClick={nextLetter}>
                        <Shuffle size={18} aria-hidden="true" />
                        Read another
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => openModal("share")}
                      >
                        <ShareNetwork size={18} aria-hidden="true" />
                        Share to Story
                      </button>
                    </div>
                    {published && (
                      <div className="public-link">
                        <label htmlFor="published-url">
                          Your permanent letter link
                        </label>
                        <input
                          id="published-url"
                          readOnly
                          value={url}
                          onFocus={(event) => event.currentTarget.select()}
                        />
                        <button className="text-link" onClick={onCopy}>
                          Copy letter link
                        </button>
                        <p role="status">{feedback}</p>
                      </div>
                    )}
                    <div className="reader-after">
                      <p>What are you still figuring out?</p>
                      <a
                        href="/?write"
                        onClick={(event) => {
                          event.preventDefault();
                          navigate({ kind: "write" });
                        }}
                      >
                        Write a letter
                      </a>
                    </div>
                    {letter.origin === "community" && (
                      <button
                        className="report-link"
                        onClick={() => openModal("report")}
                      >
                        <Flag size={14} aria-hidden="true" />
                        Report this letter
                      </button>
                    )}
                  </>
                )
              )}
            </>
          )}
          {view.kind === "write" && (
            <WriteLetter
              onBack={() => navigate({ kind: "read" })}
              onPublished={(item) => {
                navigate({ kind: "read", id: item.id });
                setPublished(true);
              }}
            />
          )}
          {view.kind === "community" && (
            <section className="community" aria-labelledby="community-heading">
              <div className="collection-heading">
                <p className="eyebrow">From one person to another</p>
                <h1 id="community-heading" ref={heading} tabIndex={-1}>
                  Community <em>letters.</em>
                </h1>
                <p>
                  Things we’re learning. Things we’re still working out.
                  <br className="wide-only" /> Words left here for someone like
                  you.
                </p>
              </div>
              {community.map((item) => (
                <a
                  className="community-letter paper"
                  key={item.id}
                  href={`/?letter=${encodeURIComponent(item.id)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate({ kind: "read", id: item.id });
                  }}
                >
                  <div className="letter-meta">
                    <span>Community letter</span>
                    <time dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </time>
                  </div>
                  <h2>{item.salutation}</h2>
                  <p>
                    {item.paragraphs.join(" ").slice(0, 230)}
                    {item.paragraphs.join(" ").length > 230 ? "…" : ""}
                  </p>
                  <span className="community-byline">{item.signoff}</span>
                  <span className="community-read">Read this letter</span>
                </a>
              ))}
              {communityLoading && (
                <p className="state-message" role="status">
                  Opening Community letters…
                </p>
              )}
              {communityError && (
                <div className="paper state-paper" role="alert">
                  <p>{communityError}</p>
                  <button
                    className="btn primary"
                    onClick={() => void loadCommunity()}
                  >
                    Retry
                  </button>
                </div>
              )}
              {!communityLoading &&
                !communityError &&
                community.length === 0 && (
                  <div className="paper state-paper">
                    <h2>A page for your words.</h2>
                    <p>
                      Community letters begin with someone willing to write.
                    </p>
                    <a
                      className="btn primary"
                      href="/?write"
                      onClick={(event) => {
                        event.preventDefault();
                        navigate({ kind: "write" });
                      }}
                    >
                      Write a letter
                    </a>
                  </div>
                )}
              {cursor && !communityError && (
                <button
                  className="btn secondary"
                  disabled={communityLoading}
                  onClick={() => void loadCommunity(cursor)}
                >
                  Read more letters
                </button>
              )}
            </section>
          )}
        </div>
      </main>
      <footer className="site-footer">
        <span>Letters to Grow · TEDxUniversitasIndonesia 2027</span>
        <button onClick={() => openModal("about")}>
          About this collection
        </button>
        <span>Still, We Grow.</span>
      </footer>
      <dialog
        ref={dialog}
        className={`dialog ${modal === "share" ? "share-dialog" : ""}`}
        aria-labelledby="dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          closeModal();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              closeModal();
          }
        }}
      >
        <button
          className="close-dialog"
          aria-label="Close dialog"
          onClick={closeModal}
        >
          <X size={22} />
        </button>
        {modal === "share" && letter && (
          <div className="share-content">
            <div className="share-intro">
              <p className="eyebrow">Instagram Story</p>
              <h2 id="dialog-title">
                Let a line <em>travel.</em>
              </h2>
            </div>
            <div className="share-grid">
              <div className="story-preview" aria-busy={cardLoading}>
                {card ? (
                  <img
                    src={card.url}
                    alt={`Story card: ${excerpt} — ${letter.signoff}`}
                    width="1080"
                    height="1920"
                  />
                ) : (
                  <div role="status">
                    {cardLoading
                      ? "Composing your Story…"
                      : "Your Story image will appear here."}
                  </div>
                )}
              </div>
              <div className="share-controls">
                {cardError && (
                  <div className="share-error" role="alert">
                    <p>{cardError}</p>
                    <button
                      className="text-link"
                      onClick={() => setRenderTry((n) => n + 1)}
                    >
                      Try making the image again
                    </button>
                  </div>
                )}
                <div className="share-actions">
                  <button
                    className="btn primary"
                    disabled={!card || cardLoading || sharing}
                    onClick={onShare}
                  >
                    <ShareNetwork size={18} />
                    {sharing ? "Opening share menu…" : "Share image"}
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!card || cardLoading}
                    onClick={() => {
                      if (card) {
                        downloadCard(card);
                        setFeedback(
                          "Image download started. If it does not save, open the image below.",
                        );
                      }
                    }}
                  >
                    <DownloadSimple size={18} />
                    Save image
                  </button>
                  <button className="text-link" onClick={onCopy}>
                    <LinkSimple size={17} />
                    Copy letter link
                  </button>
                </div>
                <p className="instagram-note">
                  In Instagram, add the image to your Story and paste the letter
                  link into a link sticker.
                </p>
                <p className="share-feedback" role="status">
                  {feedback}
                </p>
                {manualLink && (
                  <label className="manual-link">
                    Letter link
                    <input
                      value={url}
                      readOnly
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </label>
                )}
                <fieldset className="excerpt-options">
                  <legend>Choose your line</legend>
                  {letter.excerpts.map((option, index) => (
                    <label
                      key={index}
                      className={index === excerptIndex ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="excerpt"
                        checked={index === excerptIndex}
                        disabled={sharing}
                        onChange={() => {
                          setExcerptIndex(index);
                          setFeedback("");
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
                {card && (
                  <details className="save-help">
                    <summary>Having trouble saving?</summary>
                    <p>
                      Open the image, then touch and hold it to save to Photos.
                      If Instagram blocks saving, open this letter in Safari or
                      Chrome.
                    </p>
                    <a href={card.url} target="_blank" rel="noopener">
                      Open full-size image
                    </a>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
        {modal === "about" && (
          <div className="about-content">
            <p className="eyebrow">Still, We Grow.</p>
            <h2 id="dialog-title">
              Letters to <em>Grow.</em>
            </h2>
            <p>
              A place for the things we’re still figuring out. Read a letter,
              leave your own, or carry a line into someone else’s day.
            </p>
            <p>
              A campaign by TEDxUniversitasIndonesia 2027. The original twelve
              letters are fictional editorial letters. Public submissions are
              marked “Community letter”.
            </p>
            <p>
              Drafts stay on your device until you choose Publish letter.
              Published letters can be read and shared by anyone. Staff review
              reports and can remove letters from the collection.
            </p>
            <button className="btn primary" onClick={closeModal}>
              Back to the letters
            </button>
          </div>
        )}
        {modal === "report" && (
          <div className="report-content">
            <p className="eyebrow">Help care for this space</p>
            <h2 id="dialog-title">
              {reportSent ? "Report received." : "Report this letter"}
            </h2>
            {reportSent ? (
              <>
                <p>Your report has been saved for the team to review.</p>
                <button className="btn primary" onClick={closeModal}>
                  Continue reading
                </button>
              </>
            ) : (
              <form onSubmit={submitReport}>
                <label htmlFor="report-reason">
                  What should the team know?
                </label>
                <textarea
                  id="report-reason"
                  required
                  minLength={3}
                  maxLength={500}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Tell us what concerns you about this letter."
                />
                <p>
                  Your report goes to the team. The letter remains available
                  while it is reviewed.
                </p>
                {reportError && (
                  <p role="alert" className="share-error">
                    {reportError}
                  </p>
                )}
                <button className="btn primary" disabled={reportBusy}>
                  {reportBusy ? "Sending report…" : "Send report"}
                </button>
              </form>
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
