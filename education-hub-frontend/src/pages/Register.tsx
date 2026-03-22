import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { setAuth } from "../lib/api";
import { Camera, ChevronRight, ChevronLeft, CheckCircle, Clock, User, Users, MapPin, GraduationCap, FileCheck } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

interface University { id: number; name: string; }
interface Category { id: number; name: string; university_id: number; }

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

const stepIcons = [User, User, Users, MapPin, GraduationCap, FileCheck];
const stepNames = ["Account", "Personal", "Family", "Address", "Education", "Review"];

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    university_id: "", category_id: "",
    photo: "",
    date_of_birth: "", gender: "", category_type: "General", nationality: "Indian",
    aadhar_no: "", marital_status: "Single", blood_group: "",
    father_name: "", mother_name: "", guardian_name: "", father_occupation: "",
    parent_phone: "", parent_email: "",
    current_address: "", current_city: "", current_state: "", current_pincode: "",
    permanent_address: "", permanent_city: "", permanent_state: "", permanent_pincode: "",
    tenth_board: "", tenth_year: "", tenth_percentage: "", tenth_school: "",
    twelfth_board: "", twelfth_year: "", twelfth_percentage: "", twelfth_school: "",
    graduation_university: "", graduation_year: "", graduation_percentage: "", graduation_degree: "",
    disability: "No", hostel_required: "No", transport_required: "No",
  });
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/universities").then((r) => setUniversities(r.data));
    api.get("/api/settings").then(r => {
      const s = r.data || {};
      const logo = s.navbar_logo_url || s.logo_url;
      if (logo) setLogoUrl(logo.startsWith("/") ? API + logo : logo);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (form.university_id) api.get("/api/categories?university_id=" + form.university_id).then((r) => setCategories(r.data));
  }, [form.university_id]);
  useEffect(() => {
    if (sameAddress) setForm((f) => ({ ...f, permanent_address: f.current_address, permanent_city: f.current_city, permanent_state: f.current_state, permanent_pincode: f.current_pincode }));
  }, [sameAddress, form.current_address, form.current_city, form.current_state, form.current_pincode]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { const r = ev.target?.result as string; setPhotoPreview(r); setForm((f) => ({ ...f, photo: r })); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); 
    if (!form.phone || form.phone.length !== 10 || form.phone.startsWith("0")) {
      setError("Please enter a valid 10-digit mobile number (cannot start with 0)");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        name: form.name, email: form.email, phone: form.phone,
        username: form.phone, password: form.password,
        university_id: form.university_id ? parseInt(form.university_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      setAuth(res.data.token, res.data.user);
      let photoUrl = "";
      if (form.photo && form.photo.startsWith("data:")) {
        try { const pr = await api.post("/api/students/upload-photo-base64", { image: form.photo, ext: "jpg" }); photoUrl = pr.data.url; } catch { /* skip */ }
      }
      await api.post("/api/students", {
        name: form.name, email: form.email, phone: form.phone,
        university_id: form.university_id ? parseInt(form.university_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        photo: photoUrl, date_of_birth: form.date_of_birth, gender: form.gender,
        category_type: form.category_type, nationality: form.nationality,
        aadhar_no: form.aadhar_no, marital_status: form.marital_status, blood_group: form.blood_group,
        father_name: form.father_name, mother_name: form.mother_name,
        guardian_name: form.guardian_name, father_occupation: form.father_occupation,
        parent_phone: form.parent_phone, parent_email: form.parent_email,
        current_address: form.current_address, current_city: form.current_city,
        current_state: form.current_state, current_pincode: form.current_pincode,
        permanent_address: form.permanent_address, permanent_city: form.permanent_city,
        permanent_state: form.permanent_state, permanent_pincode: form.permanent_pincode,
        tenth_board: form.tenth_board, tenth_year: form.tenth_year,
        tenth_percentage: form.tenth_percentage, tenth_school: form.tenth_school,
        twelfth_board: form.twelfth_board, twelfth_year: form.twelfth_year,
        twelfth_percentage: form.twelfth_percentage, twelfth_school: form.twelfth_school,
        graduation_university: form.graduation_university, graduation_year: form.graduation_year,
        graduation_percentage: form.graduation_percentage, graduation_degree: form.graduation_degree,
        disability: form.disability, hostel_required: form.hostel_required,
        transport_required: form.transport_required,
      });
      navigate("/student");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const inp = (key: string, label: string, type = "text", required = false) => (
    <div>
      <label className="block text-xs font-medium text-white/80 mb-1">{label}{required && " *"}</label>
      <input type={type} value={(form as Record<string, string>)[key] || ""} onChange={(e) => set(key, e.target.value)}
        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm backdrop-blur-sm" required={required} />
    </div>
  );
  const sel = (key: string, label: string, options: string[], required = false) => (
    <div>
      <label className="block text-xs font-medium text-white/80 mb-1">{label}{required && " *"}</label>
      <select value={(form as Record<string, string>)[key] || ""} onChange={(e) => set(key, e.target.value)}
        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 outline-none text-sm backdrop-blur-sm" required={required}>
        <option value="" className="text-gray-900">Select</option>
        {options.map((o) => <option key={o} value={o} className="text-gray-900">{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Animated bg shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 sm:w-64 sm:h-64 bg-blue-500/10 rounded-full animate-float" />
        <div className="absolute bottom-20 right-10 w-24 h-24 sm:w-48 sm:h-48 bg-indigo-500/10 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 sm:w-32 sm:h-32 bg-purple-500/10 rounded-full animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-5 sm:p-8 max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-5">
            <img src={logoUrl} alt="Education Hub" className="h-12 w-auto mx-auto mb-2 drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Student Registration</h1>
            <p className="text-sm text-blue-200/70 mt-1">Step {step} of 6 - {stepNames[step - 1]}</p>
          </div>

          {/* 3D Step Indicator */}
          <div className="flex items-center justify-center gap-0 sm:gap-1 mb-6 flex-wrap">
            {stepNames.map((name, i) => {
              const Icon = step > i + 1 ? CheckCircle : stepIcons[i];
              return (
                <div key={name} className="flex items-center">
                  <button type="button" onClick={() => { if (i + 1 < step) setStep(i + 1); }}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                      step === i + 1
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : step > i + 1
                        ? "bg-green-500/20 text-green-300 cursor-pointer hover:bg-green-500/30 border border-green-500/30"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{name}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                  {i < 5 && <div className={`w-3 sm:w-6 h-0.5 ${step > i + 1 ? "bg-green-400/50" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>

          {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-2 rounded-xl mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all duration-300 bg-white/5 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                      onClick={() => fileRef.current?.click()}>
                      {photoPreview ? <img src={photoPreview} alt="Photo" className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 text-white/40" />}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    <p className="text-xs text-white/50 text-center mt-1">Upload Photo</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("name", "Full Name", "text", true)}
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">Mobile Number *</label>
                    <input type="text" value={form.phone} onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      set("phone", val);
                    }}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm backdrop-blur-sm" required
                      placeholder="10 digit mobile number"
                      maxLength={10}
                      pattern="[1-9][0-9]{9}"
                      title="Enter 10 digit mobile number (cannot start with 0)"
                    />
                    {form.phone && (form.phone.length < 10 || form.phone.startsWith("0")) && (
                      <p className="text-xs text-red-300 mt-1">{form.phone.startsWith("0") ? "Number cannot start with 0" : `Enter 10 digits (${form.phone.length}/10)`}</p>
                    )}
                  </div>
                </div>
                {inp("email", "Email", "email", true)}
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">University</label>
                  <select value={form.university_id} onChange={(e) => setForm({ ...form, university_id: e.target.value, category_id: "" })}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 outline-none text-sm backdrop-blur-sm">
                    <option value="" className="text-gray-900">Select University</option>
                    {universities.map((u) => <option key={u.id} value={u.id} className="text-gray-900">{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">Course/Category</label>
                  <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 outline-none text-sm backdrop-blur-sm">
                    <option value="" className="text-gray-900">Select Course</option>
                    {categories.map((c) => <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>)}
                  </select>
                </div>
                {inp("password", "Password", "password", true)}
              </div>
            )}

            {/* Step 2: Personal */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("date_of_birth", "Date of Birth", "date", true)}
                  {sel("gender", "Gender", ["Male", "Female", "Other"], true)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sel("category_type", "Category", ["General", "OBC", "SC", "ST", "EWS"])}
                  {inp("nationality", "Nationality")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("aadhar_no", "Aadhar Number")}
                  {sel("marital_status", "Marital Status", ["Single", "Married", "Other"])}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sel("blood_group", "Blood Group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])}
                  {sel("disability", "Disability", ["No", "Yes"])}
                </div>
              </div>
            )}

            {/* Step 3: Family */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("father_name", "Father's Name", "text", true)}
                  {inp("mother_name", "Mother's Name", "text", true)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("guardian_name", "Guardian Name")}
                  {inp("father_occupation", "Father's Occupation")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("parent_phone", "Parent Phone")}
                  {inp("parent_email", "Parent Email", "email")}
                </div>
              </div>
            )}

            {/* Step 4: Address */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-blue-300 border-b border-white/10 pb-2">Current Address</h2>
                {inp("current_address", "Address", "text", true)}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {inp("current_city", "City", "text", true)}
                  {sel("current_state", "State", INDIAN_STATES)}
                  {inp("current_pincode", "Pincode")}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="same" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} className="rounded border-white/30 bg-white/10" />
                  <label htmlFor="same" className="text-xs text-white/60">Same as current address</label>
                </div>
                <h2 className="text-sm font-semibold text-blue-300 border-b border-white/10 pb-2">Permanent Address</h2>
                {inp("permanent_address", "Address")}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {inp("permanent_city", "City")}
                  {sel("permanent_state", "State", INDIAN_STATES)}
                  {inp("permanent_pincode", "Pincode")}
                </div>
              </div>
            )}

            {/* Step 5: Education */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-blue-300 border-b border-white/10 pb-2">10th Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("tenth_board", "Board")}
                  {inp("tenth_school", "School Name")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("tenth_year", "Year of Passing")}
                  {inp("tenth_percentage", "Percentage/CGPA")}
                </div>
                <h2 className="text-sm font-semibold text-blue-300 border-b border-white/10 pb-2">12th Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("twelfth_board", "Board")}
                  {inp("twelfth_school", "School Name")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("twelfth_year", "Year of Passing")}
                  {inp("twelfth_percentage", "Percentage/CGPA")}
                </div>
                <h2 className="text-sm font-semibold text-blue-300 border-b border-white/10 pb-2">Graduation (if applicable)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("graduation_degree", "Degree")}
                  {inp("graduation_university", "University")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("graduation_year", "Year of Passing")}
                  {inp("graduation_percentage", "Percentage/CGPA")}
                </div>
                <h2 className="text-sm font-semibold text-blue-300 border-b border-white/10 pb-2 pt-2">Additional</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sel("hostel_required", "Hostel Required", ["No", "Yes"])}
                  {sel("transport_required", "Transport Required", ["No", "Yes"])}
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Photo" className="h-16 w-16 rounded-full object-cover border-2 border-blue-400/50" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center"><Camera className="h-6 w-6 text-white/40" /></div>
                  )}
                  <div>
                    <p className="font-semibold text-white text-lg">{form.name || "Your Name"}</p>
                    <p className="text-sm text-blue-200/70">{form.email} | {form.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    ["DOB", form.date_of_birth], ["Gender", form.gender], ["Category", form.category_type],
                    ["Aadhar", form.aadhar_no], ["Blood Group", form.blood_group], ["Nationality", form.nationality],
                    ["Father", form.father_name], ["Mother", form.mother_name],
                    ["City", form.current_city], ["State", form.current_state],
                    ["10th %", form.tenth_percentage], ["12th %", form.twelfth_percentage],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="text-white/50">{label}:</span> <span className="font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 mt-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-200">Your registration will be reviewed by admin. You will be notified once approved.</p>
                </div>
              </div>
            )}

            {/* 3D Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)}
                  className="btn-3d flex items-center gap-1 px-4 sm:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl font-medium border border-white/20 transition-all">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : <div />}
              {step < 6 ? (
                <button type="button" onClick={() => setStep(step + 1)}
                  className="btn-3d btn-3d-blue flex items-center gap-1 px-5 sm:px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="btn-3d btn-3d-green px-6 sm:px-10 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-xl font-bold shadow-lg shadow-green-500/25 disabled:opacity-50 transition-all">
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 text-center text-xs">
            <span className="text-white/40">Already have an account? </span>
            <Link to="/login" className="text-blue-300 hover:text-blue-200 font-medium">Sign In</Link>
            <span className="text-white/20 mx-2">|</span>
            <Link to="/" className="text-white/40 hover:text-white/60">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
