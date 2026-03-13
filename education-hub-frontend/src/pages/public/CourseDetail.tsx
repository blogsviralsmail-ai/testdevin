import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../lib/api";
import SEO, { getCourseSchema } from "../../components/SEO";
import { GraduationCap, Clock, IndianRupee, BookOpen, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  mode: string;
  duration: string;
  fee: string;
  eligibility: string;
  university_name: string;
  university_id: number;
}

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [slug]);

  async function loadCourse() {
    try {
      const res = await api.get("/api/categories");
      const found = (res.data || []).find((c: Category) => c.slug === slug);
      setCourse(found || null);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
        <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
        <Link to="/courses" className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Back to Courses
        </Link>
      </div>
    );
  }

  const feeLines = course.fee?.includes("|") ? course.fee.split("|").map((f) => f.trim()) : [course.fee];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SEO
        title={`${course.name} - ${course.university_name}`}
        description={`${course.name} from ${course.university_name}. Duration: ${course.duration}. Mode: ${course.mode}. ${course.description || "Get expert admission guidance."}`}
        keywords={`${course.name}, ${course.university_name}, ${course.mode} course, admission, ${course.duration}`}
        canonical={`/course/${slug}`}
        structuredData={getCourseSchema({ name: course.name, slug: slug || "", university: course.university_name, duration: course.duration, fee: course.fee, mode: course.mode, description: course.description })}
      />
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 text-white mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              course.mode === "Online" ? "bg-green-500/20 text-green-300" :
              course.mode === "Regular" ? "bg-blue-500/20 text-blue-300" :
              "bg-purple-500/20 text-purple-300"
            }`}>
              {course.mode}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-3">{course.name}</h1>
            <p className="text-blue-200 mt-2">{course.university_name}</p>
          </div>
          <Link
            to={`/enquiry?university_id=${course.university_id}&category_id=${course.id}`}
            className="btn-3d btn-3d-yellow px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-xl flex-shrink-0"
          >
            Apply Now
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">About This Course</h2>
            <p className="text-gray-600 leading-relaxed">{course.description || "Comprehensive program designed to provide students with in-depth knowledge and practical skills for a successful career."}</p>
          </div>

          {/* Eligibility */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Eligibility Criteria</h2>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600">{course.eligibility || "Please contact us for eligibility details."}</p>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Fee Structure</h2>
            <div className="space-y-2">
              {feeLines.map((fee, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <IndianRupee className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{fee}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">* Fees may vary. Contact us for the latest fee structure.</p>
          </div>

          {/* Documents Required */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Documents Required</h2>
            <ul className="space-y-2">
              {[
                "10th Marksheet (Self Attested)",
                "12th Marksheet / Diploma Certificate (Self Attested)",
                "UG/PG Marksheet (Self Attested if applicable)",
                "Aadhar Card (Self Attested)",
                "Caste Certificate / EWS Certificate (if applicable)",
                "Passport Size Photo (2)",
                "ABC ID (Self Attested)",
                "Migration Certificate (if applicable)",
              ].map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
            <h3 className="font-semibold mb-4">Course Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium">{course.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mode</p>
                  <p className="text-sm font-medium">{course.mode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">University</p>
                  <p className="text-sm font-medium">{course.university_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fee (Yearly)</p>
                  <p className="text-sm font-medium">{feeLines[0]}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                to={`/enquiry?university_id=${course.university_id}&category_id=${course.id}`}
                className="btn-3d btn-3d-blue block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl"
              >
                Apply Now
              </Link>
              <Link
                to="/contact"
                className="btn-3d btn-3d-green block w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
