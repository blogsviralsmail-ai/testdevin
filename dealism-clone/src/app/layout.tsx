import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { getLocale, getDict } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Dealism — Your Best Sales Rep, Now AI",
  description:
    "More Leads, More Agenda, More Deals. Dealism is an AI sales agent for WhatsApp, Instagram, and live chat that handles inquiries, qualifies leads, and books appointments 24/7.",
  keywords: ["AI sales agent", "WhatsApp AI", "Instagram DM automation", "sales automation", "lead qualification"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const dict = getDict(locale);
  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans antialiased bg-white text-neutral-900">
        <Providers locale={locale} dict={dict}>
          {children}
        </Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
