import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, MessageCircle, X, Menu as MenuIcon, Send } from "lucide-react";
import api from "../lib/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    { path: "/universities", label: "Universities" },
    { path: "/courses", label: "Courses" },
    { path: "/services", label: "Services" },
    { path: "/about", label: "About Us" },
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
          <div className="flex items-center gap-3">
            <Link to="/login" className="hover:text-blue-300">Login</Link>
            <span>|</span>
            <Link to="/register" className="hover:text-blue-300">Register</Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-white p-0.5">
              <img src={siteSettings.navbar_logo_url ? (siteSettings.navbar_logo_url.startsWith("/") ? API + siteSettings.navbar_logo_url : siteSettings.navbar_logo_url) : (siteSettings.logo_url ? (siteSettings.logo_url.startsWith("/") ? API + siteSettings.logo_url : siteSettings.logo_url) : "/logo.png")} alt={siteSettings.site_name || "A Step For Future - Education Hub"} className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-xs sm:text-sm lg:text-base font-extrabold text-gray-900 leading-tight">{(siteSettings.site_name || "A Step For Future").split(" - ")[0]}</span>
              <span className="text-blue-600 text-[10px] sm:text-[11px] lg:text-xs font-semibold">{(siteSettings.site_name || "Education Hub").split(" - ")[1] || "Education Hub"}</span>
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
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 nav-3d-inactive"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/enquiry"
              className="btn-3d btn-3d-yellow btn-flash bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hidden md:block">
              Apply Now
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden text-gray-600 hover:text-gray-900 p-2">
              {mobileMenu ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"}`}>
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
        className="fixed bottom-6 right-6 bg-green-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-green-600 z-40">
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 p-1">
                <img src={siteSettings.footer_logo_url ? (siteSettings.footer_logo_url.startsWith("/") ? API + siteSettings.footer_logo_url : siteSettings.footer_logo_url) : (siteSettings.logo_url ? (siteSettings.logo_url.startsWith("/") ? API + siteSettings.logo_url : siteSettings.logo_url) : "/logo.png")} alt={siteSettings.site_name || "A Step For Future - Education Hub"} className="h-full w-full object-contain brightness-0 invert" />
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
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0" /> {siteSettings.company_phone || siteSettings.phone || "+91-9876543210"}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0" /> {siteSettings.company_email || siteSettings.email || "info@asffeducationhub.com"}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">{siteSettings.footer_col4_title || "Follow Us"}</h3>
            <div className="flex items-center gap-3">
              <a href={siteSettings.facebook_url || siteSettings.facebook || "https://facebook.com/asffeducationhub"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600"><Facebook className="h-5 w-5" /></a>
              <a href={siteSettings.instagram_url || siteSettings.instagram || "https://instagram.com/asffeducationhub"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-600"><Instagram className="h-5 w-5" /></a>
              <a href={siteSettings.linkedin_url || siteSettings.linkedin || "https://linkedin.com/company/asffeducationhub"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-700"><Linkedin className="h-5 w-5" /></a>
              <a href={siteSettings.youtube_url || siteSettings.youtube || "https://youtube.com/asffeducationhub"} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600"><Youtube className="h-5 w-5" /></a>
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
