import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | KKHS Media Internship Institute Jaipur",
  description: "Get in touch with KKHS Media for internship queries, program information, and enrollment support. Located in Jaipur, Rajasthan. Call, email, or visit us today.",
  keywords: "contact KKHS Media, internship inquiry jaipur, KKHS Media address, internship support, KKHS Media phone number",
  openGraph: {
    title: "Contact KKHS Media | Internship Institute Jaipur",
    description: "Get in touch for internship queries and enrollment support. Located in Jaipur, Rajasthan.",
    url: "https://internship.kkhsmedia.com/contact",
    siteName: "KKHS Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact KKHS Media | Internship Institute Jaipur",
    description: "Get in touch for internship queries and enrollment support. Located in Jaipur, Rajasthan.",
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
