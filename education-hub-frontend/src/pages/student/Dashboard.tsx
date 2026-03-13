import { useState, useEffect } from "react";
import api, { getUser } from "../../lib/api";
import { GraduationCap, FileText, LifeBuoy, Wallet, Loader2, Clock, CheckCircle, User, MapPin, BookOpen, Heart, Upload, Eye, IndianRupee } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface StudentInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
  university_name: string;
  category_name: string;
  status: string;
  enrollment_no: string;
  session: string;
  created_at: string;
  date_of_birth: string;
  gender: string;
  category_type: string;
  nationality: string;
  aadhar_no: string;
  marital_status: string;
  blood_group: string;
  father_name: string;
  mother_name: string;
  guardian_name: string;
  father_occupation: string;
  parent_phone: string;
  parent_email: string;
  current_address: string;
  current_city: string;
  current_state: string;
  current_pincode: string;
  permanent_address: string;
  permanent_city: string;
  permanent_state: string;
  permanent_pincode: string;
  tenth_board: string;
  tenth_year: string;
  tenth_percentage: string;
  tenth_school: string;
  twelfth_board: string;
  twelfth_year: string;
  twelfth_percentage: string;
  twelfth_school: string;
  graduation_university: string;
  graduation_year: string;
  graduation_percentage: string;
  graduation_degree: string;
  disability: string;
  hostel_required: string;
  transport_required: string;
}

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: string;
  created_at: string;
}

interface Transaction {
  id: number;
  amount: number;
  transaction_type: string;
  payment_mode: string;
  created_at: string;
}

interface StudentDoc {
  id: number;
  doc_type: string;
  file_path: string;
  status: string;
  created_at: string;
}

export default function StudentDashboard() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [documents, setDocuments] = useState<StudentDoc[]>([]);
  const [feeSummary, setFeeSummary] = useState<{total_fees: number; paid: number; pending: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("marksheet");
  const user = getUser();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [studentRes, ticketsRes, transRes, docsRes, feesRes] = await Promise.allSettled([
        api.get("/api/students/me"),
        api.get("/api/support/tickets"),
        api.get("/api/accounts/transactions"),
        api.get("/api/documents"),
        api.get("/api/accounts/my-fees"),
      ]);
      if (studentRes.status === "fulfilled") {
        const studentData = studentRes.value.data;
        if (studentData && studentData.id) {
          setStudent(studentData);
        } else if (Array.isArray(studentData) && studentData.length > 0) {
          setStudent(studentData[0]);
        } else if (studentData?.students && studentData.students.length > 0) {
          setStudent(studentData.students[0]);
        }
      }
      if (ticketsRes.status === "fulfilled") {
        setTickets(Array.isArray(ticketsRes.value.data) ? ticketsRes.value.data.slice(0, 5) : []);
      }
      if (transRes.status === "fulfilled") {
        setTransactions(Array.isArray(transRes.value.data) ? transRes.value.data.slice(0, 5) : []);
      }
      if (docsRes.status === "fulfilled") {
        setDocuments(Array.isArray(docsRes.value.data) ? docsRes.value.data : []);
      }
      if (feesRes.status === "fulfilled") {
        setFeeSummary(feesRes.value.data);
      }
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Welcome, {user?.name || "Student"}</h1>

      {/* Pending Status Banner */}
      {student && student.status === "pending" && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Application Under Review</h3>
            <p className="text-sm text-amber-700 mt-1">Your registration is pending approval from the admin. You will get full access once your application is approved. Please make sure all your details are complete and correct.</p>
          </div>
        </div>
      )}

      {student && student.status === "rejected" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-600 font-bold text-xs">!</span>
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Application Rejected</h3>
            <p className="text-sm text-red-700 mt-1">Your registration has been rejected. Please contact the admin or raise a support ticket for more information.</p>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">University</p>
              <p className="text-sm font-semibold">{student?.university_name || "Not Assigned"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Course</p>
              <p className="text-sm font-semibold">{student?.category_name || "Not Assigned"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <LifeBuoy className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Open Tickets</p>
              <p className="text-sm font-semibold">{tickets.filter((t) => t.status === "open").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-semibold capitalize">{student?.status || "Pending"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Summary Card */}
      {feeSummary && feeSummary.total_fees > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Fee Summary</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-blue-200">Total Fees</p>
              <p className="text-lg sm:text-xl font-bold">₹{feeSummary.total_fees.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Paid</p>
              <p className="text-lg sm:text-xl font-bold text-green-300">₹{feeSummary.paid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-amber-300">₹{feeSummary.pending.toLocaleString()}</p>
            </div>
          </div>
          {feeSummary.pending > 0 && (
            <a href="/student/fees" className="mt-3 inline-block text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">Pay Fees Online &rarr;</a>
          )}
        </div>
      )}

      {/* Student Profile Card with Photo */}
      {student && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Photo & Basic Info */}
            <div className="flex flex-col items-center">
              {student.photo ? (
                <img src={student.photo.startsWith("/") ? API + student.photo : student.photo} alt={student.name}
                  className="h-28 w-28 rounded-full object-cover border-4 border-blue-100 shadow" />
              ) : (
                <div className="h-28 w-28 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-50">
                  <User className="h-12 w-12 text-blue-400" />
                </div>
              )}
              <h3 className="text-lg font-bold mt-2">{student.name}</h3>
              <p className="text-xs text-gray-500">{student.enrollment_no || "Enrollment Pending"}</p>
              <span className={"mt-1 text-xs px-2 py-0.5 rounded-full " + (student.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                {student.status || "Pending"}
              </span>
            </div>

            {/* Details Grid */}
            <div className="flex-1 w-full">
              {/* Personal */}
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-800">Personal Details</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {[
                  ["Email", student.email], ["Phone", student.phone], ["DOB", student.date_of_birth],
                  ["Gender", student.gender], ["Category", student.category_type], ["Blood Group", student.blood_group],
                  ["Nationality", student.nationality], ["Aadhar", student.aadhar_no],
                ].filter(([,v]) => v).map(([l,v]) => (
                  <div key={l}><span className="text-xs text-gray-400">{l}</span><p className="text-sm font-medium">{v}</p></div>
                ))}
              </div>

              {/* Family */}
              {(student.father_name || student.mother_name) && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-pink-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Family Details</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {[
                      ["Father", student.father_name], ["Mother", student.mother_name],
                      ["Guardian", student.guardian_name], ["Occupation", student.father_occupation],
                      ["Parent Phone", student.parent_phone],
                    ].filter(([,v]) => v).map(([l,v]) => (
                      <div key={l}><span className="text-xs text-gray-400">{l}</span><p className="text-sm font-medium">{v}</p></div>
                    ))}
                  </div>
                </>
              )}

              {/* Address */}
              {student.current_address && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Address</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <span className="text-xs text-gray-400">Current Address</span>
                      <p className="text-sm">{student.current_address}, {student.current_city}, {student.current_state} {student.current_pincode}</p>
                    </div>
                    {student.permanent_address && (
                      <div>
                        <span className="text-xs text-gray-400">Permanent Address</span>
                        <p className="text-sm">{student.permanent_address}, {student.permanent_city}, {student.permanent_state} {student.permanent_pincode}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Education */}
              {(student.tenth_percentage || student.twelfth_percentage) && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Education</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      ["10th Board", student.tenth_board], ["10th %", student.tenth_percentage],
                      ["10th School", student.tenth_school], ["10th Year", student.tenth_year],
                      ["12th Board", student.twelfth_board], ["12th %", student.twelfth_percentage],
                      ["12th School", student.twelfth_school], ["12th Year", student.twelfth_year],
                      ["Degree", student.graduation_degree], ["Grad %", student.graduation_percentage],
                      ["Grad University", student.graduation_university], ["Grad Year", student.graduation_year],
                    ].filter(([,v]) => v).map(([l,v]) => (
                      <div key={l}><span className="text-xs text-gray-400">{l}</span><p className="text-sm font-medium">{v}</p></div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-orange-600" /> My Documents</h2>
        </div>
        {/* Upload Document */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Upload New Document</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select value={docType} onChange={e => setDocType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="marksheet">Marksheet</option>
              <option value="original_degree">Original Degree</option>
              <option value="transcript">Transcript</option>
              <option value="bonafide_letter">Bonafide Letter</option>
              <option value="aadhar_card">Aadhar Card</option>
              <option value="photo">Photo</option>
              <option value="other">Other</option>
            </select>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Document"}
              <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" disabled={uploading} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const fd = new FormData();
                  fd.append("file", file);
                  const uploadRes = await api.post("/api/documents/upload", fd);
                  const filePath = uploadRes.data.url || uploadRes.data.file_path || "";
                  await api.post("/api/documents", {
                    student_id: student?.id || 0,
                    doc_type: docType,
                    file_path: filePath,
                    status: "pending_review"
                  });
                  loadData();
                } catch { /* empty */ }
                setUploading(false);
              }} />
            </label>
          </div>
        </div>
        {/* Document List */}
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet. Upload your documents above for admin review.</p>
        ) : (
          <div className="space-y-2">
            {documents.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium capitalize">{d.doc_type?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400">{d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (
                    d.status === "approved" ? "bg-green-100 text-green-700" :
                    d.status === "rejected" ? "bg-red-100 text-red-700" :
                    d.status === "pending_review" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    {d.status === "pending_review" ? "Under Review" : d.status === "approved" ? "Approved" : d.status === "rejected" ? "Rejected" : d.status === "office_received" ? "Office Received" : d.status === "online_available" ? "Online Available" : d.status === "dispatched" ? "Dispatched" : d.status === "received" ? "Received" : d.status === "processing" ? "Processing" : d.status === "pending" ? "Pending" : d.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || d.status}
                  </span>
                  {d.file_path && (
                    <a href={API + d.file_path} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Eye className="h-3 w-3" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-gray-500">No tickets yet</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="text-xs text-gray-500">{t.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${t.status === "open" ? "bg-blue-100 text-blue-700" : t.status === "resolved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    {t.transaction_type === "payment" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-orange-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize">{t.transaction_type}</p>
                      <p className="text-xs text-gray-500">{t.payment_mode}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">&#8377;{t.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
