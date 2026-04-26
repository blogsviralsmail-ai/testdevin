"use client";
import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "./i18n-provider";
import type { Locale } from "@/lib/i18n-shared";

export function Providers({
  children,
  locale,
  dict,
}: {
  children: React.ReactNode;
  locale: Locale;
  dict: Record<string, string>;
}) {
  return (
    <SessionProvider>
      <I18nProvider locale={locale} dict={dict}>
        {children}
      </I18nProvider>
    </SessionProvider>
  );
}
