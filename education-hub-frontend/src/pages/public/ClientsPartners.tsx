import { useState, useEffect } from "react";
import { Handshake, Building2, Globe, Award } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ClientsPartners() {
  const [universities, setUniversities] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data || [])).catch(() => {});
  }, []);

  const imgSrc = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return API + p; };

  const partners = [
    { name: "National Skill Development Corporation", type: "Government Partner", logo: "" },
    { name: "University Grants Commission (UGC)", type: "Regulatory Body", logo: "" },
    { name: "All India Council for Technical Education (AICTE)", type: "Regulatory Body", logo: "" },
    { name: "Distance Education Bureau (DEB)", type: "Regulatory Body", logo: "" },
    { name: "National Assessment and Accreditation Council (NAAC)", type: "Accreditation Body", logo: "" },
  ];

  return (
    <div>
      <SEO
        title="Our Partners - University & Institutional Partners"
        description="Trusted by leading universities and institutions across India. Education Hub partners with UGC recognized, NAAC accredited universities for quality education."
        keywords="university partners, education partners, UGC recognized, NAAC accredited, partner universities India, institutional partners"
        canonical="/clients"
      />
      <div className="bg-gradient-to-r from-amber-900 to-amber-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Our Clients & Partners</h1>
          <p className="text-lg text-amber-200 max-w-2xl mx-auto">Trusted by leading universities, institutions, and organizations across India</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: `${universities.length}+`, label: "University Partners", icon: Building2, color: "bg-blue-600" },
            { value: "750+", label: "Education Consultants", icon: Handshake, color: "bg-green-600" },
            { value: "50+", label: "Cities Covered", icon: Globe, color: "bg-purple-600" },
            { value: "10000+", label: "Students Enrolled", icon: Award, color: "bg-orange-600" },
          ].map((s, i) => (
            <div key={i} className={`${s.color} text-white rounded-xl p-5 text-center shadow-lg`}>
              <s.icon className="h-8 w-8 mx-auto mb-2 opacity-90" />
              <p className="text-2xl md:text-3xl font-bold">{s.value}</p>
              <p className="text-sm opacity-90">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* University Partners */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">University Partners</h2>
        <p className="text-center text-gray-600 mb-10">We partner with India's top universities to provide quality education</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {universities.map(u => (
            <div key={u.id} className="bg-white rounded-xl shadow-sm border p-5 text-center hover:shadow-lg transition-all group">
              {u.logo ? (
                <img src={imgSrc(u.logo)} alt={u.name} className="h-16 w-16 object-contain mx-auto mb-3 group-hover:scale-110 transition-transform" loading="lazy" decoding="async" />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600 font-bold text-xl">
                  {u.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h3 className="font-semibold text-sm text-gray-900">{u.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{u.code}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Partners */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">Institutional Partners</h2>
          <p className="text-center text-gray-600 mb-10">Recognized and supported by leading institutions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {partners.map((p, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-5 text-center hover:shadow-lg transition-all">
                <div className="h-14 w-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mx-auto mb-3 text-amber-600 font-bold text-sm">
                  {p.name.split(" ").map(w => w[0]).join("").substring(0, 3)}
                </div>
                <h3 className="font-semibold text-sm text-gray-900">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Want to Partner With Us?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">We're always looking for new partnerships to expand our reach and provide better services to students.</p>
        <a href="/contact" className="inline-block px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/25">Contact Us for Partnership</a>
      </div>
    </div>
  );
}
