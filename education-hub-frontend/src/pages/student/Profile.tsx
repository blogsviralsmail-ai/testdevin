import { useState, useEffect, useRef } from "react";
import api, { getUser } from "../../lib/api";
import { Loader2, Save, User, Camera } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

export default function StudentProfile() {
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const user = getUser();

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const res = await api.get("/api/students?search=" + (user?.email || ""));
      if (res.data?.students?.length > 0) {
        setProfile(res.data.students[0]);
        if (res.data.students[0].photo) {
          const p = res.data.students[0].photo;
          setPhotoPreview(p.startsWith("/") ? API + p : p);
        }
      } else if (res.data?.length > 0) {
        setProfile(res.data[0]);
        if (res.data[0].photo) {
          const p = res.data[0].photo;
          setPhotoPreview(p.startsWith("/") ? API + p : p);
        }
      }
    } catch { /* empty */ } finally { setLoading(false); }
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      try {
        const res = await api.post("/api/students/upload-photo-base64", { image: result, ext: "jpg" });
        const photoUrl = res.data.url;
        setProfile((p) => ({ ...p, photo: photoUrl }));
        // Backend auto-saves photo to student record in upload-photo-base64 endpoint
        setMessage("Photo updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } catch { /* skip */ }
    };
    reader.readAsDataURL(file);
  };

  async function handleSave() {
    setSaving(true); setMessage("");
    try {
      if (profile.id) {
        await api.put("/api/students/" + profile.id, profile);
        setMessage("Profile updated successfully!");
      }
    } catch { setMessage("Error updating profile"); }
    finally { setSaving(false); setTimeout(() => setMessage(""), 3000); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const set = (k: string, v: string) => setProfile((p) => ({ ...p, [k]: v }));
  const inp = (key: string, label: string, type = "text", disabled = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={profile[key] || ""} onChange={(e) => set(key, e.target.value)} disabled={disabled}
        className={"w-full px-3 py-2 border rounded-lg text-sm " + (disabled ? "border-gray-200 bg-gray-50 text-gray-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500")} />
    </div>
  );
  const sel = (key: string, label: string, options: string[], disabled = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select value={profile[key] || ""} onChange={(e) => set(key, e.target.value)} disabled={disabled}
        className={"w-full px-3 py-2 border rounded-lg text-sm " + (disabled ? "border-gray-200 bg-gray-50 text-gray-500" : "border-gray-300 focus:ring-2 focus:ring-blue-500")}>
        <option value="">Select</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
        </button>
      </div>

      {message && <div className={"mb-4 p-3 rounded-lg text-sm " + (message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700")}>{message}</div>}

      <div className="space-y-6">
        {/* Photo & Basic */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-gray-200">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="h-24 w-24 rounded-full object-cover border-4 border-blue-100" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-50">
                  <User className="h-10 w-10 text-blue-400" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold">{profile.name || user?.name || "Student"}</h2>
              <p className="text-sm text-gray-500">{profile.email || user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Enrollment: {profile.enrollment_no || "Pending"}</p>
              <span className={"text-xs px-2 py-0.5 rounded-full mt-1 inline-block " +
                (profile.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                {profile.status || "Pending"}
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inp("name", "Full Name")}
            {inp("email", "Email", "email", true)}
            {inp("phone", "Phone")}
            {inp("date_of_birth", "Date of Birth", "date")}
            {sel("gender", "Gender", ["Male", "Female", "Other"])}
            {sel("category_type", "Category", ["General", "OBC", "SC", "ST", "EWS"])}
            {inp("nationality", "Nationality")}
            {inp("aadhar_no", "Aadhar Number")}
            {sel("marital_status", "Marital Status", ["Single", "Married", "Other"])}
            {sel("blood_group", "Blood Group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])}
            {inp("university_name", "University", "text", true)}
            {inp("category_name", "Course", "text", true)}
          </div>
        </div>

        {/* Family */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Family Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inp("father_name", "Father's Name")}
            {inp("mother_name", "Mother's Name")}
            {inp("guardian_name", "Guardian Name")}
            {inp("father_occupation", "Father's Occupation")}
            {inp("parent_phone", "Parent Phone")}
            {inp("parent_email", "Parent Email", "email")}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Current Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">{inp("current_address", "Address")}</div>
            {inp("current_city", "City")}
            {sel("current_state", "State", INDIAN_STATES)}
            {inp("current_pincode", "Pincode")}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 mt-4">Permanent Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">{inp("permanent_address", "Address")}</div>
            {inp("permanent_city", "City")}
            {sel("permanent_state", "State", INDIAN_STATES)}
            {inp("permanent_pincode", "Pincode")}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">10th Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {inp("tenth_board", "Board")}
            {inp("tenth_school", "School Name")}
            {inp("tenth_year", "Year of Passing")}
            {inp("tenth_percentage", "Percentage/CGPA")}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">12th Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {inp("twelfth_board", "Board")}
            {inp("twelfth_school", "School Name")}
            {inp("twelfth_year", "Year of Passing")}
            {inp("twelfth_percentage", "Percentage/CGPA")}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Graduation (if applicable)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {inp("graduation_degree", "Degree")}
            {inp("graduation_university", "University")}
            {inp("graduation_year", "Year of Passing")}
            {inp("graduation_percentage", "Percentage/CGPA")}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Additional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sel("disability", "Disability", ["No", "Yes"])}
            {sel("hostel_required", "Hostel Required", ["No", "Yes"])}
            {sel("transport_required", "Transport Required", ["No", "Yes"])}
          </div>
        </div>
      </div>
    </div>
  );
}
