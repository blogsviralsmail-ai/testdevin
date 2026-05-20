import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SparkVibe - Find Your Spark Through Video Chat",
  description:
    "Connect with real people through live HD video calls. Discover your perfect match with our fun quiz and start chatting instantly. Safe, fun, and exciting video dating.",
  keywords: [
    "video chat",
    "dating",
    "video dating",
    "online chat",
    "meet people",
    "video calls",
    "romantic chat",
  ],
  openGraph: {
    title: "SparkVibe - Find Your Spark Through Video Chat",
    description:
      "Connect with real people through live HD video calls. Your perfect match is just a click away.",
    type: "website",
    siteName: "SparkVibe",
  },
  twitter: {
    card: "summary_large_image",
    title: "SparkVibe - Find Your Spark Through Video Chat",
    description: "Connect with real people through live HD video calls.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
