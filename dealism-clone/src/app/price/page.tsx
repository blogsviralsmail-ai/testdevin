import Link from "next/link";
import { Check } from "lucide-react";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const defaultPlans = [
    {
      id: "starter",
      name: "Starter",
      slug: "monthly_basic",
      priceMonthly: 19,
      priceAnnual: null,
      conversationsQuota: 1000,
      features: JSON.stringify([
        "1,000 Conversations / month",
        "Fast setup, unlimited agents",
        "Auto-built knowledge base",
        "Continuous learning",
        "Multilingual support",
        "Autoreply + copilot",
      ]),
      isPopular: false,
    },
    {
      id: "pro",
      name: "Pro",
      slug: "monthly_pro",
      priceMonthly: 39,
      priceAnnual: null,
      conversationsQuota: 2000,
      features: JSON.stringify([
        "2,000 Conversations / month",
        "Fast setup, unlimited agents",
        "Auto-built knowledge base",
        "Continuous learning",
        "Multilingual support",
        "Autoreply + copilot",
        "Priority support",
      ]),
      isPopular: true,
    },
    {
      id: "annual",
      name: "Pro Annual",
      slug: "annual",
      priceMonthly: 32,
      priceAnnual: 384,
      conversationsQuota: 2000,
      features: JSON.stringify([
        "2,000 Conversations / month",
        "All Pro features",
        "Billed annually — save 18%",
      ]),
      isPopular: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      slug: "enterprise",
      priceMonthly: 0,
      priceAnnual: null,
      conversationsQuota: 0,
      features: JSON.stringify([
        "Custom conversations quota",
        "Custom agents & knowledge base",
        "SLA & dedicated support",
        "Team / multi-brand seats",
      ]),
      isPopular: false,
    },
  ];

  const display = plans.length > 0 ? plans : defaultPlans;

  return (
    <>
      <LandingNav />
      <main className="container-1200 py-16">
        <h1 className="text-center text-4xl md:text-6xl font-bold">Free 7-day Trial</h1>
        <p className="mt-4 text-center text-xl text-neutral-600">Hire an AI-driven sales team.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {display.map((p) => {
            const features = JSON.parse(p.features) as string[];
            const isEnterprise = p.slug === "enterprise";
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border bg-white p-6 flex flex-col ${
                  p.isPopular ? "border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]" : "border-neutral-200"
                }`}
              >
                {p.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  {isEnterprise ? (
                    <span className="text-3xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${p.priceMonthly}</span>
                      <span className="text-neutral-500">/month</span>
                    </>
                  )}
                </div>
                {!isEnterprise && <p className="mt-1 text-sm text-neutral-500">Free 7-day Trial</p>}
                <ul className="mt-6 space-y-2 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={p.isPopular ? "primary" : "outline"}>
                  <Link href={isEnterprise ? "/#contact" : "/register"}>
                    {isEnterprise ? "Let's talk" : "Start Free Trial"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
