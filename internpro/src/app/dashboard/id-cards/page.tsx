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
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f0f0; }
  .card { width: 350px; border-radius: 14px; overflow: hidden; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15); position: relative; }
  .card-top { background: #1a237e; padding: 18px 20px 14px; position: relative; }
  .card-top::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: #d32f2f; }
  .logo-row { display: flex; align-items: center; gap: 10px; }
  .logo-row img { height: 40px; background: white; padding: 3px; border-radius: 4px; }
  .logo-row h2 { margin: 0; color: white; font-size: 16px; letter-spacing: 1.5px; font-weight: 700; }
  .logo-row p { margin: 2px 0 0; color: rgba(255,255,255,0.7); font-size: 9px; }
  .card-body { background: white; padding: 22px 20px; text-align: center; position: relative; }
  .card-body::before { content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: linear-gradient(to bottom, #1a237e, #d32f2f); }
  .card-body::after { content: ''; position: absolute; top: 0; right: 0; width: 6px; height: 100%; background: linear-gradient(to bottom, #d32f2f, #1a237e); }
  .photo { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #1a237e; margin: 0 auto 12px; object-fit: cover; background: #e8eaf6; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #1a237e; overflow: hidden; }
  .photo img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .name { font-size: 20px; font-weight: 800; color: #1a237e; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
  .designation { font-size: 13px; color: #d32f2f; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; }
  .info-row { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 5px 0; font-size: 11px; color: #555; }
  .card-bottom { background: #1a237e; padding: 10px 20px; text-align: center; }
  .card-number { font-size: 13px; font-weight: 700; color: white; letter-spacing: 2px; }
  .valid { font-size: 9px; color: rgba(255,255,255,0.7); margin-top: 3px; }
  @media print { body { padding: 0; background: white; } .card { box-shadow: none; } }
</style></head><body>
<div class="card">
  <div class="card-top">
    <div class="logo-row">
      <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS" />
      <div>
        <h2>KKHS MEDIA PVT. LTD.</h2>
        <p>190A Krishna Kunj, Kalwar Road, Jaipur 302012</p>
      </div>
    </div>
  </div>
  <div class="card-body">
    <div class="photo">${card.photoUrl ? `<img src="${card.photoUrl}" />` : "👤"}</div>
    <div class="name">${card.user.name}</div>
    <div class="designation">${card.designation}${card.department ? ` | ${card.department}` : ""}</div>
    <div class="info-row">📧 ${card.user.email}</div>
    ${card.user.phone ? `<div class="info-row">📱 ${card.user.phone}</div>` : ""}
    ${card.user.collegeName ? `<div class="info-row">🎓 ${card.user.collegeName}</div>` : ""}
  </div>
  <div class="card-bottom">
    <div class="card-number">${card.cardNumber}</div>
    <div class="valid">Valid: ${new Date(card.validFrom).toLocaleDateString("en-IN")} — ${new Date(card.validUntil).toLocaleDateString("en-IN")}</div>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <div className="bg-[#1a237e] p-4 relative">
                <div className="flex items-center gap-3">
                  <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS" className="h-10 bg-white p-1 rounded" />
                  <div>
                    <h2 className="text-white font-bold text-sm tracking-wider">KKHS MEDIA PVT. LTD.</h2>
                    <p className="text-white/60 text-[9px]">190A Krishna Kunj, Kalwar Road, Jaipur</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
              </div>
              <div className="bg-white p-6 text-center relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#1a237e] to-red-600"></div>
                <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-red-600 to-[#1a237e]"></div>
                <div className="w-24 h-24 rounded-full border-4 border-[#1a237e] mx-auto mb-3 bg-indigo-50 flex items-center justify-center text-4xl overflow-hidden">
                  {previewCard.photoUrl ? <img src={previewCard.photoUrl} className="w-full h-full object-cover rounded-full" alt="" /> : "👤"}
                </div>
                <div className="text-xl font-extrabold text-[#1a237e] uppercase tracking-wide">{previewCard.user.name}</div>
                <div className="text-sm text-red-600 font-bold uppercase mt-1">{previewCard.designation}{previewCard.department ? ` | ${previewCard.department}` : ""}</div>
                <div className="text-xs text-gray-500 mt-3">{previewCard.user.email}</div>
                {previewCard.user.phone && <div className="text-xs text-gray-500">{previewCard.user.phone}</div>}
              </div>
              <div className="bg-[#1a237e] p-3 text-center">
                <div className="text-xs font-bold text-white tracking-widest">{previewCard.cardNumber}</div>
                <div className="text-[9px] text-white/60 mt-1">Valid: {new Date(previewCard.validFrom).toLocaleDateString("en-IN")} — {new Date(previewCard.validUntil).toLocaleDateString("en-IN")}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handlePrint(previewCard)} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Print</button>
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
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 text-white p-3 text-center">
                <div className="text-sm font-bold">
                  {(() => { try { return (JSON.parse(card.qrCode || "{}") as Record<string, string>).company; } catch { return "InternPro"; } })()}
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-600 mx-auto mb-2 bg-gray-200 flex items-center justify-center text-2xl overflow-hidden">
                  {card.photoUrl ? <img src={card.photoUrl} className="w-full h-full object-cover rounded-full" alt="" /> : "👤"}
                </div>
                <div className="font-bold text-gray-900">{card.user.name}</div>
                <div className="text-xs text-indigo-600 font-medium">{card.designation}</div>
                {card.department && <div className="text-xs text-gray-500">{card.department}</div>}
                <div className="text-[10px] text-gray-400 mt-2">{card.cardNumber}</div>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={() => setPreviewCard(card)} className="flex-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">View</button>
                <button onClick={() => handlePrint(card)} className="flex-1 text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">Print</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
