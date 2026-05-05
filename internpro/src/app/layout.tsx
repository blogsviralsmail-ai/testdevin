import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
