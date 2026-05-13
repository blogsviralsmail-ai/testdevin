import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | KKHS Media - Internship Tips, Career Guides & Updates",
  description: "Read the latest articles on internships, career development, skill building, and industry insights. Tips for students on video editing, digital marketing, web development internships.",
  keywords: "internship blog, career tips, digital marketing blog, video editing tips, web development guide, KKHS Media blog, student internship advice",
  openGraph: {
    title: "Blog | KKHS Media - Internship Tips & Career Guides",
    description: "Latest articles on internships, career development, and skill building for students.",
    url: "https://internship.kkhsmedia.com/blog",
    siteName: "KKHS Media",
    type: "website",
  },
  alternates: {
    canonical: "https://internship.kkhsmedia.com/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
