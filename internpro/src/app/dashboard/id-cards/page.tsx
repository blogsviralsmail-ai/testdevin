"use client";

import { useState, useEffect, useCallback } from "react";

interface EmployeeCard {
  id: string;
  cardNumber: string;
  designation: string;
  department: string | null;
  validFrom: string;
  validUntil: string;
  photoUrl: string | null;
  qrCode: string | null;
  user: { id: string; name: string; email: string; phone: string | null; avatar: string | null; collegeName: string | null };
}

interface Enrollment {
  id: string;
  student: { id: string; name: string; email: string; avatar: string | null };
  batch: { name: string; program: { title: string } };
}

interface UserSession {
  id: string;
  role: string;
}

export default function IDCardsPage() {
  const [cards, setCards] = useState<EmployeeCard[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({ userId: "", designation: "Intern", department: "", photoUrl: "" });
  const [previewCard, setPreviewCard] = useState<EmployeeCard | null>(null);

  const fetchData = useCallback(async () => {
    const [cardsRes, enrollRes, meRes] = await Promise.all([
      fetch("/api/employee-cards"),
      fetch("/api/enrollments?status=selected"),
      fetch("/api/auth/me"),
    ]);
    if (cardsRes.ok) setCards(await cardsRes.json());
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/employee-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generateForm),
    });
    if (res.ok) {
      setShowGenerate(false);
      setGenerateForm({ userId: "", designation: "Intern", department: "", photoUrl: "" });
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to generate ID card");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setGenerateForm((prev) => ({ ...prev, photoUrl: data.url }));
    }
  };

  const handlePrint = (card: EmployeeCard) => {
    let qrData: Record<string, string> = { company: "InternPro", name: "", designation: "", cardNumber: "", email: "" };
    try { qrData = JSON.parse(card.qrCode || "{}"); } catch { /* ignore */ }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${card.user.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #e0e0e0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 15px; }
  .no-print { display: flex; gap: 10px; }
  .no-print button { padding: 8px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
  .btn-print { background: #0000AA; color: white; }
  .btn-print:hover { background: #000088; }
  .btn-pdf { background: #d32f2f; color: white; }
  .btn-pdf:hover { background: #b71c1c; }
  .card { width: 324px; height: 204px; border-radius: 10px; overflow: hidden; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.15); position: relative; border: 1px solid #ccc; }
  .card-header { background: #0000AA; height: 52px; display: flex; align-items: center; justify-content: center; flex-direction: column; position: relative; }
  .card-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #d32f2f; }
  .card-header img { height: 30px; }
  .card-header .co-name { color: white; font-size: 7px; margin-top: 2px; letter-spacing: 0.5px; opacity: 0.8; }
  .card-content { display: flex; padding: 10px 14px; gap: 12px; height: 116px; }
  .photo-col { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .photo-frame { width: 70px; height: 70px; border-radius: 6px; border: 2px solid #0000AA; overflow: hidden; background: #f0f0f8; display: flex; align-items: center; justify-content: center; }
  .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
  .photo-frame .placeholder { font-size: 28px; color: #0000AA; }
  .info-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .emp-name { font-size: 14px; font-weight: 800; color: #0000AA; text-transform: uppercase; line-height: 1.2; }
  .emp-desg { font-size: 10px; color: #d32f2f; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
  .emp-info { font-size: 9px; color: #555; margin-top: 6px; line-height: 1.5; }
  .card-footer { background: #0000AA; height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; }
  .card-num { font-size: 9px; font-weight: 700; color: white; letter-spacing: 1px; }
  .valid-txt { font-size: 8px; color: rgba(255,255,255,0.7); }
  @media print { body { background: white; } .no-print { display: none !important; } .card { box-shadow: none; border: 1px solid #999; } }
</style></head><body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">Print</button>
  <button class="btn-pdf" onclick="window.print()">Download PDF</button>
</div>
<div class="card">
  <div class="card-header">
    <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS Media" />
    <div class="co-name">KKHS MEDIA PVT. LTD.</div>
  </div>
  <div class="card-content">
    <div class="photo-col">
      <div class="photo-frame">${card.photoUrl ? `<img src="${card.photoUrl}" />` : `<span class="placeholder">👤</span>`}</div>
    </div>
    <div class="info-col">
      <div class="emp-name">${card.user.name}</div>
      <div class="emp-desg">${card.designation}${card.department ? ` | ${card.department}` : ""}</div>
      <div class="emp-info">
        ${card.user.email}<br/>
        ${card.user.phone ? card.user.phone + "<br/>" : ""}
        ${card.user.collegeName ? card.user.collegeName : ""}
      </div>
    </div>
  </div>
  <div class="card-footer">
    <div class="card-num">${card.cardNumber}</div>
    <div class="valid-txt">Valid: ${new Date(card.validFrom).toLocaleDateString("en-IN")} — ${new Date(card.validUntil).toLocaleDateString("en-IN")}</div>
  </div>
</div>
</body></html>`);
    printWindow.document.close();
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isStudent = user?.role === "student";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ID Cards</h1>
          <p className="text-gray-600 text-sm">{isStudent ? "Your employee ID card" : "Generate and manage employee ID cards"}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowGenerate(!showGenerate)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            {showGenerate ? "Cancel" : "+ Generate ID Card"}
          </button>
        )}
      </div>

      {isAdmin && showGenerate && (
        <form onSubmit={handleGenerate} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New ID Card</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Student</label>
              <select value={generateForm.userId} onChange={(e) => setGenerateForm({ ...generateForm, userId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" required>
                <option value="">Choose student...</option>
                {enrollments.map((e) => (
                  <option key={e.student.id} value={e.student.id}>{e.student.name} — {e.batch.program.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
              <input value={generateForm.designation} onChange={(e) => setGenerateForm({ ...generateForm, designation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Intern" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department (optional)</label>
              <input value={generateForm.department} onChange={(e) => setGenerateForm({ ...generateForm, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Web Development" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
              {generateForm.photoUrl && <p className="text-xs text-green-600 mt-1">Photo uploaded!</p>}
            </div>
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Generate ID Card
          </button>
        </form>
      )}

      {/* Preview Modal */}
      {previewCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">ID Card Preview</h3>
            {/* Standard card size preview */}
            <div className="mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-300" style={{ width: "324px", height: "204px" }}>
              {/* Header: Logo + small company name */}
              <div className="bg-[#0000AA] h-[52px] flex flex-col items-center justify-center relative">
                <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS" className="h-[30px]" />
                <div className="text-white text-[7px] mt-0.5 tracking-wide opacity-80">KKHS MEDIA PVT. LTD.</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-600"></div>
              </div>
              {/* Content: Photo left, Info right */}
              <div className="flex gap-3 p-2.5 bg-white" style={{ height: "116px" }}>
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="w-[70px] h-[70px] rounded-md border-2 border-[#0000AA] overflow-hidden bg-blue-50 flex items-center justify-center">
                    {previewCard.photoUrl ? <img src={previewCard.photoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl">👤</span>}
                  </div>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="text-sm font-extrabold text-[#0000AA] uppercase leading-tight truncate">{previewCard.user.name}</div>
                  <div className="text-[10px] text-red-600 font-bold uppercase mt-0.5">{previewCard.designation}{previewCard.department ? ` | ${previewCard.department}` : ""}</div>
                  <div className="text-[9px] text-gray-500 mt-1.5 leading-relaxed">
                    {previewCard.user.email}<br />
                    {previewCard.user.phone && <>{previewCard.user.phone}<br /></>}
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="bg-[#0000AA] h-[36px] flex items-center justify-between px-3.5">
                <div className="text-[9px] font-bold text-white tracking-wider">{previewCard.cardNumber}</div>
                <div className="text-[8px] text-white/70">Valid: {new Date(previewCard.validFrom).toLocaleDateString("en-IN")} — {new Date(previewCard.validUntil).toLocaleDateString("en-IN")}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handlePrint(previewCard)} className="flex-1 bg-[#0000AA] text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-900">Print</button>
              <button onClick={() => handlePrint(previewCard)} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">Download PDF</button>
              <button onClick={() => setPreviewCard(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-4xl mb-4">🪪</p>
          <p className="text-gray-600">{isStudent ? "Your ID card has not been generated yet." : "No ID cards generated yet."}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl border hover:shadow-md transition overflow-hidden">
              <div className="bg-[#0000AA] text-white p-2.5 flex items-center justify-center gap-2 relative">
                <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS" className="h-6" />
                <span className="text-[9px] text-white/80">KKHS MEDIA PVT. LTD.</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600"></div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-md border-2 border-[#0000AA] flex-shrink-0 bg-blue-50 flex items-center justify-center text-2xl overflow-hidden">
                  {card.photoUrl ? <img src={card.photoUrl} className="w-full h-full object-cover" alt="" /> : "👤"}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#0000AA] text-sm uppercase truncate">{card.user.name}</div>
                  <div className="text-[10px] text-red-600 font-bold uppercase">{card.designation}</div>
                  {card.department && <div className="text-[10px] text-gray-500">{card.department}</div>}
                  <div className="text-[9px] text-gray-400 mt-1">{card.cardNumber}</div>
                </div>
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <button onClick={() => setPreviewCard(card)} className="flex-1 text-xs bg-blue-50 text-[#0000AA] px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">View</button>
                <button onClick={() => handlePrint(card)} className="flex-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium">Print</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
