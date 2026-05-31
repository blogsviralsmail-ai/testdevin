"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const solutions = [
  { name: "Lead Generation", href: "/solutions/lead-generation" },
  { name: "Appointment Booking", href: "/solutions/appointments" },
  { name: "Customer Support", href: "/solutions/support" },
  { name: "Collections", href: "/solutions/collections" },
  { name: "Negotiation", href: "/solutions/negotiation" },
];

const resources = [
  { name: "Documentation", href: "/docs" },
  { name: "Integrations", href: "/integrations" },
  { name: "Releases", href: "/releases" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#00d4aa]">VOICE</span>
            <span className="text-2xl font-bold text-white">AI</span>
            <span className="ml-1 text-xs font-medium text-[#00d4aa] uppercase tracking-wider">Pro</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => { setSolOpen(!solOpen); setResOpen(false); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Solutions <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {solOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-white/10 bg-[#1a1f2e] p-2 shadow-xl">
                {solutions.map((s) => (
                  <Link
                    key={s.name}
                    href={s.href}
                    className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setSolOpen(false)}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/pricing" className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>

          <div className="relative">
            <button
              onClick={() => { setResOpen(!resOpen); setSolOpen(false); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Resources <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {resOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-white/10 bg-[#1a1f2e] p-2 shadow-xl">
                {resources.map((r) => (
                  <Link
                    key={r.name}
                    href={r.href}
                    className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setResOpen(false)}
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/whitelabel" className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            White Label
          </Link>

          <Link href="/contact" className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            Contact Us
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894] font-medium">
              Try for free
            </Button>
          </Link>
        </div>

        <button
          className="lg:hidden text-gray-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0a0f1a] px-4 py-4 space-y-2">
          <Link href="/" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Home</Link>
          <div className="py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Solutions</div>
          {solutions.map((s) => (
            <Link key={s.name} href={s.href} className="block py-1.5 pl-3 text-sm text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>
              {s.name}
            </Link>
          ))}
          <Link href="/pricing" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link href="/integrations" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Integrations</Link>
          <Link href="/whitelabel" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>White Label</Link>
          <Link href="/contact" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Contact Us</Link>
          <div className="flex gap-2 pt-4 border-t border-white/10">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full border-white/20 text-gray-300">Login</Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full bg-[#00d4aa] text-black hover:bg-[#00b894]">Try for free</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
