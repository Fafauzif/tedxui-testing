export const openedLetterCookie: string;
export function hasOpenedLetter(cookies: string): boolean;
export function openingLine(letter: { paragraphs: readonly string[] }): string;
export function isSampleLetter(letter: { id: string; origin: string }): boolean;
