/**
 * Pure-data i18n constants safe to import from both server and client.
 * Anything that touches next/headers belongs in lib/i18n.ts (server-only).
 */
export type Locale = "en" | "hi" | "es" | "pt";

export const LOCALES: Locale[] = ["en", "hi", "es", "pt"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  es: "Español",
  pt: "Português",
};

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}
