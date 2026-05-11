"use client";

import { useState, useEffect } from "react";

const DEFAULT_MSG = "Hi Sir,\nI am interested in internship in your company.";

export default function WhatsAppWidget() {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState(DEFAULT_MSG);

  useEffect(() => {
    fetch("/api/settings/public").then(r => r.ok ? r.json() : {}).then((d: Record<string, string>) => {
      if (d.whatsapp_number) setNumber(d.whatsapp_number);
      if (d.whatsapp_message) setMessage(d.whatsapp_message);
    }).catch(() => {});
  }, []);

  if (!number) return null;

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      style={{
        background: '#25D366',
        boxShadow: '0 4px 0 #1da851, 0 6px 20px rgba(37,211,102,0.4)',
      }}
      title="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.502 1.14 6.742 3.068 9.37L1.06 31.44l6.256-2.004A15.932 15.932 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.35 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.828-6.812-8.066-7.128-.228-.316-1.918-2.554-1.918-4.872s1.214-3.456 1.644-3.928c.43-.472.94-.59 1.254-.59.314 0 .628.002.902.016.29.014.678-.11 1.06.808.39.94 1.332 3.244 1.448 3.48.116.236.194.512.04.824-.156.316-.234.512-.468.786-.234.276-.492.616-.702.826-.234.234-.478.488-.206.958.274.47 1.216 2.006 2.612 3.25 1.794 1.598 3.306 2.094 3.776 2.328.47.234.744.196 1.018-.118.274-.314 1.176-1.372 1.49-1.844.314-.472.628-.39 1.06-.234.43.156 2.736 1.292 3.206 1.526.47.234.784.352.9.548.118.196.118 1.136-.272 2.234z"/>
      </svg>
    </a>
  );
}
