"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

interface SEOSettings {
  ga_measurement_id?: string;
  gtm_id?: string;
  adsense_publisher_id?: string;
  adsense_auto_ads?: string;
  google_site_verification?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  custom_head_code?: string;
}

export default function SEOHead() {
  const [settings, setSettings] = useState<SEOSettings>({});

  useEffect(() => {
    fetch("/api/seo-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!settings.seo_title && !settings.seo_description && !settings.seo_keywords && !settings.google_site_verification && !settings.og_title) return;

    // Update document title
    if (settings.seo_title) {
      document.title = settings.seo_title;
    }

    // Update or create meta tags
    const setMeta = (name: string, content: string, property?: boolean) => {
      if (!content) return;
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (settings.seo_description) setMeta("description", settings.seo_description);
    if (settings.seo_keywords) setMeta("keywords", settings.seo_keywords);
    if (settings.google_site_verification) setMeta("google-site-verification", settings.google_site_verification);
    if (settings.og_title) setMeta("og:title", settings.og_title, true);
    if (settings.og_description) setMeta("og:description", settings.og_description, true);
    if (settings.og_image) setMeta("og:image", settings.og_image, true);
    setMeta("og:type", "website", true);

    // Canonical URL
    if (settings.seo_canonical_url) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = settings.seo_canonical_url;
    }

    // Custom head code
    if (settings.custom_head_code) {
      const div = document.createElement("div");
      div.innerHTML = settings.custom_head_code;
      const scripts = div.querySelectorAll("script");
      scripts.forEach((s) => {
        const newScript = document.createElement("script");
        if (s.src) newScript.src = s.src;
        if (s.textContent) newScript.textContent = s.textContent;
        Array.from(s.attributes).forEach((attr) => {
          if (attr.name !== "src") newScript.setAttribute(attr.name, attr.value);
        });
        document.head.appendChild(newScript);
      });
      const metas = div.querySelectorAll("meta, link");
      metas.forEach((m) => document.head.appendChild(m.cloneNode(true)));
    }
  }, [settings]);

  const gaId = settings.ga_measurement_id;
  const gtmId = settings.gtm_id;
  const adsenseId = settings.adsense_publisher_id;

  return (
    <>
      {/* Google Analytics */}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {/* Google AdSense */}
      {adsenseId && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
