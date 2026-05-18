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
  // EEAT: Enhanced Organization schema with trust signals
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": "https://internship.kkhsmedia.com/#organization",
    name: "KKHS Media",
    alternateName: "KKHS Media Private Limited",
    url: "https://internship.kkhsmedia.com",
    logo: {
      "@type": "ImageObject",
      url: "https://internship.kkhsmedia.com/favicon.ico",
      width: 256,
      height: 256,
    },
    image: "https://internship.kkhsmedia.com/favicon.ico",
    description: "KKHS Media is Jaipur's leading internship training institute, founded in 2020 by digital marketing expert Hari Prasad Soni. We offer paid internship programs in Video Editing, Digital Marketing, Web Development, Graphic Design, and 9 more domains. Over 10,000 students certified with industry-recognized certificates, stipend support, and placement assistance.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "190A Krishna Kunj, Kalwar Road",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302012",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 26.9503,
      longitude: 75.7873,
    },
    sameAs: [
      "https://www.youtube.com/@KKHSMedia",
      "https://www.instagram.com/kkhsmedia/",
      "https://www.facebook.com/KKHSMEDIA/",
      "https://www.linkedin.com/company/kkhs-media",
      "https://kkhsmedia.com",
      "https://www.wikidata.org/wiki/Q139765723",
    ],
    // EEAT: Founder with full credentials and authority signals
    founder: {
      "@type": "Person",
      "@id": "https://kkhsmedia.com/#founder",
      name: "Hari Prasad Soni",
      alternateName: "Hari Soni",
      jobTitle: "Managing Director & Founder",
      email: "hari@kkhsmedia.com",
      telephone: "+91-9782005500",
      url: "https://www.instagram.com/iamharisoni/",
      image: "https://kkhsmedia.com/assets/team/hari-soni.jpg",
      description: "Hari Prasad Soni is the founder of KKHS Media Private Limited, a digital marketing expert based in Jaipur, India. With over 5 years of experience in digital marketing, web development, and video production, he has trained 10,000+ students through KKHS Media's internship programs.",
      knowsAbout: ["Digital Marketing", "SEO", "Social Media Marketing", "Web Development", "Video Production", "Brand Strategy", "Content Marketing"],
      alumniOf: {
        "@type": "Organization",
        name: "KKHS Media",
      },
      sameAs: [
        "https://www.instagram.com/iamharisoni/",
        "https://www.facebook.com/iamharisoni/",
        "https://in.linkedin.com/in/iamharisoni",
        "https://twitter.com/IAMHARISONI",
        "https://www.wikidata.org/wiki/Q139765723",
      ],
      worksFor: {
        "@type": "Organization",
        "@id": "https://internship.kkhsmedia.com/#organization",
        name: "KKHS Media",
      },
      // EEAT: Experience — news articles as third-party validation
      subjectOf: [
        {
          "@type": "Article",
          headline: "Hari Soni: New Marketing Expert to Change Digital Game",
          url: "https://www.mid-day.com/lifestyle/culture/article/hari-soni-new-marketing-expert-to-change-digital-game-of-2021-23154870",
          publisher: { "@type": "Organization", name: "Mid-Day" },
        },
        {
          "@type": "Article",
          headline: "Hari Soni is Changing the Digital Marketing Game in Jaipur",
          url: "https://www.netnewsledger.com/2021/01/08/hari-soni-is-changing-the-digital-marketing-game-in-jaipur/",
          publisher: { "@type": "Organization", name: "NetNewsLedger" },
        },
      ],
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
    // EEAT: Trust signals — aggregate rating
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "500",
      bestRating: "5",
      worstRating: "1",
    },
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
    // EEAT: Accreditation/recognition signals
    award: ["Best Internship Training Institute Jaipur 2024", "10,000+ Students Certified"],
    slogan: "Learn by Doing — Real Projects, Real Experience",
  };

  // GRO: WebSite schema with Speakable for AI/voice extraction
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://internship.kkhsmedia.com/#website",
    name: "KKHS Media",
    alternateName: "KKHS Media Internship Programs",
    url: "https://internship.kkhsmedia.com",
    description: "KKHS Media offers paid internship programs in Jaipur for Video Editing, Digital Marketing, Web Development, Graphic Design, and more. Programs include UGC-compliant certificates, stipend support, offer letters, and placement assistance.",
    publisher: {
      "@type": "Organization",
      "@id": "https://internship.kkhsmedia.com/#organization",
      name: "KKHS Media",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://internship.kkhsmedia.com/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
    // GRO: Speakable — tells AI/voice assistants which content to read/cite
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["title", "meta[name='description']"],
    },
  };

  // AEO: FAQPage schema — direct answers for AI engines (ChatGPT, Perplexity, Google AI Overview)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is KKHS Media's internship program?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "KKHS Media offers paid internship programs in Jaipur across 13 domains including Video Editing, Digital Marketing, Web Development, Graphic Design, SEO, App Development, and more. Each program includes pre-recorded video lessons, daily tasks, expert mentorship, a UGC-compliant certificate with QR verification, offer letter on day 1, experience letter, and letter of recommendation.",
        },
      },
      {
        "@type": "Question",
        name: "Is the KKHS Media internship paid?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, KKHS Media offers both free and paid internship programs. Paid programs include stipend support based on attendance and performance. All programs provide an offer letter, certificate, and experience letter regardless of the fee model.",
        },
      },
      {
        "@type": "Question",
        name: "How to apply for an internship at KKHS Media?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "To apply for an internship at KKHS Media: 1) Visit internship.kkhsmedia.com/programs and choose your domain. 2) Click 'Apply Now' and fill in your details. 3) Receive your offer letter instantly. 4) Start learning through video lessons and daily tasks. The process takes less than 5 minutes.",
        },
      },
      {
        "@type": "Question",
        name: "What certificate does KKHS Media provide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "KKHS Media provides a UGC-compliant certificate with QR code verification. The certificate is recognized by universities and employers across India. Additionally, you receive an experience letter and letter of recommendation (LOR) upon completion.",
        },
      },
      {
        "@type": "Question",
        name: "Can I do the KKHS Media internship online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, KKHS Media offers online, offline, and hybrid internship modes. Online interns access pre-recorded video lessons and complete daily tasks at their own pace. Offline interns attend sessions at the Jaipur office at 190A Krishna Kunj, Kalwar Road. Hybrid mode combines both.",
        },
      },
      {
        "@type": "Question",
        name: "Who founded KKHS Media?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "KKHS Media was founded in 2020 by Hari Prasad Soni, a digital marketing expert based in Jaipur, India. He has been featured in Mid-Day and NetNewsLedger for his work in transforming digital marketing education. Under his leadership, KKHS Media has certified over 10,000 students.",
        },
      },
    ],
  };

  // AEO: HowTo schema — step-by-step for AI engines
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Join KKHS Media's Internship Program",
    description: "A simple 4-step process to join KKHS Media's paid internship program in Jaipur and start building real industry skills.",
    totalTime: "PT5M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Choose Your Program",
        text: "Browse 13+ internship domains at internship.kkhsmedia.com/programs — Marketing, Tech, Design, HR and more. Pick what excites you.",
        url: "https://internship.kkhsmedia.com/programs",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Register and Get Your Offer Letter",
        text: "Fill in your details on the registration form. You'll receive a professional offer letter instantly — perfect for college credit and placement records.",
        url: "https://internship.kkhsmedia.com/register",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Learn and Build Daily",
        text: "Watch pre-recorded video lessons, complete daily tasks, and submit work. Track your progress on the student dashboard. Learn at your own pace.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Get Certified",
        text: "Complete the program and receive your QR-verified UGC-compliant certificate, experience letter, and letter of recommendation.",
      },
    ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
        <SEOHead />
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
