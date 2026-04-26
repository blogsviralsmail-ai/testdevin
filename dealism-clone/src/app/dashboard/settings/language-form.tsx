"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n-shared";
import { useT } from "@/components/i18n-provider";

export function LanguageForm({ initialLocale }: { initialLocale: Locale }) {
  const { t } = useT();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed");
        return;
      }
      toast.success("Saved");
      // Hard reload so server components re-render in the new locale.
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="locale">{t("settings.language.label")}</Label>
      <select
        id="locale"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
      <p className="text-xs text-neutral-500">{t("settings.language.help")}</p>
      <Button onClick={save} disabled={saving || locale === initialLocale}>
        {saving ? t("common.loading") : t("common.save")}
      </Button>
    </div>
  );
}
