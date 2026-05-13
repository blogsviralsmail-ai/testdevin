"use client";

import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";

const btn3d = "relative transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0";

interface SocialLink {
  key: string;
  url: string;
  label: string;
  icon: ReactNode;
  color: string;
}

export default function PublicFooter() {
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => {
        const links: SocialLink[] = [];
        if (data.social_facebook) links.push({ key: "facebook", url: data.social_facebook, label: "Facebook", color: "#1877F2", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> });
        if (data.social_instagram) links.push({ key: "instagram", url: data.social_instagram, label: "Instagram", color: "#E4405F", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/></svg> });
        if (data.social_twitter) links.push({ key: "twitter", url: data.social_twitter, label: "X (Twitter)", color: "#000000", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> });
        if (data.social_linkedin) links.push({ key: "linkedin", url: data.social_linkedin, label: "LinkedIn", color: "#0A66C2", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> });
        if (data.social_youtube) links.push({ key: "youtube", url: data.social_youtube, label: "YouTube", color: "#FF0000", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> });
        if (data.social_telegram) links.push({ key: "telegram", url: data.social_telegram, label: "Telegram", color: "#26A5E4", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> });
        if (data.social_pinterest) links.push({ key: "pinterest", url: data.social_pinterest, label: "Pinterest", color: "#BD081C", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.174.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg> });
        if (data.social_whatsapp_channel) links.push({ key: "whatsapp", url: data.social_whatsapp_channel, label: "WhatsApp", color: "#25D366", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> });
        setSocials(links);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="relative py-16" style={{background: 'linear-gradient(180deg, rgba(10,14,26,0.5), #0a0e1a)', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h4 className="text-lg font-bold text-white mb-5">Platform</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/programs", label: "Programs" },
                { href: "/vacancies", label: "Openings" },
                { href: "/register", label: "Register" },
                { href: "/login", label: "Login" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white ${btn3d}`}
                  style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-5">Company</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/team", label: "Our Team" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white ${btn3d}`}
                  style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-5">Legal</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms & Conditions" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className={`text-sm px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white ${btn3d}`}
                  style={{background: 'rgba(255,255,255,0.05)', boxShadow: '0 3px 0 rgba(255,255,255,0.03), 0 4px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)'}}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Social Media Icons */}
        {socials.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {socials.map((s) => (
              <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label} aria-label={`Follow us on ${s.label}`}
                className="social-icon-link w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 3px 0 rgba(0,0,0,0.3)', '--hover-color': s.color} as React.CSSProperties}>
                <span className="text-slate-400 transition-colors" style={{color: 'inherit'}} aria-hidden="true">
                  {s.icon}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="pt-8 text-center" style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
          <p className="text-slate-400 text-sm">&copy; 2020 KKHS Media Private Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
