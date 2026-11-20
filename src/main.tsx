import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ShareNetwork,
  X,
  PencilSimple,
  Shuffle,
  Check,
  Flag,
} from "@phosphor-icons/react";
import { ApiError, letterLink, request } from "./api";
import type { PublicLetter } from "./api";
import { readReaderBootstrap } from "./reader-bootstrap";
import "./style.css";

const ShareBuilder = lazy(() => import("./ShareBuilder"));
const WriteLetter = lazy(() => import("./WriteLetter"));
const featuredId = "outside-the-feed";

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
      src="/art/tedx-logo-header.webp"
      alt="TEDxUniversitasIndonesia · independently organized TED event"
      width="460"
      height="114"
    />
  );
}
function App() {
  const [boot] = useState(readReaderBootstrap);
  const [view, setView] = useState<View>(readLocation);
  const [letter, setLetter] = useState<PublicLetter | null>(boot?.letter ?? null);
  const [loading, setLoading] = useState(!boot);
  const [loadError, setLoadError] = useState<
    "missing" | "service" | "empty" | null
  >(boot?.error ?? null);
  const [refresh, setRefresh] = useState(0);
  const [published, setPublished] = useState(false);
  const [modal, setModal] = useState<"share" | "about" | "report" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const savedFocus = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const navigation = useRef(0);
  const rotation = useRef<AbortController | null>(null);
  const resolvedRoot = useRef<string | undefined>(boot?.letter?.id);
  const resolvedView = useRef<{ view: View; refresh: number } | null>(
    boot ? { view, refresh: 0 } : null,
  );
  const [feedback, setFeedback] = useState("");
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
  function resetNavigation() {
    navigation.current++;
    rotation.current?.abort();
    rotation.current = null;
    resolvedRoot.current = undefined;
    setLetter(null);
    setLoading(true);
    setModal(null);
    setFeedback("");
    setPublished(false);
    moveFocus.current = true;
  }

  const navigate = useCallback((next: View, replace = false, readyLetter?: PublicLetter) => {
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
    if (readyLetter) {
      resolvedView.current = { view: next, refresh };
      setLetter(readyLetter);
      setLoadError(null);
      setLoading(false);
      document.title = `${readyLetter.salutation} · Letters to Grow`;
    }
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [refresh]);

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
    if (resolvedView.current?.view === view && resolvedView.current.refresh === refresh) {
      return;
    }
    const controller = new AbortController();
    const navigationAtStart = navigation.current;
    const id = view.id || resolvedRoot.current;
    setLoading(true);
    setLoadError(null);
    const read = (target: string) => request<{ letter: PublicLetter | null }>(
      target, { signal: controller.signal }
    );
    const isCurrent = () =>
      !controller.signal.aborted && navigation.current === navigationAtStart;
    void read(`/api/letters/${encodeURIComponent(id || featuredId)}`)
      .catch((error) => {
        if (!id && isCurrent() && error instanceof ApiError && error.status === 404)
          return read("/api/rotation");
        throw error;
      })
      .then((data) => {
        if (!isCurrent()) return;
        if (!data.letter) {
          setLoadError("empty");
          return;
        }
        setLetter(data.letter);
        document.title = `${data.letter.salutation} · Letters to Grow`;
        if (!id) resolvedRoot.current = data.letter.id;
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
    setFeedback("");
    try {
      const path = previousId
        ? `/api/rotation?exclude=${encodeURIComponent(previousId)}`
        : "/api/rotation";
      const data = await request<{ letter: PublicLetter | null }>(path, {
        signal: controller.signal,
      });
      if (!isCurrent()) return;
      if (data.letter) {
        navigate({ kind: "read", id: data.letter.id }, false, data.letter);
      } else {
        setLoadError("empty");
        setLetter(null);
      }
    } catch {
      if (isCurrent()) {
        if (previousId) setFeedback("Could not open another letter. Please try again.");
        else setLoadError("service");
      }
    } finally {
      if (isCurrent()) setLoading(false);
      if (rotation.current === controller) rotation.current = null;
    }
  }

  function openModal(next: "share" | "about" | "report") {
    savedFocus.current = document.activeElement as HTMLElement;
    setFeedback("");
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

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Letter link copied.");
    } catch {
      document.getElementById("published-url")?.focus();
      setFeedback("Select and copy your letter link above.");
    }
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
      <header className="masthead"><div className="masthead-inner">
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
          <span className="masthead-campaign" aria-hidden="true">Letters to Grow<span>.</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a
            aria-current={view.kind === "community" ? "page" : undefined}
            href="/?community"
            onClick={(event) => {
              event.preventDefault();
              navigate({ kind: "community" });
            }}
          >
            Community letters
          </a>
          <a
            className="nav-write"
            aria-current={view.kind === "write" ? "page" : undefined}
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
      </div></header>
      <main id="main" className="layout">
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
              {loading && !letter ? (
                <section className="paper state-paper" aria-busy="true">
                  <p className="eyebrow">Letters to Grow</p>
                  <h1>Opening a letter…</h1>
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
                      <div className="reader-actions" aria-label="Letter actions">
                        <button className="btn primary" onClick={nextLetter} disabled={loading} aria-busy={loading}>
                          <Shuffle size={16} aria-hidden="true" />
                          Read another
                        </button>
                        <button className="btn secondary" onClick={() => openModal("share")}>
                          <ShareNetwork size={16} aria-hidden="true" />
                          Share
                        </button>
                      </div>
                      <p className="reader-feedback" role="status">{!published && feedback}</p>
                      <div className="letter-body">
                        {letter.paragraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      <p className="letter-signoff">{letter.signoff}</p>
                    </article>
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
            <Suspense fallback={<p className="state-message" role="status">Opening the writer…</p>}>
            <WriteLetter
              onBack={() => navigate({ kind: "read" })}
              onPublished={(item) => {
                navigate({ kind: "read", id: item.id }, false, item);
                setPublished(true);
              }}
            />
            </Suspense>
          )}
          {view.kind === "community" && (
            <section className="community" aria-labelledby="community-heading">
              <div className="collection-heading">
                <h1 id="community-heading" ref={heading} tabIndex={-1}>
                  Community letters
                </h1>
                <p>
                  Letters from people figuring things out as they go.
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
        <aside className="identity" aria-label="About Letters to Grow">
          <p className="identity-kicker">Still, we grow</p>
          <a
            href="/"
            className="wordmark"
            onClick={(event) => {
              event.preventDefault();
              navigate({ kind: "read" });
            }}
          >
            Letters<br />to Grow<span aria-hidden="true">.</span>
          </a>
          <div className="identity-art" aria-hidden="true">
            <img src="/art/letters-still-life.webp" alt="" width="560" height="700" decoding="async" loading="lazy" />
          </div>
          <p className="campaign-line">What are you still figuring out?</p>
        </aside>
      </main>
      <footer className="site-footer">
        <span>Letters to Grow · TEDxUniversitasIndonesia 2027</span>
        <button onClick={() => openModal("about")}>
          About this collection
        </button>
      </footer>
      <dialog
        ref={dialog}
        className={`dialog ${modal === "share" ? "share-dialog" : ""}`}
        aria-labelledby={modal === "share" ? "share-builder-title" : "dialog-title"}
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
          <Suspense fallback={<h2 id="share-builder-title">Opening the card builder…</h2>}>
            <ShareBuilder letter={letter} letterUrl={url} />
          </Suspense>
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
