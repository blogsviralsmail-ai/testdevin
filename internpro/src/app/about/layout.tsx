import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About KKHS Media | Best Internship Training Institute in Jaipur",
  description: "KKHS Media is Jaipur's leading internship training institute offering paid programs in Video Editing, Digital Marketing, Web Development & Graphic Design. 500+ students trained.",
  keywords: "about KKHS Media, internship institute jaipur, best training institute, video editing course jaipur, digital marketing training, KKHS Media team",
  openGraph: {
    title: "About KKHS Media | Internship Training Institute Jaipur",
    description: "Jaipur's leading internship training institute. 500+ students trained in Video Editing, Digital Marketing, Web Development & more.",
    url: "https://internship.kkhsmedia.com/about",
    siteName: "KKHS Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About KKHS Media | Internship Training Institute Jaipur",
    description: "Jaipur's leading internship training institute. 500+ students trained in Video Editing, Digital Marketing, Web Development & more.",
  },
  alternates: {
    canonical: "https://internship.kkhsmedia.com/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div itemScope itemType="https://schema.org/Organization">
        <meta itemProp="name" content="KKHS Media" />
        <meta itemProp="description" content="Leading internship training institute in Jaipur offering paid programs in Video Editing, Digital Marketing, Web Development & Graphic Design." />
        <meta itemProp="url" content="https://internship.kkhsmedia.com" />
        <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
          <meta itemProp="addressLocality" content="Jaipur" />
          <meta itemProp="addressRegion" content="Rajasthan" />
          <meta itemProp="addressCountry" content="IN" />
        </div>
      </div>
      {children}
    </>
  );
}
