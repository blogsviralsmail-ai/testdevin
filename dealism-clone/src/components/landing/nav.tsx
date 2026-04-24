"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
      <div className="container-1200 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">D</div>
          <span className="text-xl font-bold">Deal<span className="gradient-text-orange">ism</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">Products</Link>
          <Link href="/price" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">Pricing</Link>
          <Link href="/guides" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">Guide</Link>
          <Link href="/#industries" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">Industries</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">Sign in</Link>
          <Button asChild variant="dark" size="default">
            <Link href="/register">Get started</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="container-1200 flex flex-col gap-3 py-4">
            <Link href="/#features" onClick={() => setOpen(false)} className="text-sm font-medium py-2">Products</Link>
            <Link href="/price" onClick={() => setOpen(false)} className="text-sm font-medium py-2">Pricing</Link>
            <Link href="/guides" onClick={() => setOpen(false)} className="text-sm font-medium py-2">Guide</Link>
            <Link href="/#industries" onClick={() => setOpen(false)} className="text-sm font-medium py-2">Industries</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium py-2">Sign in</Link>
            <Button asChild variant="dark" size="default" className="w-full">
              <Link href="/register" onClick={() => setOpen(false)}>Get started</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
