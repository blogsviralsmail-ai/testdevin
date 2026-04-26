import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-neutral-950 text-neutral-400 py-16">
      <div className="container-1200">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 font-bold">D</div>
              <span className="text-xl font-bold">Dealism</span>
            </Link>
            <p className="mt-4 text-sm">AI Sales Assistant that talks like you.</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#features">Sales AI Agent</Link></li>
              <li><Link href="/#features">Sales Strategy</Link></li>
              <li><Link href="/#features">Self Learning</Link></li>
              <li><Link href="/#features">Auto Reply Agent</Link></li>
              <li><Link href="/#features">No-Code Agent Builder</Link></li>
              <li><Link href="/#features">WhatsApp AI Assistant</Link></li>
              <li><Link href="/#features">Instagram Messenger</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/price">Pricing</Link></li>
              <li><Link href="/guides">Guide</Link></li>
              <li><Link href="/#about">About us</Link></li>
              <li><Link href="/#faq">FAQ</Link></li>
              <li><Link href="/#testimonials">User Stories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/privacy">Privacy Policy</Link></li>
              <li><Link href="/legal/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 text-sm text-center">
          © {new Date().getFullYear()} Dealism Clone. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
