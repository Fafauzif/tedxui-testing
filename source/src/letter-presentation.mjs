export const openedLetterCookie = "ltg_opened=yes";

export function hasOpenedLetter(cookies) {
  return cookies.split(";").some((cookie) => cookie.trim() === openedLetterCookie);
}

export function openingLine(letter) {
  const first = letter.paragraphs[0] ?? "";
  const sentence = first.match(/^.*?[.!?](?=\s|$)/u)?.[0] ?? first;
  const characters = Array.from(sentence);
  if (characters.length <= 140) return sentence;
  return `${characters.slice(0, 138).join("").replace(/\s+\S*$/u, "")}…`;
}

export function isSampleLetter(letter) {
  return letter.origin === "community" && letter.id.startsWith("preview-sample-");
}
