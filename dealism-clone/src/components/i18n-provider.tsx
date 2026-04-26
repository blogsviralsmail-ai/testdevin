"use client";
/**
 * Client-side i18n bridge. Server passes the active locale + its
 * dictionary down through props; client components consume via useT().
 */
import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n-shared";

interface I18nValue {
  locale: Locale;
  dict: Record<string, string>;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Record<string, string>;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  const t = useCallback(
    (key: string): string => {
      if (!ctx) return key;
      return ctx.dict[key] ?? key;
    },
    [ctx],
  );
  return { t, locale: ctx?.locale ?? "en" };
}
