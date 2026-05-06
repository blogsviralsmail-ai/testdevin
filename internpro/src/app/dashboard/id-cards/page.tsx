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
  user: { id: string; name: string; email: string; phone: string | null; avatar: string | null; collegeName: string | null; address: string | null };
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

  // Portrait ID card: 50mm x 85mm = 189px x 321px at 96dpi
  const handlePrint = (card: EmployeeCard) => {
    const photoSrc = card.user.avatar || card.photoUrl || "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${card.user.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 50mm 85mm; margin: 0; }
  body { font-family: 'Segoe UI', 'Calibri', Arial, sans-serif; background: #e8e8e8; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 16px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  .no-print { display: flex; gap: 10px; }
  .no-print button { padding: 10px 28px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
  .btn-print { background: #0000AA; color: white; }
  .btn-print:hover { background: #000088; }
  .btn-pdf { background: #d32f2f; color: white; }
  .btn-pdf:hover { background: #b71c1c; }

  .card { width: 189px; height: 321px; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.2); position: relative; border: 1px solid #bbb; display: flex; flex-direction: column; }

  .card-header { background: #0000AA; padding: 10px 8px 8px; text-align: center; position: relative; flex-shrink: 0; }
  .card-header img { height: 32px; display: block; margin: 0 auto; }
  .card-header .co-name { color: rgba(255,255,255,0.85); font-size: 6px; margin-top: 3px; letter-spacing: 0.8px; text-transform: uppercase; }
  .card-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #d32f2f; }

  .card-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 8px 4px; background: white; }
  .photo-frame { width: 88px; height: 88px; border-radius: 50%; border: 2.5px solid #0000AA; overflow: hidden; background: #f0f0f8; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; flex-shrink: 0; }
  .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
  .photo-frame .placeholder { font-size: 36px; color: #0000AA; }

  .emp-name { font-size: 11px; font-weight: 800; color: #0000AA; text-transform: uppercase; text-align: center; line-height: 1.25; margin-bottom: 2px; word-break: break-word; }
  .emp-desg { font-size: 8px; color: #d32f2f; font-weight: 700; text-transform: uppercase; text-align: center; margin-bottom: 3px; }
  .emp-info { font-size: 8px; color: #444; text-align: center; line-height: 1.5; word-break: break-word; }
  .divider { width: 50px; height: 1.5px; background: #0000AA; margin: 3px auto; opacity: 0.4; }

  .card-footer { background: #0000AA; padding: 6px 8px; text-align: center; flex-shrink: 0; position: relative; }
  .card-footer::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #d32f2f; }
  .card-num { font-size: 7px; font-weight: 700; color: white; letter-spacing: 0.8px; }
  .valid-txt { font-size: 6px; color: rgba(255,255,255,0.7); margin-top: 2px; }

  @media print {
    body { background: white !important; min-height: auto; padding: 0; }
    .no-print { display: none !important; }
    .card { box-shadow: none; margin: 0; }
  }
</style></head><body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">Print</button>
  <button class="btn-pdf" onclick="window.print()">Download PDF</button>
</div>
<div class="card">
  <div class="card-header">
    <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS Media" />
    <div class="co-name">KKHS Media Private Limited</div>
  </div>
  <div class="card-body">
    <div class="photo-frame">${photoSrc ? `<img src="${photoSrc}" />` : `<span class="placeholder">&#128100;</span>`}</div>
    <div class="emp-name">${card.user.name}</div>
    <div class="emp-desg">${card.designation}</div>
    <div class="divider"></div>
    <div class="emp-info">
      ${card.user.email}<br/>
      ${card.user.phone ? card.user.phone + "<br/>" : ""}
      ${card.user.address ? card.user.address : ""}
    </div>
  </div>
  <div class="card-footer">
    <div class="card-num">${card.cardNumber}</div>
    <div class="valid-txt">Valid: ${new Date(card.validFrom).toLocaleDateString("en-IN")} - ${new Date(card.validUntil).toLocaleDateString("en-IN")}</div>
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

      {/* Preview Modal — Portrait 50x85mm */}
      {previewCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">ID Card Preview</h3>
            {/* Portrait card 189x321px = 50x85mm */}
            <div className="mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-300 flex flex-col" style={{ width: "189px", height: "321px" }}>
              {/* Header */}
              <div className="bg-[#0000AA] text-center pt-2.5 pb-2 px-2 relative flex-shrink-0">
                <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS" className="h-8 mx-auto" />
                <div className="text-white/85 text-[6px] mt-1 tracking-wider uppercase">KKHS Media Private Limited</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d32f2f]"></div>
              </div>
              {/* Body */}
              <div className="flex-1 flex flex-col items-center px-2 pt-2 pb-1 bg-white">
                <div className="w-[88px] h-[88px] rounded-full border-[2.5px] border-[#0000AA] overflow-hidden bg-blue-50 flex items-center justify-center mb-1 flex-shrink-0">
                  {(previewCard.user.avatar || previewCard.photoUrl) ? (
                    <img src={previewCard.user.avatar || previewCard.photoUrl || ""} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <div className="text-[11px] font-extrabold text-[#0000AA] uppercase text-center leading-tight mb-0.5">{previewCard.user.name}</div>
                <div className="text-[8px] text-[#d32f2f] font-bold uppercase text-center mb-1">{previewCard.designation}</div>
                <div className="w-[50px] h-[1.5px] bg-[#0000AA]/40 mb-1"></div>
                <div className="text-[8px] text-gray-600 text-center leading-snug break-words">
                  {previewCard.user.email}<br />
                  {previewCard.user.phone && <>{previewCard.user.phone}<br /></>}
                  {previewCard.user.address && <>{previewCard.user.address}</>}
                </div>
              </div>
              {/* Footer */}
              <div className="bg-[#0000AA] text-center py-1.5 px-2 flex-shrink-0 relative">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#d32f2f]"></div>
                <div className="text-[7px] font-bold text-white tracking-wider">{previewCard.cardNumber}</div>
                <div className="text-[6px] text-white/70 mt-0.5">Valid: {new Date(previewCard.validFrom).toLocaleDateString("en-IN")} - {new Date(previewCard.validUntil).toLocaleDateString("en-IN")}</div>
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
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl border hover:shadow-md transition overflow-hidden">
              <div className="bg-[#0000AA] text-white py-2 px-3 flex items-center justify-center gap-2 relative">
                <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS" className="h-5" />
                <span className="text-[8px] text-white/80 uppercase tracking-wide">KKHS Media Pvt. Ltd.</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d32f2f]"></div>
              </div>
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full border-2 border-[#0000AA] flex-shrink-0 bg-blue-50 flex items-center justify-center text-2xl overflow-hidden mb-2">
                  {(card.user.avatar || card.photoUrl) ? (
                    <img src={card.user.avatar || card.photoUrl || ""} className="w-full h-full object-cover" alt="" />
                  ) : "👤"}
                </div>
                <div className="font-bold text-[#0000AA] text-sm uppercase truncate w-full">{card.user.name}</div>
                <div className="text-[10px] text-[#d32f2f] font-bold uppercase">{card.designation}</div>
                <div className="text-[9px] text-gray-400 mt-1">{card.cardNumber}</div>
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
