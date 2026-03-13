import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import { Send, Loader2, CheckCircle } from "lucide-react";

interface University {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  university_id: number;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh"
];

export default function Enquiry() {
  const [searchParams] = useSearchParams();
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", state: "", city: "",
    university_id: searchParams.get("university_id") || "",
    category_id: searchParams.get("category_id") || "",
    message: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [uniRes, catRes] = await Promise.allSettled([
        api.get("/api/universities"),
        api.get("/api/categories"),
      ]);
      if (uniRes.status === "fulfilled") setUniversities(uniRes.value.data || []);
      if (catRes.status === "fulfilled") setCategories(catRes.value.data || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = form.university_id
    ? categories.filter((c) => String(c.university_id) === form.university_id)
    : categories;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedUni = universities.find((u) => String(u.id) === form.university_id);
      const selectedCat = categories.find((c) => String(c.id) === form.category_id);
      await api.post("/api/enquiries", {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        state: form.state || null,
        city: form.city || null,
        university_id: form.university_id ? parseInt(form.university_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        message: form.message || null,
        university_name: selectedUni?.name || "",
        course_name: selectedCat?.name || "",
      });
      setSubmitted(true);
    } catch {
      alert("Error submitting enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Enquiry Submitted!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your interest. Our counselor will contact you shortly.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", state: "", city: "", university_id: "", category_id: "", message: "" }); }}
          className="btn-3d btn-3d-blue px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <div>
      <SEO
        title="Apply Now - Submit Enquiry"
        description="Apply for admission at top universities through Education Hub. Fill out the enquiry form and our expert counselors will guide you through the admission process."
        keywords="apply for admission, university enquiry, course application, admission form, education hub apply, college admission India"
        canonical="/enquiry"
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Enquiry / Apply Now</h1>
          <p className="mt-3 text-blue-200 max-w-2xl mx-auto">
            Fill out the form below and our counselor will get in touch with you.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      required
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select State</option>
                      {indianStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your city"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Course Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Course Selection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <select
                    value={form.university_id}
                    onChange={(e) => setForm({ ...form, university_id: e.target.value, category_id: "" })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select University</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Course</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific questions or requirements..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-3d btn-3d-blue w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Enquiry
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
