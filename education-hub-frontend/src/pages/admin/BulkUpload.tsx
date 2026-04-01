import { useState, useEffect } from "react";
import { Upload, Download, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import api from "../../lib/api";

export default function BulkUpload() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [, setCsvData] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState("");
  const [selectedUni, setSelectedUni] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    api.get("/api/universities").then(r => setUniversities(r.data || [])).catch(() => {});
    api.get("/api/categories").then(r => setCourses(r.data || [])).catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvData(text);
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (preview.length === 0) { alert("No data to upload"); return; }
    setUploading(true);
    setResult("");
    try {
      const students = preview.map(row => {
        const student: any = { ...row };
        if (selectedUni) student.university_id = parseInt(selectedUni);
        if (selectedCourse) student.category_id = parseInt(selectedCourse);
        if (!student.name && row.student_name) student.name = row.student_name;
        if (!student.phone && row.mobile) student.phone = row.mobile;
        if (!student.session_name && row.session) student.session_name = row.session;
        if (!student.admission_type) student.admission_type = "FRESH_ADMISSION";
        return student;
      });
      const res = await api.post("/api/students/bulk-upload", { students });
      setResult(res.data.message || "Upload successful!");
      setPreview([]);
      setCsvData("");
    } catch (err: any) {
      setResult("Error: " + (err.response?.data?.detail || "Upload failed"));
    }
    setUploading(false);
  };

  const downloadTemplate = () => {
    const headers = "name,email,phone,date_of_birth,gender,category_type,nationality,aadhar_no,marital_status,father_name,mother_name,guardian_name,father_occupation,parent_phone,parent_email,current_address,current_city,current_state,current_pincode,permanent_address,permanent_city,permanent_state,permanent_pincode,tenth_board,tenth_year,tenth_percentage,tenth_school,twelfth_board,twelfth_year,twelfth_percentage,twelfth_school,graduation_university,graduation_year,graduation_percentage,graduation_degree,post_graduation_university,post_graduation_year,post_graduation_percentage,post_graduation_degree,blood_group,disability,hostel_required,transport_required,admission_type,session_name";
    const sample = "Rahul Sharma,rahul@email.com,9876543210,2000-01-15,Male,General,Indian,123456789012,Single,Mr. Sharma,Mrs. Sharma,,Business,9876543211,parent@email.com,123 Street,Jaipur,Rajasthan,302001,123 Street,Jaipur,Rajasthan,302001,CBSE,2016,85.5,Delhi Public School,CBSE,2018,78.2,St. Xavier School,,,,,,,,,,B+,No,No,No,FRESH_ADMISSION,February-2026";
    const blob = new Blob([headers + "\n" + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "student_bulk_upload_template.csv"; a.click();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Bulk Upload</h1>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          <Download className="h-4 w-4" /> Download Template
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select value={selectedUni} onChange={e => setSelectedUni(e.target.value)} className="px-3 py-2.5 border rounded-lg text-sm">
            <option value="">Select University (for all)</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="px-3 py-2.5 border rounded-lg text-sm">
            <option value="">Select Course (for all)</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">Upload a CSV file with student data</p>
          <p className="text-xs text-gray-400 mb-4">Supported: .csv files | Headers: name, email, phone, father_name, etc.</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700">
            <Upload className="h-4 w-4" /> Choose File
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${result.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {result.startsWith("Error") ? <AlertCircle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          {result}
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Preview ({preview.length} students)</h3>
            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload All"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Father Name</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{row.name || row.student_name}</td>
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2">{row.phone || row.mobile}</td>
                    <td className="px-4 py-2">{row.father_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 20 && <p className="p-3 text-center text-sm text-gray-500">...and {preview.length - 20} more</p>}
        </div>
      )}
    </div>
  );
}
