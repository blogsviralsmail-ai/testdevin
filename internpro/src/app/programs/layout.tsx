import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internship Programs 2026 | Video Editing, Digital Marketing, Web Development",
  description: "Explore 13+ paid internship programs at KKHS Media Jaipur. Video Editing, Digital Marketing, Web Development, Graphic Design & more. Certificate + Stipend. Online & Offline modes available.",
  keywords: "internship programs jaipur, paid internship courses, video editing course, digital marketing training, web development internship, KKHS Media programs 2026",
  openGraph: {
    title: "Internship Programs 2026 | KKHS Media Jaipur",
    description: "13+ paid internship programs. Video Editing, Digital Marketing, Web Development & more. Certificate + Stipend included.",
    url: "https://internship.kkhsmedia.com/programs",
    siteName: "KKHS Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Internship Programs 2026 | KKHS Media Jaipur",
    description: "13+ paid internship programs. Video Editing, Digital Marketing, Web Development & more. Certificate + Stipend included.",
  },
  alternates: {
    canonical: "/programs",
  },
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
