import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, X, Menu as MenuIcon, Send } from "lucide-react";
import api from "../lib/api";

const API = import.meta.env.VITE_API_URL || "";

export default function PublicLayout() {
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [popupForm, setPopupForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [popupSent, setPopupSent] = useState(false);
  const [popupSettings, setPopupSettings] = useState({ enabled: true, delay: 30 });
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About Us" },
    { path: "/universities", label: "Universities" },
    { path: "/courses", label: "Courses" },
    { path: "/services", label: "Services" },
    { path: "/team", label: "Team" },
    { path: "/blog", label: "Blog" },
    { path: "/gallery", label: "Gallery" },
    { path: "/careers", label: "Careers" },
    { path: "/clients", label: "Partners" },
    { path: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    api.get("/api/settings").then((r) => {
      const s = r.data || {};
      setSiteSettings(s);
      setPopupSettings({
        enabled: s.popup_enabled !== "false",
        delay: s.popup_delay ? parseInt(s.popup_delay) : 30,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!popupSettings.enabled || popupDismissed) return;
    const dismissed = sessionStorage.getItem("popup_dismissed");
    if (dismissed) { setPopupDismissed(true); return; }
    const timer = setTimeout(() => { setShowPopup(true); }, popupSettings.delay * 1000);
    return () => clearTimeout(timer);
  }, [popupSettings, popupDismissed]);

  const handlePopupSubmit = async () => {
    if (!popupForm.name || !popupForm.phone) return;
    try {
      await api.post("/api/enquiries", { name: popupForm.name, phone: popupForm.phone || null, email: popupForm.email || null, message: popupForm.message || null, source: "popup" });
      setPopupSent(true);
      setTimeout(() => { setShowPopup(false); setPopupDismissed(true); sessionStorage.setItem("popup_dismissed", "1"); }, 2000);
    } catch { /* empty */ }
  };

  const dismissPopup = () => {
    setShowPopup(false); setPopupDismissed(true);
    sessionStorage.setItem("popup_dismissed", "1");
  };

  useEffect(() => { setMobileMenu(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full max-w-[100vw]">
      {/* Top Bar */}
      <div className="bg-blue-900 text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{siteSettings.company_phone || siteSettings.phone || "+91-9876543210"}</span></span>
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> <span className="text-xs truncate max-w-[140px] sm:max-w-none sm:text-sm">{siteSettings.company_email || siteSettings.email || "info@asffeducationhub.com"}</span></span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/login" className="hover:text-blue-300">Login</Link>
            <span>|</span>
            <Link to="/register" className="hover:text-blue-300">Register</Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <header className="bg-slate-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 p-0.5">
              <img src={siteSettings.navbar_logo_url ? (siteSettings.navbar_logo_url.startsWith("/") ? API + siteSettings.navbar_logo_url : siteSettings.navbar_logo_url) : (siteSettings.logo_url ? (siteSettings.logo_url.startsWith("/") ? API + siteSettings.logo_url : siteSettings.logo_url) : "/logo.png")} alt={siteSettings.site_name || "A Step For Future - Education Hub"} className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-xs sm:text-sm lg:text-base font-extrabold text-white leading-tight">{(siteSettings.site_name || "A Step For Future").split(" - ")[0]}</span>
              <span className="text-blue-300 text-[10px] sm:text-[11px] lg:text-xs font-semibold">{(siteSettings.site_name || "Education Hub").split(" - ")[1] || "Education Hub"}</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-3d px-2.5 xl:px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-blue-600 text-white nav-3d-active"
                    : "text-gray-200 hover:bg-slate-700 hover:text-white nav-3d-inactive"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/enquiry"
              className="btn-3d btn-3d-yellow btn-flash bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hidden md:block">
              Apply Now
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden text-white hover:text-gray-200 p-2">
              {mobileMenu ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-slate-700 border-t border-slate-600 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-slate-600"}`}>
                {item.label}
              </Link>
            ))}
            <Link to="/enquiry" className="block w-full text-center px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 rounded-xl text-sm font-bold mt-2">Apply Now</Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Enquiry Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={dismissPopup}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 animate-fade-in-up relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={dismissPopup} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            {popupSent ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Send className="h-8 w-8 text-green-600" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-500">We&apos;ll contact you soon.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <img src={siteSettings.logo_url ? (siteSettings.logo_url.startsWith("/") ? API + siteSettings.logo_url : siteSettings.logo_url) : "/logo.png"} alt={siteSettings.site_name || "A Step For Future - Education Hub"} className="h-10 w-auto mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-gray-900">Get Free Counseling!</h3>
                  <p className="text-sm text-gray-500">Fill in your details and our team will reach out to you</p>
                </div>
                <div className="space-y-3">
                  <input value={popupForm.name} onChange={(e) => setPopupForm({ ...popupForm, name: e.target.value })} placeholder="Your Name *" className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <input value={popupForm.phone} onChange={(e) => setPopupForm({ ...popupForm, phone: e.target.value })} placeholder="Phone Number *" className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <input value={popupForm.email} onChange={(e) => setPopupForm({ ...popupForm, email: e.target.value })} placeholder="Email (optional)" type="email" className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <textarea value={popupForm.message} onChange={(e) => setPopupForm({ ...popupForm, message: e.target.value })} placeholder="Which course are you interested in?" rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <button onClick={handlePopupSubmit} className="btn-3d btn-3d-blue w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Get Free Counseling
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">We respect your privacy. No spam.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <a href={`https://wa.me/${(siteSettings.whatsapp_number || siteSettings.whatsapp || "+91-9999999999").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-[#128C7E] z-40 transition-colors">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 sm:h-6 sm:w-6">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-white p-1.5">
                  <img src={siteSettings.footer_logo_url ? (siteSettings.footer_logo_url.startsWith("/") ? API + siteSettings.footer_logo_url : siteSettings.footer_logo_url) : (siteSettings.logo_url ? (siteSettings.logo_url.startsWith("/") ? API + siteSettings.logo_url : siteSettings.logo_url) : "/logo.png")} alt={siteSettings.site_name || "A Step For Future - Education Hub"} className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-bold text-white block">{siteSettings.site_name || "A Step For Future - Education Hub"}</span>
                <span className="text-xs text-gray-400">{siteSettings.site_tagline || "India's Trusted Education Partner"}</span>
              </div>
            </div>
            <p className="text-sm">{siteSettings.footer_description || "Your trusted partner for higher education admissions across multiple universities."}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{siteSettings.footer_col2_title || "Quick Links"}</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <li><Link to="/universities" className="hover:text-white">Universities</Link></li>
              <li><Link to="/courses" className="hover:text-white">Courses</Link></li>
              <li><Link to="/services" className="hover:text-white">Services</Link></li>
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
              <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link to="/clients" className="hover:text-white">Partners</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/enquiry" className="hover:text-white">Enquiry</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{siteSettings.footer_col3_title || "Contact Info"}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" /> {siteSettings.company_address || "Jaipur, Rajasthan, India"}</li>
              <li className="flex flex-wrap items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0" /> {siteSettings.company_phone || siteSettings.phone || "+91-9876543210"}</li>
              <li className="flex flex-wrap items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0" /> {siteSettings.company_email || siteSettings.email || "info@asffeducationhub.com"}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{siteSettings.footer_col4_title || "Follow Us"}</h3>
            <div className="flex flex-wrap items-center gap-3">
              <a href={siteSettings.facebook_url || siteSettings.facebook || "https://www.facebook.com/profile.php?id=61584867286340"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600"><Facebook className="h-5 w-5" /></a>
              <a href={siteSettings.instagram_url || siteSettings.instagram || "https://www.instagram.com/asffeducationhub/?hl=en"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-600"><Instagram className="h-5 w-5" /></a>
              <a href={siteSettings.linkedin_url || siteSettings.linkedin || "https://www.linkedin.com/in/asff-educationhub-5536943b5/"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-700"><Linkedin className="h-5 w-5" /></a>
              <a href={siteSettings.twitter_url || siteSettings.twitter || "https://x.com/AsffeduHub"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-gray-700"><svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 text-center text-xs sm:text-sm space-y-1">
          <p>{siteSettings.footer_copyright || `\u00A9 ${new Date().getFullYear()} ${siteSettings.site_name || "A Step For Future - Education Hub"}. All rights reserved.`}</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms-conditions" className="hover:text-white">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
