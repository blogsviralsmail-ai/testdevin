import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Download, Search, Eye, Trash2, X, User, CheckCircle, XCircle, Edit3, Calendar, Key, FileText, Phone, RefreshCw, IndianRupee, Building2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry"];

interface Student {
  id: number; name: string; email: string; phone: string; photo: string;
  university_name: string; category_name: string; session_name: string;
  status: string; created_at: string; enrollment_no: string; branch_name: string;
  date_of_birth: string; gender: string; category_type: string; nationality: string;
  aadhar_no: string; marital_status: string; blood_group: string;
  father_name: string; mother_name: string; guardian_name: string;
  father_occupation: string; parent_phone: string; parent_email: string;
  current_address: string; current_city: string; current_state: string; current_pincode: string;
  permanent_address: string; permanent_city: string; permanent_state: string; permanent_pincode: string;
  tenth_board: string; tenth_year: string; tenth_percentage: string; tenth_school: string;
  twelfth_board: string; twelfth_year: string; twelfth_percentage: string; twelfth_school: string;
  graduation_university: string; graduation_year: string; graduation_percentage: string; graduation_degree: string;
  disability: string; hostel_required: string; transport_required: string;
  university_id: number; category_id: number;
}
interface University { id: number; name: string; }
interface Category { id: number; name: string; }
interface StatusCategory { id: number; name: string; color: string; description: string; display_order: number; }

const emptyForm = {
  name: "", email: "", phone: "", password: "",
  university_id: "", category_id: "", date_of_birth: "", gender: "",
  category_type: "General", nationality: "Indian", aadhar_no: "", marital_status: "Single",
  blood_group: "", father_name: "", mother_name: "", guardian_name: "",
  father_occupation: "", parent_phone: "", parent_email: "",
  current_address: "", current_city: "", current_state: "", current_pincode: "",
  permanent_address: "", permanent_city: "", permanent_state: "", permanent_pincode: "",
  tenth_board: "", tenth_year: "", tenth_percentage: "", tenth_school: "",
  twelfth_board: "", twelfth_year: "", twelfth_percentage: "", twelfth_school: "",
  graduation_degree: "", graduation_university: "", graduation_year: "", graduation_percentage: "",
  disability: "No", hostel_required: "No", transport_required: "No",
  total_fees: "",
};

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterUni, setFilterUni] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [credModal, setCredModal] = useState<{sid: number; username: string} | null>(null);
  const [credForm, setCredForm] = useState({ username: "", password: "" });
  const [studentDocs, setStudentDocs] = useState<{id:number;doc_type:string;file_path:string;status:string;created_at:string}[]>([]);
  const [statusCategories, setStatusCategories] = useState<StatusCategory[]>([]);
  const [statusDropdown, setStatusDropdown] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"direct" | "center">("direct");
  const [centerStudents, setCenterStudents] = useState<any[]>([]);
  const [centerTotal, setCenterTotal] = useState(0);
  const [centerPage, setCenterPage] = useState(1);
  const [centerSearch, setCenterSearch] = useState("");
  const [centers, setCenters] = useState<{id: number; name: string; parent_center_name?: string}[]>([]);
  const [filterCenter, setFilterCenter] = useState("");

  const load = () => {
    let url = `/api/students?page=${page}&limit=20&admission_source=admin`;
    if (search) url += `&search=${search}`;
    if (filterUni) url += `&university_id=${filterUni}`;
    if (filterCat) url += `&category_id=${filterCat}`;
    if (filterStatus) url += `&status=${filterStatus}`;
    api.get(url).then((r) => { setStudents(r.data.students); setTotal(r.data.total); });
  };

  const loadCenterStudents = () => {
    let url = `/api/students?page=${centerPage}&limit=20&admission_source=center`;
    if (centerSearch) url += `&search=${centerSearch}`;
    if (filterCenter) url += `&center_id=${filterCenter}`;
    if (filterUni) url += `&university_id=${filterUni}`;
    if (filterCat) url += `&category_id=${filterCat}`;
    if (filterStatus) url += `&status=${filterStatus}`;
    api.get(url).then((r) => { setCenterStudents(r.data.students); setCenterTotal(r.data.total); });
  };

  useEffect(() => { if (activeTab === "direct") load(); else loadCenterStudents(); setStatusDropdown(null); }, [page, centerPage, filterUni, filterCat, filterStatus, activeTab, filterCenter]);
  useEffect(() => { const close = () => setStatusDropdown(null); document.addEventListener("click", close); return () => document.removeEventListener("click", close); }, []);
  useEffect(() => { api.get("/api/universities").then((r) => setUniversities(r.data)); api.get("/api/categories").then((r) => setCategories(r.data)); api.get("/api/student-status").then((r) => setStatusCategories(r.data)).catch(() => {}); api.get("/api/centers").then((r) => setCenters(r.data?.centers || r.data || [])).catch(() => {}); }, []);

  const handleSearch = () => { if (activeTab === "direct") { setPage(1); load(); } else { setCenterPage(1); loadCenterStudents(); } };

  const handleCSV = () => {
    let url = `${API}/api/students/csv?token=${localStorage.getItem("admin_token")}`;
    if (filterUni) url += `&university_id=${filterUni}`;
    if (filterCat) url += `&category_id=${filterCat}`;
    if (filterStatus) url += `&status=${filterStatus}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    window.open(url, "_blank");
  };

  const handleAdminAdd = async () => {
    setFormError("");
    if (!form.name || !form.phone || !form.password) { setFormError("Name, Mobile Number & Password are required"); return; }
    try {
      await api.post("/api/students/admin-add", {
        ...form,
        username: form.phone,
        university_id: form.university_id ? parseInt(form.university_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      setShowForm(false); setForm(emptyForm); setFormStep(1); load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setFormError(e.response?.data?.detail || "Error adding student");
    }
  };

  const handleEditSave = async () => {
    if (!editStudent) return;
    try {
      await api.put(`/api/students/${editStudent.id}`, {
        ...form,
        university_id: form.university_id ? parseInt(form.university_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        status: editStudent.status,
      });
      setEditStudent(null); setForm(emptyForm); setFormStep(1); load();
    } catch { /* empty */ }
  };

  const handleApprove = async (id: number) => { await api.post(`/api/students/${id}/approve`); load(); };
  const handleReject = async (id: number) => { await api.post(`/api/students/${id}/reject`); load(); };
  const handleDelete = async (id: number) => { if (confirm("Delete this student?")) { await api.delete(`/api/students/${id}`); load(); } };

  const openCredentials = async (s: Student) => {
    try {
      const res = await api.get(`/api/students/${s.id}/credentials`);
      setCredForm({ username: res.data.username || "", password: "" });
    } catch {
      setCredForm({ username: "", password: "" });
    }
    setCredModal({ sid: s.id, username: "" });
  };

  const saveCredentials = async () => {
    if (!credModal) return;
    try {
      await api.put(`/api/students/${credModal.sid}/update-credentials`, credForm);
      setCredModal(null);
      alert("Credentials updated!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      alert(e.response?.data?.detail || "Error updating credentials");
    }
  };

  const loadStudentDocs = async (sid: number) => {
    try {
      const res = await api.get(`/api/students/${sid}/documents`);
      setStudentDocs(res.data || []);
    } catch { setStudentDocs([]); }
  };

  const openEdit = (s: Student) => {
    setForm({
      name: s.name || "", email: s.email || "", phone: s.phone || "", password: "",
      university_id: s.university_id ? String(s.university_id) : "", category_id: s.category_id ? String(s.category_id) : "",
      date_of_birth: s.date_of_birth || "", gender: s.gender || "", category_type: s.category_type || "General",
      nationality: s.nationality || "Indian", aadhar_no: s.aadhar_no || "", marital_status: s.marital_status || "Single",
      blood_group: s.blood_group || "", father_name: s.father_name || "", mother_name: s.mother_name || "",
      guardian_name: s.guardian_name || "", father_occupation: s.father_occupation || "",
      parent_phone: s.parent_phone || "", parent_email: s.parent_email || "",
      current_address: s.current_address || "", current_city: s.current_city || "",
      current_state: s.current_state || "", current_pincode: s.current_pincode || "",
      permanent_address: s.permanent_address || "", permanent_city: s.permanent_city || "",
      permanent_state: s.permanent_state || "", permanent_pincode: s.permanent_pincode || "",
      tenth_board: s.tenth_board || "", tenth_year: s.tenth_year || "",
      tenth_percentage: s.tenth_percentage || "", tenth_school: s.tenth_school || "",
      twelfth_board: s.twelfth_board || "", twelfth_year: s.twelfth_year || "",
      twelfth_percentage: s.twelfth_percentage || "", twelfth_school: s.twelfth_school || "",
      graduation_degree: s.graduation_degree || "", graduation_university: s.graduation_university || "",
      graduation_year: s.graduation_year || "", graduation_percentage: s.graduation_percentage || "",
      disability: s.disability || "No", hostel_required: s.hostel_required || "No", transport_required: s.transport_required || "No",
      total_fees: (s as any).total_fees ? String((s as any).total_fees) : "",
    });
    setEditStudent(s); setFormStep(1);
  };

  const totalPages = Math.ceil(total / 20);
  const pendingCount = students.filter(s => s.status === "pending").length;
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inp = (k: string, l: string, t = "text") => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
      <input type={t} value={(form as Record<string, string>)[k] || ""} onChange={(e) => set(k, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
    </div>
  );
  const slct = (k: string, l: string, opts: string[]) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
      <select value={(form as Record<string, string>)[k] || ""} onChange={(e) => set(k, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
        <option value="">Select</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const handleStatusChange = async (studentId: number, newStatus: string) => {
    try {
      await api.post(`/api/students/${studentId}/change-status`, { status: newStatus });
      load();
      setStatusDropdown(null);
    } catch { /* empty */ }
  };

  const getStatusColor = (status: string) => {
    const cat = statusCategories.find(c => c.name.toLowerCase() === status.toLowerCase());
    if (cat) return cat.color;
    const fallback: Record<string, string> = { active: "#22C55E", pending: "#F59E0B", rejected: "#EF4444", transferred: "#06B6D4", inactive: "#6B7280", approved: "#3B82F6", completed: "#8B5CF6", deregistered: "#6B7280", problem: "#F97316", "re-registered": "#10B981" };
    return fallback[status] || "#6B7280";
  };

  const statusBadge = (status: string) => {
    const color = getStatusColor(status);
    return <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: color + "20", color: color }}>{status}</span>;
  };

  // Form steps for add/edit
  const formContent = () => (
    <div className="space-y-4">
      {formStep === 1 && (
        <>
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Account & Basic Info</h3>
          {!editStudent && (
            <div className="grid grid-cols-1 gap-3">
              {inp("password", "Password *", "password")}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {inp("name", "Full Name *")}
            {inp("phone", "Mobile Number *")}
          </div>
          {inp("email", "Email", "email")}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">University</label>
              <select value={form.university_id} onChange={(e) => set("university_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                <option value="">Select</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <label className="block text-xs font-medium text-green-800 mb-1 flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Total Fees (₹)</label>
            <input type="number" value={(form as Record<string, string>).total_fees || ""} onChange={(e) => set("total_fees", e.target.value)}
              placeholder="Enter total fees amount" className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white" />
          </div>
        </>
      )}
      {formStep === 2 && (
        <>
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Personal Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {inp("date_of_birth", "Date of Birth", "date")}
            {slct("gender", "Gender", ["Male", "Female", "Other"])}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {slct("category_type", "Category", ["General", "OBC", "SC", "ST", "EWS"])}
            {inp("nationality", "Nationality")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("aadhar_no", "Aadhar Number")}
            {slct("marital_status", "Marital Status", ["Single", "Married", "Other"])}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {slct("blood_group", "Blood Group", ["A+","A-","B+","B-","AB+","AB-","O+","O-"])}
            {slct("disability", "Disability", ["No", "Yes"])}
          </div>
        </>
      )}
      {formStep === 3 && (
        <>
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Family Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {inp("father_name", "Father's Name")}
            {inp("mother_name", "Mother's Name")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("guardian_name", "Guardian Name")}
            {inp("father_occupation", "Father's Occupation")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("parent_phone", "Parent Phone")}
            {inp("parent_email", "Parent Email", "email")}
          </div>
        </>
      )}
      {formStep === 4 && (
        <>
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Address</h3>
          {inp("current_address", "Current Address")}
          <div className="grid grid-cols-3 gap-3">
            {inp("current_city", "City")}
            {slct("current_state", "State", INDIAN_STATES)}
            {inp("current_pincode", "Pincode")}
          </div>
          {inp("permanent_address", "Permanent Address")}
          <div className="grid grid-cols-3 gap-3">
            {inp("permanent_city", "City")}
            {slct("permanent_state", "State", INDIAN_STATES)}
            {inp("permanent_pincode", "Pincode")}
          </div>
        </>
      )}
      {formStep === 5 && (
        <>
          <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Education</h3>
          <div className="grid grid-cols-2 gap-3">
            {inp("tenth_board", "10th Board")}
            {inp("tenth_school", "10th School")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("tenth_year", "10th Year")}
            {inp("tenth_percentage", "10th %")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("twelfth_board", "12th Board")}
            {inp("twelfth_school", "12th School")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("twelfth_year", "12th Year")}
            {inp("twelfth_percentage", "12th %")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("graduation_degree", "Graduation Degree")}
            {inp("graduation_university", "Grad University")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp("graduation_year", "Grad Year")}
            {inp("graduation_percentage", "Grad %")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {slct("hostel_required", "Hostel Required", ["No", "Yes"])}
            {slct("transport_required", "Transport Required", ["No", "Yes"])}
          </div>
        </>
      )}

      {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

      <div className="flex items-center justify-between pt-3 border-t">
        {formStep > 1 ? (
          <button onClick={() => setFormStep(formStep - 1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Back</button>
        ) : <div />}
        {formStep < 5 ? (
          <button onClick={() => setFormStep(formStep + 1)} className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700">Next</button>
        ) : (
          <button onClick={editStudent ? handleEditSave : handleAdminAdd} className="px-6 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700">
            {editStudent ? "Save Changes" : "Add Student"}
          </button>
        )}
      </div>
    </div>
  );

  const centerTotalPages = Math.ceil(centerTotal / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          {pendingCount > 0 && <p className="text-sm text-amber-600 font-medium">{pendingCount} pending approval</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleCSV} className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download className="h-4 w-4" /> CSV
          </button>
          {activeTab === "direct" && (
            <button onClick={() => { setShowForm(true); setForm(emptyForm); setFormStep(1); setFormError(""); }} className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              <Plus className="h-4 w-4" /> Add Student
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab("direct")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "direct" ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-900"}`}>
          <User className="h-4 w-4" /> Direct Students ({total})
        </button>
        <button onClick={() => setActiveTab("center")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "center" ? "bg-white shadow-sm text-green-700" : "text-gray-600 hover:text-gray-900"}`}>
          <Building2 className="h-4 w-4" /> Center Students ({centerTotal})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search name, email, phone..." value={activeTab === "direct" ? search : centerSearch} onChange={(e) => activeTab === "direct" ? setSearch(e.target.value) : setCenterSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        {activeTab === "center" && (
          <select value={filterCenter} onChange={(e) => { setFilterCenter(e.target.value); setCenterPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
            <option value="">All Centers</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select value={filterUni} onChange={(e) => { setFilterUni(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
          <option value="">All Universities</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm hidden sm:block">
          <option value="">All Courses</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm">
          <option value="">All Status</option>
          {statusCategories.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
          {statusCategories.length === 0 && <><option value="pending">Pending</option><option value="active">Active</option><option value="rejected">Rejected</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option></>}
        </select>
      </div>

      {activeTab === "direct" && (
        <>
          {/* CSV Date Filters */}
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 text-xs">CSV Date Filter:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-xs" />
            <span className="text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-xs" />
          </div>

          {/* Direct Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Student (Mobile = ID)</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden md:table-cell">University</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden lg:table-cell">Course</th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden md:table-cell">Fees</th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden md:table-cell">Deposit</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className={`hover:bg-gray-50 ${s.status === "pending" ? "bg-amber-50/50" : ""}`}>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {s.photo ? (
                          <img src={s.photo.startsWith("/") ? API + s.photo : s.photo} alt={s.name} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-blue-100" />
                        ) : (
                          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-blue-600" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone || "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{s.university_name || "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{s.category_name || "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium hidden md:table-cell">{(s as any).total_fees ? `₹${Number((s as any).total_fees).toLocaleString()}` : "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium hidden md:table-cell">{(s as any).deposit ? <span className="text-green-600">₹{Number((s as any).deposit).toLocaleString()}</span> : "—"}</td>
                    <td className="px-3 sm:px-4 py-3 relative">
                      <div className="flex items-center gap-1">
                        {statusBadge(s.status)}
                        <button onClick={(e) => { e.stopPropagation(); setStatusDropdown(statusDropdown === s.id ? null : s.id); }} title="Change Status" className="p-0.5 text-gray-400 hover:text-blue-600"><RefreshCw className="h-3 w-3" /></button>
                      </div>
                      {statusDropdown === s.id && (
                        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[180px] max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Change Status</div>
                          {statusCategories.map(sc => (
                            <button key={sc.id} onClick={() => handleStatusChange(s.id, sc.name)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${s.status === sc.name ? "bg-blue-50 font-medium" : ""}`}>
                              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: sc.color }} />
                              {sc.name}
                              {s.status === sc.name && <span className="ml-auto text-blue-500 text-xs">current</span>}
                            </button>
                          ))}
                          {statusCategories.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No categories configured</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      {s.status === "pending" && (
                        <>
                          <button onClick={() => handleApprove(s.id)} title="Approve" className="p-1 sm:p-1.5 text-green-500 hover:text-green-700"><CheckCircle className="h-4 w-4" /></button>
                          <button onClick={() => handleReject(s.id)} title="Reject" className="p-1 sm:p-1.5 text-red-400 hover:text-red-600"><XCircle className="h-4 w-4" /></button>
                        </>
                      )}
                      <button onClick={() => { setShowDetail(s); loadStudentDocs(s.id); }} title="View" className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openCredentials(s)} title="Edit Login" className="p-1 sm:p-1.5 text-gray-400 hover:text-amber-600"><Key className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(s)} title="Edit" className="p-1 sm:p-1.5 text-gray-400 hover:text-indigo-600"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id)} title="Delete" className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && <div className="p-8 text-center text-gray-500">No students found</div>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Previous</button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Center Students Tab */}
      {activeTab === "center" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Student (Mobile = ID)</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Center</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden md:table-cell">University</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden lg:table-cell">Course</th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 hidden md:table-cell">Fees</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {centerStudents.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {s.photo ? (
                          <img src={s.photo.startsWith("/") ? API + s.photo : s.photo} alt={s.name} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-green-100" />
                        ) : (
                          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-green-600" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone || "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{s.center_name || "—"}</span>
                        {s.parent_center_name && <p className="text-xs text-gray-400 mt-0.5">Sub of: {s.parent_center_name}</p>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{s.university_name || "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{s.category_name || "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-right font-medium hidden md:table-cell">{s.total_fees ? `₹${Number(s.total_fees).toLocaleString()}` : "—"}</td>
                    <td className="px-3 sm:px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => { setShowDetail(s); loadStudentDocs(s.id); }} title="View" className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(s)} title="Edit" className="p-1 sm:p-1.5 text-gray-400 hover:text-indigo-600"><Edit3 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {centerStudents.length === 0 && <div className="p-8 text-center text-gray-500">No center students found</div>}
          </div>

          {centerTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {centerPage} of {centerTotalPages}</p>
              <div className="flex gap-2">
                <button disabled={centerPage <= 1} onClick={() => setCenterPage(centerPage - 1)} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Previous</button>
                <button disabled={centerPage >= centerTotalPages} onClick={() => setCenterPage(centerPage + 1)} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Student Details</h2>
              <div className="flex items-center gap-2">
                {showDetail.status === "pending" && (
                  <>
                    <button onClick={() => { handleApprove(showDetail.id); setShowDetail(null); }} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg">Approve</button>
                    <button onClick={() => { handleReject(showDetail.id); setShowDetail(null); }} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg">Reject</button>
                  </>
                )}
                <button onClick={() => { openEdit(showDetail); setShowDetail(null); }} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg">Edit</button>
                <button onClick={() => setShowDetail(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-5 pb-4 border-b">
              {showDetail.photo ? (
                <img src={showDetail.photo.startsWith("/") ? API + showDetail.photo : showDetail.photo} alt={showDetail.name} className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4 border-blue-100" />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center justify-center"><User className="h-8 w-8 text-blue-400" /></div>
              )}
              <div>
                <h3 className="text-lg font-bold">{showDetail.name}</h3>
                <p className="text-sm text-gray-500">{showDetail.email} {showDetail.phone && `• ${showDetail.phone}`}</p>
                {statusBadge(showDetail.status)}
              </div>
            </div>

            {/* Fees Info */}
            {(showDetail as any).total_fees > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1"><IndianRupee className="h-4 w-4" /> Fee Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-400 text-xs">Total Fees</span><p className="font-bold text-lg text-gray-900">₹{((showDetail as any).total_fees || 0).toLocaleString()}</p></div>
                </div>
              </div>
            )}

            <h4 className="text-sm font-semibold text-blue-700 mb-2">Personal Information</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
              {[["University", showDetail.university_name], ["Course", showDetail.category_name], ["Enrollment", showDetail.enrollment_no], ["DOB", showDetail.date_of_birth], ["Gender", showDetail.gender], ["Category", showDetail.category_type], ["Nationality", showDetail.nationality], ["Aadhar", showDetail.aadhar_no], ["Blood Group", showDetail.blood_group]].filter(([,v]) => v).map(([l,v]) => (
                <div key={l}><span className="text-gray-400 text-xs">{l}</span><p className="font-medium">{v}</p></div>
              ))}
            </div>

            {(showDetail.father_name || showDetail.mother_name) && (
              <>
                <h4 className="text-sm font-semibold text-pink-700 mb-2">Family Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
                  {[["Father", showDetail.father_name], ["Mother", showDetail.mother_name], ["Guardian", showDetail.guardian_name], ["Occupation", showDetail.father_occupation], ["Parent Phone", showDetail.parent_phone]].filter(([,v]) => v).map(([l,v]) => (
                    <div key={l}><span className="text-gray-400 text-xs">{l}</span><p className="font-medium">{v}</p></div>
                  ))}
                </div>
              </>
            )}

            {showDetail.current_address && (
              <>
                <h4 className="text-sm font-semibold text-green-700 mb-2">Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div><span className="text-gray-400 text-xs">Current</span><p className="font-medium">{showDetail.current_address}, {showDetail.current_city}, {showDetail.current_state} {showDetail.current_pincode}</p></div>
                  {showDetail.permanent_address && <div><span className="text-gray-400 text-xs">Permanent</span><p className="font-medium">{showDetail.permanent_address}, {showDetail.permanent_city}, {showDetail.permanent_state} {showDetail.permanent_pincode}</p></div>}
                </div>
              </>
            )}

            {(showDetail.tenth_percentage || showDetail.twelfth_percentage) && (
              <>
                <h4 className="text-sm font-semibold text-purple-700 mb-2">Education</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
                  {[["10th Board", showDetail.tenth_board], ["10th %", showDetail.tenth_percentage], ["10th School", showDetail.tenth_school], ["12th Board", showDetail.twelfth_board], ["12th %", showDetail.twelfth_percentage], ["12th School", showDetail.twelfth_school], ["Degree", showDetail.graduation_degree], ["Grad %", showDetail.graduation_percentage]].filter(([,v]) => v).map(([l,v]) => (
                    <div key={l}><span className="text-gray-400 text-xs">{l}</span><p className="font-medium">{v}</p></div>
                  ))}
                </div>
              </>
            )}

            {/* Documents */}
            <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1"><FileText className="h-4 w-4" /> Documents</h4>
            {studentDocs.length > 0 ? (
              <div className="space-y-2 mb-4">
                {studentDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <div>
                      <p className="text-sm font-medium capitalize">{d.doc_type?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-500">{d.status} - {d.created_at?.split("T")[0]}</p>
                    </div>
                    {d.file_path && <a href={API + d.file_path} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">View File</a>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-4">No documents uploaded</p>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Student (with Login)</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="flex gap-1 mb-4">
              {["Basic", "Personal", "Family", "Address", "Education"].map((n, i) => (
                <button key={n} onClick={() => setFormStep(i + 1)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${formStep === i + 1 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>{n}</button>
              ))}
            </div>
            {formContent()}
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Key className="h-5 w-5 text-amber-500" /> Edit Login Credentials</h2>
              <button onClick={() => setCredModal(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Login ID)</label>
                <input type="text" value={credForm.username} onChange={(e) => setCredForm({ ...credForm, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="text" value={credForm.password} onChange={(e) => setCredForm({ ...credForm, password: e.target.value })} placeholder="Leave empty to keep current" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
              </div>
              <button onClick={saveCredentials} className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 text-sm">Update Credentials</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Student: {editStudent.name}</h2>
              <button onClick={() => { setEditStudent(null); setFormStep(1); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="flex gap-1 mb-4">
              {["Basic", "Personal", "Family", "Address", "Education"].map((n, i) => (
                <button key={n} onClick={() => setFormStep(i + 1)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${formStep === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>{n}</button>
              ))}
            </div>
            {formContent()}
          </div>
        </div>
      )}
    </div>
  );
}
