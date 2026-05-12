import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply for Internship | Register at KKHS Media Jaipur",
  description: "Register now for paid internship programs at KKHS Media, Jaipur. Get instant offer letter, certificate, and mentorship. Limited seats available for 2026 batch!",
  keywords: "apply for internship, register internship jaipur, KKHS Media registration, internship application, join internship program 2026",
  openGraph: {
    title: "Apply for Internship | KKHS Media Jaipur",
    description: "Register for paid internship programs. Instant offer letter + certificate. Limited seats!",
    url: "https://internship.kkhsmedia.com/register",
    siteName: "KKHS Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apply for Internship | KKHS Media Jaipur",
    description: "Register for paid internship programs. Instant offer letter + certificate. Limited seats!",
  },
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
