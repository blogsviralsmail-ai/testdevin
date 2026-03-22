import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import { Search, GraduationCap, Clock, Loader2, Filter, FlaskConical, Code, Building2, Library, Calculator, BookOpen, Shield, Zap, Stethoscope, Palette, Hotel, Plane, Wheat, Pill, Heart, Briefcase, Scale, Cpu, Music, Pen, ChevronRight, ArrowLeft } from "lucide-react";

const courseTypeConfig: Record<string, { gradient: string; icon: string; fullName: string; shortDesc: string }> = {
  "B.Tech": { gradient: "from-violet-600 to-purple-800", icon: "code", fullName: "Bachelor of Technology", shortDesc: "Engineering & Technology" },
  "M.Tech": { gradient: "from-indigo-600 to-blue-800", icon: "cpu", fullName: "Master of Technology", shortDesc: "Advanced Engineering" },
  "MBA": { gradient: "from-slate-700 to-gray-900", icon: "briefcase", fullName: "Master of Business Administration", shortDesc: "Business & Management" },
  "BBA": { gradient: "from-blue-600 to-indigo-800", icon: "building", fullName: "Bachelor of Business Administration", shortDesc: "Business Studies" },
  "BCA": { gradient: "from-green-600 to-emerald-800", icon: "code", fullName: "Bachelor of Computer Applications", shortDesc: "Computer Applications" },
  "MCA": { gradient: "from-blue-700 to-violet-800", icon: "cpu", fullName: "Master of Computer Applications", shortDesc: "Advanced Computing" },
  "B.Com": { gradient: "from-amber-600 to-orange-800", icon: "calculator", fullName: "Bachelor of Commerce", shortDesc: "Commerce & Accounting" },
  "M.Com": { gradient: "from-yellow-600 to-amber-800", icon: "calculator", fullName: "Master of Commerce", shortDesc: "Advanced Commerce" },
  "BA": { gradient: "from-pink-600 to-rose-800", icon: "book", fullName: "Bachelor of Arts", shortDesc: "Arts & Humanities" },
  "MA": { gradient: "from-fuchsia-600 to-purple-800", icon: "pen", fullName: "Master of Arts", shortDesc: "Advanced Arts" },
  "B.Sc": { gradient: "from-cyan-600 to-blue-800", icon: "flask", fullName: "Bachelor of Science", shortDesc: "Science & Research" },
  "M.Sc": { gradient: "from-teal-600 to-green-800", icon: "flask", fullName: "Master of Science", shortDesc: "Advanced Science" },
  "LLB": { gradient: "from-gray-700 to-slate-900", icon: "scale", fullName: "Bachelor of Laws", shortDesc: "Law & Legal Studies" },
  "B.Ed": { gradient: "from-amber-500 to-yellow-700", icon: "book", fullName: "Bachelor of Education", shortDesc: "Teaching & Education" },
  "B.Pharm": { gradient: "from-green-700 to-teal-800", icon: "pill", fullName: "Bachelor of Pharmacy", shortDesc: "Pharmacy & Medicine" },
  "D.Pharm": { gradient: "from-emerald-700 to-green-900", icon: "pill", fullName: "Diploma in Pharmacy", shortDesc: "Pharmacy Diploma" },
  "B.Des": { gradient: "from-rose-500 to-pink-700", icon: "palette", fullName: "Bachelor of Design", shortDesc: "Design & Creativity" },
  "BA LLB": { gradient: "from-gray-600 to-slate-800", icon: "scale", fullName: "Integrated Law Program", shortDesc: "Law & Legal Studies" },
  "PGDM": { gradient: "from-gray-600 to-slate-700", icon: "briefcase", fullName: "PG Diploma in Management", shortDesc: "Management Diploma" },
};

function CourseIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case "calculator": return <Calculator className={className} />;
    case "library": return <Library className={className} />;
    case "flask": return <FlaskConical className={className} />;
    case "code": return <Code className={className} />;
    case "building": return <Building2 className={className} />;
    case "shield": return <Shield className={className} />;
    case "book": return <BookOpen className={className} />;
    case "zap": return <Zap className={className} />;
    case "stethoscope": return <Stethoscope className={className} />;
    case "palette": return <Palette className={className} />;
    case "hotel": return <Hotel className={className} />;
    case "plane": return <Plane className={className} />;
    case "wheat": return <Wheat className={className} />;
    case "pill": return <Pill className={className} />;
    case "heart": return <Heart className={className} />;
    case "briefcase": return <Briefcase className={className} />;
    case "scale": return <Scale className={className} />;
    case "cpu": return <Cpu className={className} />;
    case "music": return <Music className={className} />;
    case "pen": return <Pen className={className} />;
    default: return <GraduationCap className={className} />;
  }
}

interface Category {
  id: number; name: string; slug: string; description: string;
  mode: string; duration: string; fee: string; eligibility: string;
  university_name: string; university_id: number;
}

function getBaseType(name: string): string {
  const match = name.match(/^(BA LLB|B\.Tech|M\.Tech|MBA|BBA|BCA|MCA|B\.Com|M\.Com|BA|MA|B\.Sc|M\.Sc|LLB|LLM|B\.Pharma?|D\.Pharma?|M\.Pharma?|B\.Des|M\.Des|B\.Ed|M\.Ed|PGDM)/i);
  if (match) {
    let type = match[1];
    if (type.toLowerCase() === "b.pharma") type = "B.Pharm";
    if (type.toLowerCase() === "d.pharma") type = "D.Pharm";
    if (type.toLowerCase() === "m.pharma") type = "M.Pharm";
    return type;
  }
  return name;
}

function getTypeConfig(type: string) {
  return courseTypeConfig[type] || { gradient: "from-blue-600 to-indigo-800", icon: "graduation", fullName: type, shortDesc: "Professional Course" };
}

interface CourseGroup {
  type: string;
  courses: Category[];
  universities: Set<string>;
  specializations: Set<string>;
  modes: Set<string>;
}

export default function Courses() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const selectedCourse = searchParams.get("course") || "";
  const viewMode = searchParams.get("view") || "";

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  const courseGroups = useMemo(() => {
    const groups = new Map<string, CourseGroup>();
    categories.forEach((cat) => {
      const baseType = getBaseType(cat.name);
      if (!groups.has(baseType)) {
        groups.set(baseType, { type: baseType, courses: [], universities: new Set(), specializations: new Set(), modes: new Set() });
      }
      const group = groups.get(baseType)!;
      group.courses.push(cat);
      if (cat.university_name) group.universities.add(cat.university_name);
      group.specializations.add(cat.name);
      if (cat.mode) group.modes.add(cat.mode);
    });
    return Array.from(groups.values()).sort((a, b) => b.courses.length - a.courses.length);
  }, [categories]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  // DETAIL VIEW
  if (selectedCourse && viewMode === "detail") {
    const group = courseGroups.find(g => g.type === selectedCourse);
    if (!group) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <Link to="/courses" className="text-blue-600 hover:text-blue-800 font-medium">&larr; Back to Courses</Link>
        </div>
      );
    }
    const config = getTypeConfig(group.type);
    const byUniversity = new Map<string, Category[]>();
    group.courses.forEach(c => {
      const uniName = c.university_name;
      if (!uniName) return; // Skip courses without university
      if (!byUniversity.has(uniName)) byUniversity.set(uniName, []);
      byUniversity.get(uniName)!.push(c);
    });
    const uniEntries = Array.from(byUniversity.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return (
      <div>
        <SEO title={`${group.type} - ${config.fullName} Courses`} description={`Explore ${group.type} courses from ${group.universities.size}+ universities.`} canonical={`/courses?course=${encodeURIComponent(group.type)}&view=detail`} />
        <section className={`relative py-16 overflow-hidden bg-gradient-to-br ${config.gradient}`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 border-4 border-white rounded-full" />
            <div className="absolute bottom-10 left-10 w-24 h-24 border-4 border-white rounded-full" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4">
            <Link to="/courses" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to All Courses
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CourseIcon type={config.icon} className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white">{group.type}</h1>
                <p className="text-white/80 text-lg">{config.fullName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-white/80" />
                <span className="text-white font-semibold">{group.universities.size} Universities</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-white/80" />
                <span className="text-white font-semibold">{group.courses.length} Programs</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-white/80" />
                <span className="text-white font-semibold">{group.specializations.size} Specializations</span>
              </div>
            </div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Universities Offering {group.type}</h2>
          <div className="space-y-6">
            {uniEntries.map(([uniName, courses]) => (
              <div key={uniName} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{uniName}</h3>
                      <p className="text-xs text-gray-500">{courses.length} {group.type} program{courses.length > 1 ? "s" : ""} available</p>
                    </div>
                  </div>
                  <Link to={`/enquiry?university_id=${courses[0]?.university_id || ""}`} className="btn-3d btn-3d-yellow px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-xl text-sm hidden sm:block">Apply Now</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {courses.map((course) => (
                    <Link key={course.id} to={`/courses/${course.slug}`} className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">{course.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${course.mode === "Regular" ? "bg-green-50 text-green-700" : course.mode === "Online" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"}`}>{course.mode}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                          <span className="text-xs font-bold text-gray-700">{course.fee?.split("|")[0]?.trim()}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 sm:hidden">
                  <Link to={`/enquiry?university_id=${courses[0]?.university_id || ""}`} className="block text-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-xl text-sm">Apply Now</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW
  const filtered = search
    ? courseGroups.filter(g =>
        g.type.toLowerCase().includes(search.toLowerCase()) ||
        getTypeConfig(g.type).fullName.toLowerCase().includes(search.toLowerCase()) ||
        [...g.specializations].some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : courseGroups;

  return (
    <div>
      <SEO title="Courses - Explore 500+ Programs" description="Browse courses from 30+ top universities. B.Tech, MBA, BBA, BCA, MCA, B.Com and more." canonical="/courses" />
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4 border border-white/20">{categories.length}+ COURSES</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">Explore Our Courses</h1>
          <p className="text-blue-200 max-w-2xl mx-auto text-lg">Choose from {filtered.length} course categories offered by {new Set(categories.map(c => c.university_name)).size}+ top universities</p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10 -mt-12 relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search courses... (e.g. B.Tech, MBA, BCA, Law)" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" />
          </div>
          <p className="text-sm text-gray-500 font-medium mt-3">{filtered.length} course categories &bull; {categories.length} total programs &bull; Click any course to see universities</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((group) => {
            const config = getTypeConfig(group.type);
            return (
              <Link key={group.type} to={`/courses?course=${encodeURIComponent(group.type)}&view=detail`} className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                <div className={`relative h-48 bg-gradient-to-br ${config.gradient} overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-32 h-32 border-4 border-white rounded-full" />
                    <div className="absolute bottom-4 left-4 w-20 h-20 border-4 border-white rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <CourseIcon type={config.icon} className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-center leading-tight">{group.type}</h2>
                    <p className="text-sm text-white/80 mt-1 font-medium">{config.fullName}</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-bold text-white">{group.universities.size} Unis</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{config.shortDesc}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">{group.courses.length} Programs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[...group.specializations].slice(0, 3).map((spec, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                        {spec.replace(group.type + " - ", "").replace(group.type + " ", "")}
                      </span>
                    ))}
                    {group.specializations.size > 3 && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{group.specializations.size - 3} more</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {[...group.modes].map((mode) => (
                        <span key={mode} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${mode === "Regular" ? "bg-green-50 text-green-700" : mode === "Online" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"}`}>{mode}</span>
                      ))}
                    </div>
                    <span className="text-blue-600 text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">View All <ChevronRight className="h-3.5 w-3.5" /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Filter className="h-10 w-10 text-gray-300" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500">Try searching with a different term</p>
          </div>
        )}
      </div>
    </div>
  );
}
