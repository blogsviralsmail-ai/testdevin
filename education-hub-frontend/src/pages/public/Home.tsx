import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import SEO, { getFAQSchema } from "../../components/SEO";
import {
  GraduationCap, ArrowRight, BookOpen, Shield, Clock, Headphones,
  FlaskConical, Code, Building2, Library, Calculator, Zap,
  Users, Award, CheckCircle, Star, MapPin, Phone, ChevronRight,
  Play, TrendingUp, Heart,
  Search, Compass, FileCheck, Rocket
} from "lucide-react";

const courseStyles: Record<string, { gradient: string; icon: string; img: string }> = {
  "b.com": { gradient: "from-amber-500 to-orange-600", icon: "calculator", img: "https://www.mangalayatan.in/blog/uploaded_files/topic_img/455110477_top-15-high-demand-courses.webp" },
  "b.lib": { gradient: "from-emerald-500 to-teal-600", icon: "library", img: "https://www.sunriseuniversity.in/assets/images/school-of-library-and-information-science-sru.jpg" },
  "b.sc forensic": { gradient: "from-red-500 to-rose-600", icon: "flask", img: "https://sageuniversity.edu.in/assets/images/blog/msc-biotechnology-course-details-eligibility-admission-fees-colleges-career-scope.webp" },
  "b.sc": { gradient: "from-cyan-500 to-blue-600", icon: "flask", img: "https://sageuniversity.edu.in/assets/images/blog/msc-biotechnology-course-details-eligibility-admission-fees-colleges-career-scope.webp" },
  "b.tech": { gradient: "from-violet-500 to-purple-600", icon: "code", img: "https://jecrcuniversity.edu.in/wp-content/uploads/2024/03/desing-homepage-slider.jpg" },
  "m.tech": { gradient: "from-indigo-500 to-blue-700", icon: "code", img: "https://jecrcuniversity.edu.in/wp-content/uploads/2024/03/desing-homepage-slider.jpg" },
  "mba": { gradient: "from-slate-600 to-gray-800", icon: "building", img: "https://api.onlinejain.com/media/elective/desktop_image/MBA_Entrepreneurship_and_Venture_Creation.webp" },
  "m.sc": { gradient: "from-teal-500 to-green-600", icon: "flask", img: "https://sageuniversity.edu.in/assets/images/blog/msc-biotechnology-course-details-eligibility-admission-fees-colleges-career-scope.webp" },
  "m.com": { gradient: "from-yellow-500 to-amber-600", icon: "calculator", img: "https://www.mangalayatan.in/blog/uploaded_files/topic_img/455110477_top-15-high-demand-courses.webp" },
  "ba": { gradient: "from-pink-500 to-rose-600", icon: "book", img: "https://www.sunriseuniversity.in/assets/images/school-of-education-and-physical-sducation-sru.jpg" },
  "ma": { gradient: "from-fuchsia-500 to-purple-600", icon: "book", img: "https://www.sunriseuniversity.in/assets/images/school-of-education-and-physical-sducation-sru.jpg" },
  "bba": { gradient: "from-blue-500 to-indigo-600", icon: "building", img: "https://api.onlinejain.com/media/elective/desktop_image/MBA_Entrepreneurship_and_Venture_Creation.webp" },
  "bca": { gradient: "from-green-500 to-emerald-600", icon: "code", img: "https://jecrcuniversity.edu.in/wp-content/uploads/2024/03/desing-homepage-slider.jpg" },
  "mca": { gradient: "from-blue-600 to-violet-700", icon: "code", img: "https://jecrcuniversity.edu.in/wp-content/uploads/2024/03/desing-homepage-slider.jpg" },
  "llb": { gradient: "from-gray-600 to-slate-800", icon: "shield", img: "https://oui.edu.in/storage/2023/07/Best-Private-University-2023.jpg" },
  "default": { gradient: "from-blue-500 to-indigo-600", icon: "graduation", img: "https://www.gla.ac.in/images/course-dp-im1.webp" },
};

function getCourseStyle(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(courseStyles)) {
    if (key !== "default" && lower.includes(key)) return courseStyles[key];
  }
  return courseStyles["default"];
}

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
    default: return <GraduationCap className={className} />;
  }
}

function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        function tick(now: number) {
          const elapsed = now - t0;
          const progress = Math.min(elapsed / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  const display = count === null ? end : count;
  return { count: display, ref };
}

interface University { id: number; name: string; code: string; logo: string; description: string; website: string }
interface Category { id: number; name: string; slug: string; mode: string; duration: string; fee: string; university_name: string }
interface Testimonial { id: number; name: string; course: string; university: string; text: string; rating: number; photo: string }

const defaultTestimonials: Testimonial[] = [
  { id: 1, name: "Priya Sharma", course: "MBA", university: "Amity University", text: "Education Hub ne meri MBA admission process ko bahut easy bana diya. Unke counselors ne har step pe guidance di aur mujhe best university suggest ki. Aaj main ek MNC me kaam karti hoon, thanks to their support!", rating: 5, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Mr.%20Awadh%20Ojha.jpg" },
  { id: 2, name: "Rahul Verma", course: "B.Tech", university: "Chandigarh University", text: "Maine Education Hub ke through Chandigarh University me B.Tech me admission liya. Documentation se lekar admission tak, sab kuch smooth tha. Highly recommend for engineering aspirants!", rating: 5, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Realme%20event%20Rahul%20dua.jpg" },
  { id: 3, name: "Ananya Gupta", course: "BBA", university: "LPU", text: "Mujhe BBA karna tha lekin confusion tha ki kaunsi university choose karun. Education Hub ke experts ne meri profile dekh kar perfect university suggest ki. Best decision of my life!", rating: 5, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Blood%20donation%2025.jpg" },
  { id: 4, name: "Vikram Singh", course: "MCA", university: "GLA University", text: "Distance MCA karna chahta tha job ke saath. Education Hub ne mujhe GLA University ka option bataya jo perfect tha. Fees bhi reasonable thi aur degree UGC recognized hai.", rating: 4, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Ganesh%20Visharjan.jpg" },
  { id: 5, name: "Sneha Patel", course: "B.Com", university: "Parul University", text: "Education Hub ki team ne meri admission ke baad bhi support kiya. Documents verification se lekar exam preparation tak, sab me help ki. Bahut accha experience raha!", rating: 5, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Impact%20of%20tehcnology%20Adoption%20In%20agri.jpg" },
  { id: 6, name: "Arjun Reddy", course: "B.Tech CSE", university: "Vivekananda Global University", text: "Engineering ke liye bahut universities dekhi thi lekin Education Hub ne mujhe sahi direction di. Admission fast hua aur campus bhi acha mila. Thank you Education Hub team!", rating: 5, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Mr.%20Awadh%20Ojha.jpg" },
  { id: 7, name: "Kavita Joshi", course: "MA English", university: "Suresh Gyan Vihar University", text: "Distance learning me MA karna chahti thi. Education Hub ne affordable university suggest ki aur pura admission process handle kiya. Ab main teaching job me aage badh rahi hoon.", rating: 4, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Realme%20event%20Rahul%20dua.jpg" },
  { id: 8, name: "Amit Kumar", course: "MBA Online", university: "JAIN University", text: "Online MBA karna job ke saath possible tha sirf Education Hub ki wajah se. Unhone sab kuch manage kiya - application, documentation, fees payment. 5 star service!", rating: 5, photo: "https://www.vgu.ac.in/assets/img/events/eventsandactivities/Blood%20donation%2025.jpg" },
];

export default function Home() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [uniCount, setUniCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);

  const c1 = useCounter(uniCount || 15);
  const c2 = useCounter(courseCount || 46);
  const c3 = useCounter(parseInt(settings.stat_students_enrolled || "5000") || 5000);
  const c4 = useCounter(parseInt(settings.stat_success_rate || "95") || 95);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [uniRes, catRes, testRes, settRes] = await Promise.allSettled([
        api.get("/api/universities"),
        api.get("/api/categories"),
        api.get("/api/testimonials/public"),
        api.get("/api/settings"),
      ]);
      if (uniRes.status === "fulfilled") {
        setUniversities(uniRes.value.data || []);
        setUniCount(uniRes.value.data?.length || 15);
      }
      if (catRes.status === "fulfilled") {
        const cats = catRes.value.data || [];
        setCategories(cats);
        // Count unique course names (not duplicates across universities)
        const uniqueNames = new Set(cats.map((c: Category) => c.name.replace(/\s*-\s*\d+$/, '').replace(/\s+\d+$/, '').trim()));
        setCourseCount(uniqueNames.size || 46);
      }
      if (testRes.status === "fulfilled") {
        setTestimonials(testRes.value.data || []);
      }
      if (settRes.status === "fulfilled") {
        setSettings(settRes.value.data || {});
      }
    } catch { /* empty */ }
  }

  const homeFAQs = [
    { question: "What courses does Education Hub offer?", answer: "Education Hub offers 500+ courses including B.Tech, MBA, BBA, BCA, MCA, B.Com, BA, MA, M.Sc, B.Sc, LLB and more from 30+ top universities across India." },
    { question: "Are the universities UGC recognized?", answer: "Yes, all our partner universities are UGC recognized and NAAC accredited, ensuring quality education and valid degrees." },
    { question: "How can I apply for admission?", answer: "You can apply by filling out our online enquiry form, calling our helpline, or visiting our office. Our counselors will guide you through the entire admission process." },
    { question: "What is the fee structure?", answer: "Fees vary by course and university. We offer competitive pricing and flexible payment options. Contact our counselors for detailed fee information." },
    { question: "Do you provide placement support?", answer: "Yes, we provide career guidance and placement support to help students achieve their professional goals after completing their courses." },
  ];

  return (
    <div className="overflow-x-hidden w-full max-w-[100vw]">
      <SEO
        title="Home"
        description="India's trusted education consultancy. Connect with 30+ top universities, explore 500+ courses. Expert admission guidance for B.Tech, MBA, BBA, BCA, MCA, B.Com, BA, MA. UGC recognized, NAAC accredited."
        keywords="education hub, university admission, online courses, distance education, UGC recognized, NAAC accredited, Jaipur, Rajasthan, B.Tech, MBA, BBA, BCA, MCA, B.Com, BA, MA, best education consultancy India"
        canonical="/"
        structuredData={getFAQSchema(homeFAQs)}
      />
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden w-full">
        <div className="absolute inset-0">
          <img src={settings.hero_bg_image || "https://www.gla.ac.in/images/capgemini-codexperience-center.webp"} alt="" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/40" />
        </div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float hidden lg:block" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl hidden lg:block" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 w-full">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/20 rounded-full mb-6">
              <Star className="h-4 w-4 text-blue-400 fill-blue-400" />
              <span className="text-sm text-blue-300 font-medium">{settings.hero_badge_text || "India's Trusted Education Partner"}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              {settings.hero_title || "Shape Your Future with"}{" "}<span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">{settings.hero_highlight_text || "World-Class Education"}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-xl">
              {settings.hero_subtitle || `Connect with ${uniCount || 30}+ top universities, explore ${courseCount || 500}+ courses, and get expert admission guidance. Your dream career starts here.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/courses" className="btn-3d btn-3d-blue group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl">
                Explore Courses <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/enquiry" className="btn-3d btn-3d-yellow inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-xl">
                <Play className="h-5 w-5" /> {settings.hero_cta_text || "Apply Now"}
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8">
              {[{ label: settings.stat_uni_label || "Universities", value: `${uniCount || 30}+` }, { label: settings.stat_course_label || "Courses", value: `${courseCount || 500}+` }, { label: settings.stat_student_label || "Students", value: `${settings.stat_students_enrolled || "5000"}+` }].map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3">
                  <div className="w-px h-8 bg-white/20" />
                  <div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ===== ANIMATED STATS ===== */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div ref={c1.ref}>
                <div className="inline-flex items-center justify-center h-14 w-14 bg-blue-100 rounded-xl mb-3"><Building2 className="h-7 w-7 text-blue-600" /></div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{c1.count}+</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{settings.stat_uni_label || "Partner Universities"}</div>
              </div>
              <div ref={c2.ref}>
                <div className="inline-flex items-center justify-center h-14 w-14 bg-indigo-100 rounded-xl mb-3"><BookOpen className="h-7 w-7 text-indigo-600" /></div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{c2.count}+</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{settings.stat_course_label || "Courses Available"}</div>
              </div>
              <div ref={c3.ref}>
                <div className="inline-flex items-center justify-center h-14 w-14 bg-green-100 rounded-xl mb-3"><Users className="h-7 w-7 text-green-600" /></div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{c3.count}+</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{settings.stat_student_label || "Students Enrolled"}</div>
              </div>
              <div ref={c4.ref}>
                <div className="inline-flex items-center justify-center h-14 w-14 bg-orange-100 rounded-xl mb-3"><TrendingUp className="h-7 w-7 text-orange-600" /></div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{c4.count}%</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{settings.stat_success_label || "Success Rate"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full mb-4">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Your Journey to <span className="text-blue-600">Success</span></h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">Simple steps to secure your admission at a top university</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", icon: Search, title: "Explore Courses", desc: "Browse 500+ courses from 30+ universities. Filter by stream, mode, and fees.", color: "blue", link: "/courses" },
              { step: "02", icon: Compass, title: "Expert Counseling", desc: "Get personalized guidance from our experienced education counselors.", color: "indigo", link: "/contact" },
              { step: "03", icon: FileCheck, title: "Apply & Enroll", desc: "Complete your application with our support. We handle the paperwork.", color: "green", link: "/enquiry" },
              { step: "04", icon: Rocket, title: "Start Learning", desc: "Begin your academic journey at your dream university.", color: "orange", link: "/universities" },
            ].map((item, i) => (
              <Link key={i} to={item.link} className="relative group">
                {i < 3 && <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />}
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`absolute -top-5 left-6 h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold shadow-lg ${item.color === "blue" ? "bg-blue-600" : item.color === "indigo" ? "bg-indigo-600" : item.color === "green" ? "bg-green-600" : "bg-orange-600"}`}>{item.step}</div>
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 mt-3 ${item.color === "blue" ? "bg-blue-100" : item.color === "indigo" ? "bg-indigo-100" : item.color === "green" ? "bg-green-100" : "bg-orange-100"}`}>
                    <item.icon className={`h-8 w-8 ${item.color === "blue" ? "text-blue-600" : item.color === "indigo" ? "text-indigo-600" : item.color === "green" ? "text-green-600" : "text-orange-600"}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50/50 py-20 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <img src="https://adypu.edu.in/wp-content/uploads/2025/12/banner-3.jpeg" alt="Indian students counseling session" className="rounded-2xl w-full h-64 object-cover shadow-lg" loading="lazy" decoding="async" />
                <img src="https://www.madhavuniversity.edu.in/static/assets/slider/slider_3.jpeg" alt="Indian university campus" className="rounded-2xl w-full h-48 object-cover shadow-lg mt-16" loading="lazy" decoding="async" />
                <img src="https://www.madhavuniversity.edu.in/static/assets/slider/slider_4.jpeg" alt="Education consultancy office" className="rounded-2xl w-full h-48 object-cover shadow-lg -mt-8" loading="lazy" decoding="async" />
                <img src="https://www.madhavuniversity.edu.in/static/assets/slider/slider_5.png" alt="Students in classroom" className="rounded-2xl w-full h-64 object-cover shadow-lg -mt-8" loading="lazy" decoding="async" />
              </div>
              <div className="absolute -bottom-6 right-0 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-float">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center"><Award className="h-6 w-6 text-green-600" /></div>
                  <div><div className="text-2xl font-extrabold text-gray-900">10+</div><div className="text-xs text-gray-500">Years Experience</div></div>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full mb-4">WHY CHOOSE US</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">India&apos;s Most Trusted <span className="text-blue-600">Education Consultancy</span></h2>
              <p className="mt-4 text-gray-500 text-lg leading-relaxed">We provide comprehensive admission support to help students find the right course at the right university with the right guidance.</p>
              <div className="mt-8 space-y-5">
                {[
                  { icon: Shield, title: "UGC Recognized Universities", desc: "All partner universities are UGC recognized and NAAC accredited" },
                  { icon: Users, title: "Expert Counselors", desc: "Experienced team providing personalized guidance for every student" },
                  { icon: Clock, title: "Quick Admission Process", desc: "Hassle-free and fast admission with complete documentation support" },
                  { icon: Heart, title: "Post Admission Support", desc: "We stay connected even after admission to help with any issues" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
                      <item.icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div><h3 className="font-bold text-gray-900">{item.title}</h3><p className="text-sm text-gray-500 mt-0.5">{item.desc}</p></div>
                  </div>
                ))}
              </div>
              <Link to="/about" className="btn-3d btn-3d-blue inline-flex items-center gap-2 mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">
                Learn More About Us <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== UNIVERSITY PARTNERS (Marquee) ===== */}
      <section className="bg-gradient-to-b from-white to-indigo-50/30 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full mb-5 tracking-wide">OUR PARTNERS</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Trusted <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">University Partners</span></h2>
            <p className="mt-5 text-gray-500 max-w-3xl mx-auto text-lg">Partnered with India&apos;s leading UGC-recognized and NAAC-accredited universities for quality education</p>
          </div>
        </div>
        {universities.length > 0 && (
          <div className="marquee-container">
            <div className="flex animate-marquee-slow" style={{ width: 'max-content' }}>
              {[...universities, ...universities].map((uni, idx) => (
                <Link key={`${uni.id}-${idx}`} to={`/courses?university=${uni.id}`} className="flex-shrink-0 mx-4 w-72 group">
                  <div className="bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-300 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden p-6 h-full">
                    <div className="flex items-center gap-4 mb-3">
                      {uni.logo ? (
                        <img src={uni.logo} alt={uni.name} className="h-16 w-16 object-contain rounded-xl bg-white p-2 border border-gray-100 shadow-sm flex-shrink-0" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                      ) : null}
                      <div className={`h-16 w-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg ${uni.logo ? 'hidden' : ''}`}>
                        {uni.code?.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors truncate">{uni.name}</h3>
                        <span className="text-xs text-indigo-600 font-semibold">{uni.code}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{uni.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="text-center mt-10">
          <Link to="/universities" className="btn-3d btn-3d-blue inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl text-lg">
            View All {universities.length} Universities <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ===== POPULAR COURSES (Marquee) ===== */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 text-sm font-semibold rounded-full mb-4">POPULAR COURSES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Explore Our <span className="text-green-600">Top Courses</span></h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">Choose from a wide range of undergraduate, postgraduate, and professional courses</p>
          </div>
        </div>
        {(() => {
          // Group courses by base course name (e.g. "MBA", "B.Tech", "BCA")
          const courseMap = new Map<string, { name: string; count: number; universities: string[]; modes: string[] }>();
          categories.forEach(cat => {
            // Extract base course name - remove university suffix and numbers
            const baseName = cat.name.replace(/\s*-\s*\d+$/, '').replace(/\s+\d+$/, '').trim();
            if (courseMap.has(baseName)) {
              const existing = courseMap.get(baseName)!;
              existing.count++;
              if (cat.university_name && !existing.universities.includes(cat.university_name)) {
                existing.universities.push(cat.university_name);
              }
              if (cat.mode && !existing.modes.includes(cat.mode)) {
                existing.modes.push(cat.mode);
              }
            } else {
              courseMap.set(baseName, {
                name: baseName,
                count: 1,
                universities: cat.university_name ? [cat.university_name] : [],
                modes: cat.mode ? [cat.mode] : [],
              });
            }
          });
          const uniqueCourses = Array.from(courseMap.values()).sort((a, b) => b.universities.length - a.universities.length).slice(0, 20);
          return uniqueCourses.length > 0 && (
            <div className="marquee-container">
              <div className="flex animate-marquee" style={{ width: 'max-content' }}>
                {[...uniqueCourses, ...uniqueCourses].map((course, idx) => {
                  const style = getCourseStyle(course.name);
                  return (
                    <Link key={`${course.name}-${idx}`} to={`/courses?search=${encodeURIComponent(course.name)}`} className="flex-shrink-0 mx-3 w-80 group">
                      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 h-full">
                        <div className="relative h-44 overflow-hidden">
                          <img src={style.img} alt={course.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-extrabold text-lg leading-snug mb-1.5 drop-shadow-lg">{course.name}</h3>
                            <p className="text-white/80 text-xs flex items-center gap-1 drop-shadow"><GraduationCap className="h-3 w-3 flex-shrink-0" /> Available in {course.universities.length} {course.universities.length === 1 ? 'University' : 'Universities'}</p>
                          </div>
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            {course.modes.slice(0, 2).map((m, mi) => (
                              <span key={mi} className="text-xs px-3 py-1 rounded-full font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/20">{m}</span>
                            ))}
                          </div>
                          <div className="absolute top-3 right-3">
                            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                              <CourseIcon type={style.icon} className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {course.universities.slice(0, 3).map((u, ui) => (
                              <span key={ui} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium truncate max-w-[140px]">{u}</span>
                            ))}
                            {course.universities.length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">+{course.universities.length - 3} more</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Click to see all universities</span>
                            <ArrowRight className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}
        <div className="text-center mt-12">
          <Link to="/courses" className="btn-3d btn-3d-blue inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg">
            View All {courseCount} Courses <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ===== TESTIMONIALS (Marquee) ===== */}
      <section className="bg-gradient-to-b from-orange-50/50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-orange-50 text-orange-600 text-sm font-semibold rounded-full mb-4">TESTIMONIALS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">What Our <span className="text-orange-600">Students Say</span></h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">Hear from students who transformed their careers through Education Hub</p>
          </div>
        </div>
        {(() => { const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials; return (
          <div className="marquee-container">
            <div className="flex animate-marquee-fast" style={{ width: 'max-content' }}>
              {[...displayTestimonials, ...displayTestimonials].map((t, idx) => (
                <div key={idx} className="flex-shrink-0 mx-3 w-80">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={t.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=4F46E5&color=fff&size=100`} alt={t.name} className="h-14 w-14 rounded-full object-cover border-2 border-orange-200 flex-shrink-0 shadow-sm" loading="lazy" decoding="async" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-orange-600 font-medium">{t.course}</p>
                        <p className="text-xs text-gray-400">{t.university}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 italic">&ldquo;{t.text}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ); })()}
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://www.gla.ac.in/images/capgemini-codexperience-center.webp" alt="Students studying" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/90" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Start Your Academic Journey?</h2>
          <p className="text-blue-200 mb-10 text-lg max-w-2xl mx-auto">Don&apos;t wait! Connect with our expert counselors and secure your admission at a top university today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/enquiry" className="btn-3d btn-3d-yellow inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-xl text-lg">
              Apply Now <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/contact" className="btn-3d btn-3d-white inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl text-lg border border-white/20">
              <Phone className="h-5 w-5" /> Contact Us
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            {["UGC Recognized", "NAAC Accredited", "Govt. Approved", "ISO Certified"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle className="h-4 w-4 text-green-400" />{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUICK CONTACT ===== */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
              <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Phone className="h-7 w-7 text-blue-600" /></div>
              <div><h3 className="font-bold text-gray-900">Call Us</h3><p className="text-sm text-gray-500 mt-0.5">{settings.company_phone || "+919251295969"}</p><p className="text-xs text-gray-400">Mon-Sat, 9AM-7PM</p></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
              <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><MapPin className="h-7 w-7 text-green-600" /></div>
              <div><h3 className="font-bold text-gray-900">Visit Us</h3><p className="text-sm text-gray-500 mt-0.5">{settings.company_address || "OASIS COMPLEX, 46 SHASHTRINAGAR ROAD, NEAR PNB BANK AJMER"}</p></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 flex items-center gap-4 hover:-translate-y-1">
              <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"><Headphones className="h-7 w-7 text-purple-600" /></div>
              <div><h3 className="font-bold text-gray-900">24/7 Support</h3><p className="text-sm text-gray-500 mt-0.5">{settings.company_email || "info@asffeducationhub.com"}</p><p className="text-xs text-gray-400">We reply within 24 hours</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
