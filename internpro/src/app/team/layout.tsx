import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team | KKHS Media - Expert Mentors & Industry Professionals",
  description: "Meet the team behind KKHS Media's internship programs. Industry experts in Video Editing, Digital Marketing, Web Development & Graphic Design mentoring the next generation.",
  keywords: "KKHS Media team, internship mentors jaipur, industry experts, video editing trainer, digital marketing expert",
  openGraph: {
    title: "Our Team | KKHS Media Jaipur",
    description: "Meet the expert mentors behind KKHS Media's internship programs.",
    url: "https://internship.kkhsmedia.com/team",
  },
  alternates: {
    canonical: "/team",
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
