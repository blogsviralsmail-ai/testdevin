import Link from "next/link";

const footerLinks = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Integrations", href: "/integrations" },
    { name: "White Label", href: "/whitelabel" },
  ],
  Solutions: [
    { name: "Lead Generation", href: "/solutions/lead-generation" },
    { name: "Appointments", href: "/solutions/appointments" },
    { name: "Customer Support", href: "/solutions/support" },
    { name: "Collections", href: "/solutions/collections" },
  ],
  Resources: [
    { name: "Documentation", href: "/docs" },
    { name: "API Reference", href: "/docs/api" },
    { name: "Releases", href: "/releases" },
    { name: "Book a Demo", href: "/book-demo" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Use", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0f1a]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#00d4aa]">VOICE</span>
              <span className="text-2xl font-bold text-white">AI</span>
              <span className="ml-1 text-xs font-medium text-[#00d4aa] uppercase tracking-wider">Pro</span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 max-w-xs">
              Build, test, and deploy voice AI assistants that handle calls, book appointments, and drive results.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white">{category}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-[#00d4aa] transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} VoiceAI Pro. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300">Privacy</Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
