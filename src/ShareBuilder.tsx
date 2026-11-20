import { useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  Check,
  Copy,
  DownloadSimple,
  ShareNetwork,
} from "@phosphor-icons/react";
import type { PublicLetter } from "./api";
import {
  CARD_FORMATS,
  CARD_STYLES,
  copyLink,
  createShareCard,
  downloadCard,
  shareCard,
} from "./share";
import type { CardFormat, CardStyle, ShareCard } from "./share";
import "./share-builder.css";

type Props = { letter: PublicLetter; letterUrl: string };

/** Mount inside the parent dialog only while it is open. */
export default function ShareBuilder({ letter, letterUrl }: Props) {
  const [format, setFormat] = useState<CardFormat>("story");
  const [style, setStyle] = useState<CardStyle>("heart");
  const [excerpt, setExcerpt] = useState(letter.excerpt);
  const [card, setCard] = useState<ShareCard | null>(null);
  const [busy, setBusy] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [manualLink, setManualLink] = useState(false);
  const [retry, setRetry] = useState(0);
  const renderRequest = useRef(0);
  const cache = useRef(new Map<string, ShareCard>());
  const lastLetter = useRef(letter.id);

  useEffect(() => {
    if (lastLetter.current === letter.id) return;
    lastLetter.current = letter.id;
    setExcerpt(letter.excerpt);
    setMessage("");
  }, [letter.id, letter.excerpt]);

  useEffect(() => {
    const request = ++renderRequest.current;
    const key = JSON.stringify([
      letter.id,
      letter.signoff,
      letter.origin,
      letterUrl,
      excerpt,
      format,
      style,
    ]);
    setBusy(true);
    setCard(null);
    setError("");
    setMessage("");
    const cached = cache.current.get(key);
    if (cached) {
      setCard(cached);
      setBusy(false);
      return;
    }
    void createShareCard({
      excerpt,
      salutation: letter.salutation,
      signoff: letter.signoff,
      origin: letter.origin,
      letterUrl,
      format,
      style,
    })
      .then((result) => {
        if (request !== renderRequest.current) {
          URL.revokeObjectURL(result.url);
          return;
        }
        cache.current.set(key, result);
        // Retain recent selections without accumulating large raster files.
        if (cache.current.size > 9) {
          const oldest = cache.current.keys().next().value;
          if (oldest) {
            const retired = cache.current.get(oldest);
            if (retired) URL.revokeObjectURL(retired.url);
            cache.current.delete(oldest);
          }
        }
        setCard(result);
      })
      .catch((cause) => {
        if (request === renderRequest.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Your card could not be prepared. Please try again.",
          );
      })
      .finally(() => {
        if (request === renderRequest.current) setBusy(false);
      });
    return () => {
      renderRequest.current++;
    };
  }, [
    letter.id,
    letter.salutation,
    letter.signoff,
    letter.origin,
    letterUrl,
    excerpt,
    format,
    style,
    retry,
  ]);

  useEffect(
    () => () => {
      renderRequest.current++;
      cache.current.forEach((item) => URL.revokeObjectURL(item.url));
      cache.current.clear();
    },
    [],
  );

  function onShare() {
    if (!card || busy || sharing) return;
    setSharing(true);
    setMessage("");
    // No rendering or file preparation runs before the native share call.
    void shareCard(card)
      .then((result) => {
        setMessage(
          result === "cancelled"
            ? "Sharing cancelled. Your card is still here."
            : result === "downloaded"
              ? "Image download started. You can also open the full-size image below."
              : "Image handed to your device’s share menu.",
        );
      })
      .catch(() =>
        setMessage("Sharing could not open. Save the image or open it below."),
      )
      .finally(() => setSharing(false));
  }
  function onSave() {
    if (!card || busy) return;
    try {
      downloadCard(card);
      setMessage(
        "Image download started. If it does not save, open the full-size image below.",
      );
    } catch {
      setMessage(
        "Open the full-size image below, then save it to your device.",
      );
    }
  }
  async function onCopy() {
    const copied = await copyLink(letterUrl);
    setManualLink(!copied);
    setMessage(
      copied ? "Letter link copied." : "Select and copy the letter link below.",
    );
  }
  const choices = Array.from(
    new Set([letter.excerpt, ...letter.excerpts]),
  ).filter(Boolean);
  const dimensions = CARD_FORMATS[format];

  return (
    <div className="share-builder">
      <div className="share-builder-heading">
        <h2 id="share-builder-title">
          Make it <em>yours.</em>
        </h2>
      </div>
      <div className="share-builder-layout">
        <div className="share-builder-preview-column">
          <div
            className={`share-builder-preview format-${format}`}
            aria-busy={busy}
          >
            {busy ? (
              <div className="share-builder-loading" role="status">
                <span aria-hidden="true" />
                Preparing your card…
              </div>
            ) : card ? (
              <img
                src={card.url}
                width={dimensions.width}
                height={dimensions.height}
                alt={`Your ${dimensions.label.toLowerCase()} card. ${excerpt} — ${letter.signoff || "Anonymous"}`}
              />
            ) : (
              <div className="share-builder-failed">
                <p>Your image could not be prepared.</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  <ArrowClockwise size={18} aria-hidden="true" />
                  Try again
                </button>
              </div>
            )}
          </div>
          <p className="share-builder-size">
            {dimensions.width} × {dimensions.height} PNG
          </p>
        </div>
        <div className="share-builder-controls">
          <div className="share-builder-quick-actions">
            <div className="share-builder-actions">
              <button
                type="button"
                className="share-builder-primary"
                onClick={onShare}
                disabled={!card || busy || sharing}
              >
                <ShareNetwork size={18} aria-hidden="true" />
                {sharing ? "Opening share menu…" : "Share image"}
              </button>
              <button
                type="button"
                className="share-builder-secondary"
                onClick={onSave}
                disabled={!card || busy || sharing}
              >
                <DownloadSimple size={18} aria-hidden="true" />
                Save image
              </button>
              <button
                type="button"
                className="share-builder-copy"
                onClick={() => void onCopy()}
              >
                <Copy size={17} aria-hidden="true" />
                Copy letter link
              </button>
            </div>
            <p
              className="share-builder-feedback"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
            {manualLink && (
              <label className="share-builder-manual">
                Letter link
                <input
                  readOnly
                  value={letterUrl}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </label>
            )}
          </div>
          <fieldset className="share-builder-group">
            <legend>Format</legend>
            <div className="share-builder-segments">
              {(Object.keys(CARD_FORMATS) as CardFormat[]).map((option) => (
                <label
                  key={option}
                  className={format === option ? "is-selected" : ""}
                >
                  <input
                    type="radio"
                    name="card-format"
                    value={option}
                    checked={format === option}
                    onChange={() => setFormat(option)}
                    disabled={sharing}
                  />
                  <span>{CARD_FORMATS[option].label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="share-builder-group">
            <legend>Style</legend>
            <div className="share-builder-styles">
              {(Object.keys(CARD_STYLES) as CardStyle[]).map((option) => (
                <label
                  key={option}
                  className={style === option ? "is-selected" : ""}
                >
                  <input
                    type="radio"
                    name="card-style"
                    value={option}
                    checked={style === option}
                    onChange={() => setStyle(option)}
                    disabled={sharing}
                  />
                  <span
                    className={`share-builder-swatch swatch-${option}`}
                    aria-hidden="true"
                  >
                    <i />
                  </span>
                  <span>{CARD_STYLES[option]}</span>
                  {style === option && (
                    <Check
                      className="share-builder-style-check"
                      size={14}
                      aria-hidden="true"
                    />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="share-builder-group share-builder-excerpts">
            <legend>Choose a line</legend>
            {choices.map((choice) => (
              <label
                key={choice}
                className={excerpt === choice ? "is-selected" : ""}
              >
                <input
                  type="radio"
                  name="card-excerpt"
                  value={choice}
                  checked={excerpt === choice}
                  onChange={() => setExcerpt(choice)}
                  disabled={sharing}
                />
                <span>{choice}</span>
              </label>
            ))}
          </fieldset>
          {error && (
            <div className="share-builder-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                <ArrowClockwise size={16} aria-hidden="true" />
                Try again
              </button>
            </div>
          )}
          <p className="share-builder-instruction">
            In Instagram, add the image to your Story and paste the letter link
            into a link sticker.
          </p>
          {card && (
            <details className="share-builder-help">
              <summary>Having trouble saving?</summary>
              <p>
                Open the image, then touch and hold it to save to Photos. If
                Instagram blocks saving, open this letter in Safari or Chrome.
              </p>
              <a href={card.url} target="_blank" rel="noopener">
                Open full-size image
              </a>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
