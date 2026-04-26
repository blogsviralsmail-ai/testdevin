import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingBeyondStack } from "@/components/landing/beyond-stack";
import { LandingWhereItWorks } from "@/components/landing/where-it-works";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { LandingFAQ } from "@/components/landing/faq";
import { LandingCTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingBeyondStack />
        <LandingWhereItWorks />
        <LandingTestimonials />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </>
  );
}
