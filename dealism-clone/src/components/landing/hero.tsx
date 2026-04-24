import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-orange-100/80 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="container-1200 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance fade-in-up">
          Your <span className="gradient-text-orange">Best Sales</span> Rep,
          <br />
          Now <span className="gradient-text-orange">AI</span>.
        </h1>

        <p className="mt-6 text-xl md:text-2xl font-semibold text-neutral-800 fade-in-up">
          More Leads, More Agenda, More Deals.
        </p>

        <p className="mt-4 max-w-2xl mx-auto text-neutral-600 fade-in-up">
          Set it up by chatting. It learns your business and how you sell, then works 24/7 to follow up and move every lead toward a deal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 fade-in-up">
          <Button asChild size="lg" variant="primary" className="glow-orange">
            <Link href="/register">Start 7-Day Free Trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/#features">See how it works</Link>
          </Button>
        </div>

        <div className="mt-14 relative max-w-4xl mx-auto fade-in-up">
          <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-orange-50 via-white to-pink-50 p-6 shadow-2xl">
            <div className="grid gap-4 md:grid-cols-2">
              <ChatBubble role="user" name="Sarah" text="Hi, do you have this in size M?" />
              <ChatBubble role="agent" name="Dealism" text="Yes! Size M is in stock. Shall I add it to your cart?" />
              <ChatBubble role="user" name="Sarah" text="How long does shipping take?" />
              <ChatBubble role="agent" name="Dealism" text="2-3 business days free shipping. Want me to apply a 10% first-order discount?" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ role, name, text }: { role: "user" | "agent"; name: string; text: string }) {
  const isAgent = role === "agent";
  return (
    <div className={`flex gap-3 ${isAgent ? "justify-end" : ""}`}>
      {!isAgent && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold">
          {name[0]}
        </div>
      )}
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-sm text-sm ${
          isAgent
            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
            : "bg-white text-neutral-900 border border-neutral-200"
        }`}
      >
        <div className={`text-xs font-semibold mb-0.5 ${isAgent ? "text-white/80" : "text-neutral-500"}`}>{name}</div>
        {text}
      </div>
      {isAgent && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-semibold text-white">
          D
        </div>
      )}
    </div>
  );
}
