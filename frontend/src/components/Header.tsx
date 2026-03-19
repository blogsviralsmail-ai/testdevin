import { Link, useLocation } from "react-router-dom";
import { Menu, X, Crown } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "होम", labelEn: "Home" },
  { to: "/categories", label: "ज्वेलरी", labelEn: "Jewellery" },
  { to: "/gold-rate", label: "सोने का भाव", labelEn: "Gold Rate" },
  { to: "/blog", label: "ब्लॉग", labelEn: "Blog" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-200" />
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">आभूषण बाज़ार</h1>
              <p className="text-[10px] text-yellow-200 -mt-1">Aabhooshan Bazaar</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? "bg-yellow-800 text-yellow-100"
                    : "text-yellow-100 hover:bg-yellow-800/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-yellow-100 p-2"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <nav className="md:hidden pb-4 border-t border-yellow-600">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm font-medium ${
                  location.pathname === link.to
                    ? "bg-yellow-800 text-yellow-100"
                    : "text-yellow-100 hover:bg-yellow-800/50"
                }`}
              >
                {link.label} <span className="text-yellow-300 text-xs">({link.labelEn})</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
