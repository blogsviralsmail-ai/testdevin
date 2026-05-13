import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import SEOHead from "@/components/SEOHead";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "KKHS Media - Best Paid Internship Programs in Jaipur | Video Editing, Digital Marketing, Web Development",
    template: "%s | KKHS Media",
  },
  description: "Join KKHS Media's paid internship programs in Jaipur. Learn Video Editing, Digital Marketing, Web Development & Graphic Design with certificate, stipend & placement support. Apply now!",
  keywords: "internship in jaipur 2026, paid internship jaipur, video editing internship, digital marketing internship, web development internship, graphic design internship, KKHS Media, internship with certificate, best internship program jaipur, paid training program, summer internship 2026, online internship india, content creation internship, social media marketing internship, app development internship, SEO internship, internship Rajasthan",
  authors: [{ name: "KKHS Media" }],
  creator: "KKHS Media",
  publisher: "KKHS Media",
  metadataBase: new URL("https://internship.kkhsmedia.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KKHS Media - Best Paid Internship Programs in Jaipur",
    description: "Gain real industry experience with KKHS Media's paid internship programs. Video Editing, Digital Marketing, Web Development & more. Certificate included.",
    url: "https://internship.kkhsmedia.com",
    siteName: "KKHS Media",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "KKHS Media - Best Paid Internship Programs in Jaipur",
    description: "Paid internship programs with certificate & stipend. Apply now!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "KKHS Media",
    alternateName: "KKHS Media Private Limited",
    url: "https://internship.kkhsmedia.com",
    logo: "https://internship.kkhsmedia.com/favicon.ico",
    description: "Jaipur's leading internship training institute offering paid programs in Video Editing, Digital Marketing, Web Development & Graphic Design. 500+ students trained with industry-recognized certificates.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.youtube.com/@KKHSMedia",
      "https://www.instagram.com/kkhsmedia/",
      "https://www.facebook.com/KKHSMEDIA/",
      "https://www.linkedin.com/company/kkhs-media",
      "https://kkhsmedia.com",
      "https://www.wikidata.org/wiki/Q139765723",
    ],
    founder: {
      "@type": "Person",
      name: "Hari Soni",
      jobTitle: "Managing Director & Founder",
      email: "hari@kkhsmedia.com",
      telephone: "+91-9782005500",
      url: "https://www.instagram.com/iamharisoni/",
      sameAs: [
        "https://www.instagram.com/iamharisoni/",
        "https://www.facebook.com/iamharisoni/",
        "https://in.linkedin.com/in/iamharisoni",
        "https://twitter.com/IAMHARISONI",
        "https://www.mid-day.com/lifestyle/culture/article/hari-soni-new-marketing-expert-to-change-digital-game-of-2021-23154870",
        "https://www.netnewsledger.com/2021/01/08/hari-soni-is-changing-the-digital-marketing-game-in-jaipur/",
      ],
      worksFor: {
        "@type": "Organization",
        name: "KKHS Media",
      },
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9782005500",
      contactType: "customer service",
      email: "hari@kkhsmedia.com",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    foundingDate: "2020",
    areaServed: "India",
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      minValue: 10,
      maxValue: 50,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Internship Programs",
      itemListElement: [
        { "@type": "Course", name: "Video Editing Internship", description: "Learn Adobe Premiere Pro, After Effects, Color Grading", provider: { "@type": "Organization", name: "KKHS Media" } },
        { "@type": "Course", name: "Digital Marketing Internship", description: "SEO, Google Ads, Social Media Marketing", provider: { "@type": "Organization", name: "KKHS Media" } },
        { "@type": "Course", name: "Web Development Internship", description: "React, Node.js, Full Stack Development", provider: { "@type": "Organization", name: "KKHS Media" } },
        { "@type": "Course", name: "Graphic Design Internship", description: "Photoshop, Illustrator, UI/UX Design", provider: { "@type": "Organization", name: "KKHS Media" } },
      ],
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KKHS Media",
    alternateName: "KKHS Media Internship Programs",
    url: "https://internship.kkhsmedia.com",
    description: "Jaipur's leading internship training institute offering paid programs in Video Editing, Digital Marketing, Web Development & Graphic Design.",
    publisher: {
      "@type": "Organization",
      name: "KKHS Media",
      url: "https://internship.kkhsmedia.com",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://internship.kkhsmedia.com/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <SEOHead />
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
