import Link from "next/link";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";

const guides = [
  { slug: "getting-started", title: "Getting started with Dealism", excerpt: "Set up your first AI sales agent in 5 minutes." },
  { slug: "connect-whatsapp", title: "How to connect WhatsApp", excerpt: "Step-by-step QR scan to link your number." },
  { slug: "knowledge-base", title: "Building your knowledge base", excerpt: "Teach your agent everything about your business." },
  { slug: "tone-and-voice", title: "Matching your tone & voice", excerpt: "Customize how your agent sounds." },
  { slug: "multi-channel", title: "Multi-channel strategy", excerpt: "WhatsApp + Instagram + Web chat together." },
  { slug: "analytics", title: "Using analytics", excerpt: "Track conversions and improve over time." },
];

export default function GuidesPage() {
  return (
    <>
      <LandingNav />
      <main className="container-1200 py-16">
        <h1 className="text-4xl md:text-5xl font-bold">Guide</h1>
        <p className="mt-4 text-neutral-600">Everything you need to get the most out of Dealism.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href="#"
              className="rounded-2xl border border-neutral-200 p-6 hover-lift bg-white"
            >
              <h3 className="text-lg font-semibold">{g.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{g.excerpt}</p>
              <span className="mt-4 inline-block text-sm font-medium text-orange-500">Read →</span>
            </Link>
          ))}
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
