/**
 * Server-side i18n entry point. Reads the active locale from the
 * `locale` cookie and resolves keys against the four shipped JSON
 * dictionaries. Client components should import constants from
 * `i18n-shared` and use the <I18nProvider> for translation.
 *
 * Adding a new language:
 *   1. Drop a new JSON file in src/i18n/<code>.json
 *   2. Append the code in i18n-shared (Locale, LOCALES, LOCALE_NAMES)
 *   3. Add it to the DICTS map below
 */
import { cookies } from "next/headers";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";
import es from "@/i18n/es.json";
import pt from "@/i18n/pt.json";
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_NAMES,
  isLocale,
} from "./i18n-shared";

export { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE, isLocale };
export type { Locale };

const DICTS: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  es: es as Record<string, string>,
  pt: pt as Record<string, string>,
};

/** Read the active locale on the server side (RSC + route handlers). */
export function getLocale(): Locale {
  try {
    const c = cookies().get("locale")?.value;
    if (isLocale(c)) return c;
  } catch {
    // cookies() throws when called outside a request context; fall through.
  }
  return DEFAULT_LOCALE;
}

/** Server-side translate. Falls back to English then to the key itself. */
export function t(key: string, locale?: Locale): string {
  const loc = locale ?? getLocale();
  return DICTS[loc][key] ?? DICTS.en[key] ?? key;
}

/** Returns the full dictionary for a locale — used to hydrate the client provider. */
export function getDict(locale: Locale): Record<string, string> {
  return DICTS[locale];
}
