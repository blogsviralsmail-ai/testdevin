import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import SEOHead from "@/components/SEOHead";

export const metadata: Metadata = {
  title: "InternPro - Complete Internship Management Platform",
  description: "Manage internships end-to-end: attendance, certificates, tasks, payments, and more. Built for colleges, companies, and training institutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SEOHead />
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
