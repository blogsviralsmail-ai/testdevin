"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingCTA() {
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 p-10 md:p-16 text-center text-white">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-yellow-300/20 blur-3xl" />
          <h2 className="relative text-4xl md:text-5xl font-bold">Turn Conversations Into Revenue</h2>
          <p className="relative mt-4 max-w-xl mx-auto text-white/90">
            Scale your sales with an AI expert who engages leads and closes deals effectively.
          </p>
          <Button asChild size="lg" variant="dark" className="relative mt-8">
            <Link href="/register">Start 7-Day Free Trial</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
