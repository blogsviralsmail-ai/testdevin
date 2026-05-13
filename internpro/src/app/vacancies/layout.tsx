import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Internship Openings 2026 | KKHS Media - Video Editing, Digital Marketing, Web Development",
  description: "Apply for paid internship programs at KKHS Media, Jaipur. Openings in Video Editing, Digital Marketing, Web Development, Graphic Design. Certificate + Stipend. Limited seats!",
  keywords: "internship openings 2026, paid internship jaipur, video editing internship, digital marketing internship, web development internship, KKHS Media internship, internship with certificate",
  openGraph: {
    title: "Internship Openings 2026 | KKHS Media Jaipur",
    description: "Apply for paid internship programs at KKHS Media. Video Editing, Digital Marketing, Web Development & more. Certificate + Stipend included.",
    url: "https://internship.kkhsmedia.com/vacancies",
    siteName: "KKHS Media",
    type: "website",
  },
  alternates: {
    canonical: "https://internship.kkhsmedia.com/vacancies",
  },
};

const programDescriptions: Record<string, string> = {
  "Web Development": "Learn full-stack web development with React.js, Node.js, HTML5, CSS3, JavaScript, MongoDB, and modern frameworks. Build real client projects, deploy live websites, and gain hands-on experience with version control (Git), REST APIs, and responsive design. This internship includes mentorship from industry professionals, daily coding tasks, and a UGC-compliant certificate upon completion.",
  "Human Resource": "Gain practical HR experience including recruitment, onboarding, employee engagement, payroll basics, and HR analytics. Learn to use HRMS tools, conduct interviews, draft HR policies, and manage employee relations. Includes mentorship, real case studies, and industry-recognized certification.",
  "Social Media Marketing": "Master social media strategy across Instagram, Facebook, LinkedIn, YouTube, and Twitter/X. Learn content planning, community management, paid advertising, influencer marketing, and analytics. Create real campaigns for live brands with measurable KPIs. Certificate included.",
  "Video Editing": "Learn professional video editing using Adobe Premiere Pro, After Effects, DaVinci Resolve, and CapCut. Master color grading, motion graphics, sound design, transitions, and YouTube/Instagram Reels optimization. Edit real client videos and build a portfolio.",
  "SEO": "Learn Search Engine Optimization including keyword research, on-page SEO, technical SEO, link building, Google Analytics, Search Console, and content optimization. Work on live websites to improve rankings. Includes tools training (Ahrefs, SEMrush) and certification.",
  "Graphic Design": "Master graphic design using Adobe Photoshop, Illustrator, Canva, and Figma. Learn branding, logo design, social media creatives, poster design, UI/UX fundamentals, and print design. Create a professional portfolio with real client projects.",
  "Cyber Security": "Learn cybersecurity fundamentals including ethical hacking, penetration testing, network security, cryptography, vulnerability assessment, and security auditing. Hands-on labs with Kali Linux, Wireshark, and Metasploit. Industry certification included.",
  "App Development": "Build mobile applications for Android and iOS using React Native, Flutter, or native development. Learn UI/UX for mobile, API integration, state management, app deployment to Play Store/App Store, and push notifications. Real project experience included.",
  "UI/UX Design": "Learn user interface and user experience design using Figma, Adobe XD, and Sketch. Master wireframing, prototyping, user research, usability testing, design systems, and interaction design. Build a UX portfolio with real projects.",
  "Content Writing": "Develop professional writing skills including SEO content writing, blog writing, copywriting, technical writing, and social media content creation. Learn content strategy, keyword integration, and editorial workflows. Write for real clients and build a published portfolio.",
  "AI & Machine Learning": "Explore artificial intelligence and machine learning with Python, TensorFlow, and scikit-learn. Learn data preprocessing, model training, neural networks, NLP, computer vision, and AI deployment. Work on real AI projects with mentorship from experts.",
  "Digital Marketing": "Comprehensive digital marketing training covering SEO, Google Ads (PPC), Facebook/Instagram Ads, email marketing, content marketing, marketing automation, and analytics. Create and manage real campaigns with measurable ROI. Google certification preparation included.",
  "Sales and Marketing": "Learn sales techniques, lead generation, CRM management, negotiation skills, market research, and marketing strategy. Gain experience with sales funnels, cold outreach, customer retention, and performance marketing. Real client interaction experience included.",
};

export default async function VacanciesLayout({ children }: { children: React.ReactNode }) {
  let programs: Array<{
    id: string;
    title: string;
    domain: string;
    mode: string;
    duration: number;
    feeType: string;
    feeAmount: number | null;
    stipendAmount: number | null;
    maxSeats: number;
    description: string | null;
    createdAt: Date;
  }> = [];

  try {
    programs = await prisma.program.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        domain: true,
        mode: true,
        duration: true,
        feeType: true,
        feeAmount: true,
        stipendAmount: true,
        maxSeats: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // fallback if DB is unavailable during build
  }

  const today = new Date().toISOString().split("T")[0];
  const validThrough = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const jobPostings = programs.map((p) => {
    const desc = programDescriptions[p.title] || p.description || `${p.title} internship program at KKHS Media, Jaipur. Duration: ${p.duration} days. Includes certificate, mentorship, and hands-on project experience.`;
    const modes = p.mode.split(",").map((m: string) => m.trim().toLowerCase());
    const isRemote = modes.includes("online");
    const isOffice = modes.includes("offline");

    const posting: Record<string, unknown> = {
      "@type": "JobPosting",
      "title": `${p.title} Intern`,
      "description": `<p><strong>${p.title} Internship at KKHS Media, Jaipur</strong></p><p>${desc}</p><p><strong>Duration:</strong> ${p.duration} days</p><p><strong>Mode:</strong> ${p.mode}</p><p><strong>What You Get:</strong></p><ul><li>Offer Letter on Day 1</li><li>UGC-Compliant Certificate</li><li>Experience Letter &amp; Letter of Recommendation</li><li>Real Project Experience</li><li>Expert Mentorship</li>${p.stipendAmount && p.stipendAmount > 0 ? `<li>Performance-based Stipend up to ₹${p.stipendAmount}</li>` : "<li>Performance-based Stipend</li>"}</ul><p><strong>How to Apply:</strong> Register at https://internship.kkhsmedia.com/register and select ${p.title}.</p>`,
      "identifier": {
        "@type": "PropertyValue",
        "name": "KKHS Media",
        "value": `KKHS-INTERN-${p.id.slice(-6).toUpperCase()}`
      },
      "datePosted": p.createdAt.toISOString().split("T")[0],
      "validThrough": validThrough + "T23:59",
      "employmentType": "INTERN",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "KKHS Media Private Limited",
        "sameAs": "https://kkhsmedia.com",
        "logo": "https://internship.kkhsmedia.com/logo-kkhs.png",
        "url": "https://kkhsmedia.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "190A Krishna Kunj, Kalwar Road",
          "addressLocality": "Jaipur",
          "addressRegion": "Rajasthan",
          "postalCode": "302012",
          "addressCountry": "IN"
        }
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "190A Krishna Kunj, Kalwar Road",
          "addressLocality": "Jaipur",
          "addressRegion": "Rajasthan",
          "postalCode": "302012",
          "addressCountry": "IN"
        }
      },
      "directApply": true,
      "industry": p.domain,
      "qualifications": "Students, graduates, and freshers looking to gain industry experience",
      "responsibilities": `Complete daily tasks, attend mentorship sessions, work on real ${p.title} projects, submit assignments`,
      "skills": p.title,
      "educationRequirements": {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "bachelor degree"
      },
      "experienceRequirements": {
        "@type": "OccupationalExperienceRequirements",
        "monthsOfExperience": 0
      },
    };

    if (isRemote) {
      posting["jobLocationType"] = "TELECOMMUTE";
      posting["applicantLocationRequirements"] = {
        "@type": "Country",
        "name": "India"
      };
    }

    if (p.feeType === "free") {
      posting["baseSalary"] = {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "value": 0,
          "minValue": 0,
          "maxValue": 10000,
          "unitText": "MONTH"
        }
      };
    }

    return posting;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": jobPostings
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div itemScope itemType="https://schema.org/ItemList">
        <meta itemProp="name" content="Internship Openings at KKHS Media" />
        <meta itemProp="description" content="Paid internship programs in Video Editing, Digital Marketing, Web Development, Graphic Design at KKHS Media, Jaipur." />
      </div>
      {children}
    </>
  );
}
