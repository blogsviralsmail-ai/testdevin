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
  user: { id: string; name: string; email: string; phone: string | null; avatar: string | null; collegeName: string | null; address: string | null; dob: string | null };
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
  const [companyLogo, setCompanyLogo] = useState("/uploads/kkhs-logo.png");
  const [companyName, setCompanyName] = useState("KKHS Media Private Limited");

  const fetchData = useCallback(async () => {
    const [cardsRes, enrollRes, meRes, settingsRes] = await Promise.all([
      fetch("/api/employee-cards"),
      fetch("/api/enrollments?status=selected"),
      fetch("/api/auth/me"),
      fetch("/api/settings"),
    ]);
    if (cardsRes.ok) setCards(await cardsRes.json());
    if (enrollRes.ok) setEnrollments(await enrollRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
    if (settingsRes.ok) {
      const sData = await settingsRes.json();
      const sMap: Record<string, string> = {};
      if (Array.isArray(sData)) sData.forEach((s: { key: string; value: string }) => { sMap[s.key] = s.value; });
      if (sMap.letterhead_logo) setCompanyLogo(sMap.letterhead_logo);
      if (sMap.letterhead_company_name) setCompanyName(sMap.letterhead_company_name);
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

  // Portrait ID card: 54mm x 86mm (standard CR80) — 204px x 325px at 96dpi
  const handlePrint = (card: EmployeeCard) => {
    const photoSrc = card.user.avatar || card.photoUrl || "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${card.user.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 54mm 86mm; margin: 0; }
  body { font-family: 'Segoe UI', 'Calibri', Arial, sans-serif; background: #e8e8e8; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 20px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  .no-print { display: flex; gap: 10px; margin-bottom: 10px; }
  .no-print button { padding: 10px 28px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
  .btn-print { background: #0000AA; color: white; }
  .btn-print:hover { background: #000088; }
  .btn-pdf { background: #d32f2f; color: white; }
  .btn-pdf:hover { background: #b71c1c; }
  .side-label { font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

  .card { width: 204px; height: 325px; border-radius: 10px; overflow: hidden; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); position: relative; display: flex; flex-direction: column; }
  .card::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: #d32f2f; border-radius: 10px 0 0 10px; z-index: 2; }
  .card::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 6px; background: #2563eb; border-radius: 0 10px 10px 0; z-index: 2; }

  /* FRONT SIDE */
  .card-logo { text-align: center; padding: 12px 10px 8px; flex-shrink: 0; }
  .card-logo img { height: 28px; }
  .card-logo .co-name { font-size: 7px; color: #1a365d; font-weight: 700; margin-top: 3px; letter-spacing: 0.5px; }

  .photo-section { text-align: center; padding: 4px 0 6px; flex-shrink: 0; }
  .photo-frame { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #2563eb; overflow: hidden; background: #f0f4ff; display: inline-flex; align-items: center; justify-content: center; }
  .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
  .photo-frame .placeholder { font-size: 32px; color: #2563eb; }

  .name-section { text-align: center; padding: 4px 10px; flex-shrink: 0; }
  .emp-name { font-size: 12px; font-weight: 800; color: #1a202c; line-height: 1.2; margin-bottom: 3px; }
  .emp-desg { display: inline-block; background: #2563eb; color: white; font-size: 7px; font-weight: 700; padding: 2px 10px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

  .info-section { flex: 1; padding: 6px 14px 4px; }
  .info-row { display: flex; align-items: baseline; margin-bottom: 4px; font-size: 8px; }
  .info-label { font-weight: 800; color: #1a202c; min-width: 44px; }
  .info-value { color: #4a5568; flex: 1; }
  .info-colon { margin: 0 4px; color: #4a5568; }

  .card-barcode { text-align: center; padding: 4px 20px 10px; flex-shrink: 0; }
  .barcode-lines { height: 22px; background: repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 3px); margin: 0 auto; width: 80%; }
  .barcode-num { font-size: 6px; color: #666; margin-top: 2px; letter-spacing: 1px; }

  /* BACK SIDE */
  .back-logo { text-align: center; padding: 14px 10px 10px; flex-shrink: 0; }
  .back-logo img { height: 24px; }
  .back-logo .co-name { font-size: 7px; color: #1a365d; font-weight: 700; margin-top: 3px; letter-spacing: 0.5px; }

  .terms-section { flex: 1; padding: 0 14px; }
  .terms-title { font-size: 10px; font-weight: 900; color: #1a202c; text-align: center; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .terms-text { font-size: 7px; color: #4a5568; line-height: 1.5; margin-bottom: 6px; }
  .terms-text strong { color: #1a202c; font-size: 7.5px; }

  .back-footer { text-align: center; padding: 6px 10px 10px; flex-shrink: 0; }
  .id-badge { display: inline-block; background: #1a365d; color: white; font-size: 8px; font-weight: 700; padding: 4px 14px; border-radius: 12px; letter-spacing: 0.5px; }
  .back-phone { font-size: 7px; color: #4a5568; margin-top: 5px; }

  @media print {
    body { background: white !important; min-height: auto; padding: 0; gap: 0; }
    .no-print, .side-label { display: none !important; }
    .card { box-shadow: none; margin: 0; page-break-after: always; }
    .card:last-child { page-break-after: auto; }
  }
</style></head><body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">Print (Both Sides)</button>
  <button class="btn-pdf" onclick="window.print()">Download PDF</button>
</div>
<div class="side-label">— Front Side —</div>
<div class="card">
  <div class="card-logo">
    <img src="${companyLogo}" alt="${companyName}" />
    <div class="co-name">${companyName}</div>
  </div>
  <div class="photo-section">
    <div class="photo-frame">${photoSrc ? `<img src="${photoSrc}" />` : `<span class="placeholder">&#128100;</span>`}</div>
  </div>
  <div class="name-section">
    <div class="emp-name">${card.user.name}</div>
    <span class="emp-desg">${card.designation}</span>
  </div>
  <div class="info-section">
    <div class="info-row"><span class="info-label">ID No</span><span class="info-colon">:</span><span class="info-value">${card.cardNumber}</span></div>
    <div class="info-row"><span class="info-label">Email</span><span class="info-colon">:</span><span class="info-value">${card.user.email}</span></div>
    ${card.user.phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-colon">:</span><span class="info-value">${card.user.phone}</span></div>` : ""}
    ${card.user.collegeName ? `<div class="info-row"><span class="info-label">College</span><span class="info-colon">:</span><span class="info-value">${card.user.collegeName}</span></div>` : ""}
    ${card.user.dob ? `<div class="info-row"><span class="info-label">DOB</span><span class="info-colon">:</span><span class="info-value">${new Date(card.user.dob).toLocaleDateString("en-IN")}</span></div>` : ""}
  </div>
  <div class="card-barcode">
    <div class="barcode-lines"></div>
    <div class="barcode-num">${card.cardNumber}</div>
  </div>
</div>
<div class="side-label">— Back Side —</div>
<div class="card">
  <div class="back-logo">
    <img src="${companyLogo}" alt="${companyName}" />
    <div class="co-name">${companyName}</div>
  </div>
  <div class="terms-section">
    <div class="terms-title">Terms & Conditions</div>
    <div class="terms-text"><strong>Identification:</strong> Employees are required to keep their ID badge visible or easily accessible during working hours to confirm identity when needed.</div>
    <div class="terms-text"><strong>Proper Use:</strong> The ID badge is issued solely for company related activities. It may not be lent, duplicated, or used for any non-official purpose.</div>
    <div class="terms-text"><strong>Security:</strong> If the badge is misplaced or suspected to be compromised, report it immediately so access can be disabled.</div>
  </div>
  <div class="back-footer">
    <div class="id-badge">ID: ${card.cardNumber}</div>
    <div class="back-phone">+91 7062010000 | ${companyName}</div>
    <div class="back-phone">Valid: ${new Date(card.validFrom).toLocaleDateString("en-IN")} - ${new Date(card.validUntil).toLocaleDateString("en-IN")}</div>
  </div>
</div>
</body></html>`);
    printWindow.document.close();
  };

  const handleEmailIDCard = async (card: EmployeeCard) => {
    const photoSrc = card.user.avatar || card.photoUrl || "";
    const idCardHtml = `<div style="font-family:'Segoe UI','Calibri',Arial,sans-serif;max-width:600px;margin:0 auto;">
<div style="text-align:center;margin-bottom:20px;">
  <h2 style="color:#0000AA;margin:0;">Employee ID Card</h2>
  <p style="color:#666;font-size:13px;margin:4px 0 0;">Please find the ID card details below</p>
</div>
<div style="width:240px;margin:0 auto 20px;border-radius:12px;overflow:hidden;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #e0e0e0;">
  <div style="background:linear-gradient(135deg,#1a365d,#2563eb);padding:12px 10px;text-align:center;">
    <img src="${companyLogo.startsWith("http") ? companyLogo : "https://internship.kkhsmedia.com" + companyLogo}" alt="${companyName}" style="height:28px;display:inline-block;" />
    <div style="font-size:8px;color:white;font-weight:700;margin-top:3px;letter-spacing:0.5px;">${companyName}</div>
  </div>
  <div style="text-align:center;padding:12px 0 8px;">
    ${photoSrc ? `<img src="${photoSrc.startsWith("http") ? photoSrc : "https://internship.kkhsmedia.com" + photoSrc}" style="width:80px;height:80px;border-radius:50%;border:3px solid #2563eb;object-fit:cover;" />` : `<div style="width:80px;height:80px;border-radius:50%;border:3px solid #2563eb;background:#f0f4ff;display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:#2563eb;margin:0 auto;">👤</div>`}
  </div>
  <div style="text-align:center;padding:4px 10px;">
    <div style="font-size:14px;font-weight:800;color:#1a202c;">${card.user.name}</div>
    <span style="display:inline-block;background:#2563eb;color:white;font-size:8px;font-weight:700;padding:2px 10px;border-radius:10px;text-transform:uppercase;margin-top:4px;">${card.designation}</span>
  </div>
  <div style="padding:8px 16px 12px;">
    <div style="font-size:9px;margin-bottom:4px;"><strong style="color:#1a202c;">ID No:</strong> <span style="color:#4a5568;">${card.cardNumber}</span></div>
    <div style="font-size:9px;margin-bottom:4px;"><strong style="color:#1a202c;">Email:</strong> <span style="color:#4a5568;">${card.user.email}</span></div>
    ${card.user.phone ? `<div style="font-size:9px;margin-bottom:4px;"><strong style="color:#1a202c;">Phone:</strong> <span style="color:#4a5568;">${card.user.phone}</span></div>` : ""}
    <div style="font-size:9px;"><strong style="color:#1a202c;">Valid:</strong> <span style="color:#4a5568;">${new Date(card.validFrom).toLocaleDateString("en-IN")} - ${new Date(card.validUntil).toLocaleDateString("en-IN")}</span></div>
  </div>
</div>
</div>`;

    try {
      const res = await fetch("/api/send-letter-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: card.user.email, subject: `ID Card — ${card.user.name}`, htmlContent: idCardHtml }),
      });
      if (res.ok) { alert("ID Card emailed successfully to " + card.user.email); }
      else {
        const data = await res.json().catch(() => ({}));
        alert("Failed: " + (data.error || `Server returned ${res.status}`));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Network error: " + msg);
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";
  const isStudent = user?.role === "student";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">ID Cards</h1>
          <p className="text-slate-400 text-sm">{isStudent ? "Your employee ID card" : "Generate and manage employee ID cards"}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowGenerate(!showGenerate)}
            className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
            {showGenerate ? "Cancel" : "+ Generate ID Card"}
          </button>
        )}
      </div>

      {isAdmin && showGenerate && (
        <form onSubmit={handleGenerate} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Generate New ID Card</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Student</label>
              <select value={generateForm.userId} onChange={(e) => setGenerateForm({ ...generateForm, userId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" required>
                <option value="">Choose student...</option>
                {enrollments.map((e) => (
                  <option key={e.student.id} value={e.student.id}>{e.student.name} — {e.batch.program.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
              <input value={generateForm.designation} onChange={(e) => setGenerateForm({ ...generateForm, designation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Intern" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department (optional)</label>
              <input value={generateForm.department} onChange={(e) => setGenerateForm({ ...generateForm, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" placeholder="Web Development" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                className="w-full px-3 py-2 border rounded-lg text-sm text-white" />
              {generateForm.photoUrl && <p className="text-xs text-emerald-400 mt-1">Photo uploaded!</p>}
            </div>
          </div>
          <button type="submit" className="mt-4 bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2]">
            Generate ID Card
          </button>
        </form>
      )}

      {/* Preview Modal — 2-sided ID Card */}
      {previewCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="rounded-xl p-6 w-full max-w-lg" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 className="text-lg font-semibold text-white mb-4 text-center">ID Card Preview (2-Sided)</h3>
            <div className="flex gap-6 justify-center flex-wrap">
              {/* FRONT SIDE */}
              <div>
                <p className="text-xs text-slate-500 text-center mb-2 font-semibold uppercase">Front</p>
                <div className="rounded-[10px] overflow-hidden shadow-none flex flex-col relative" style={{ width: "204px", height: "325px", background: "white" }}>
                  <div className="absolute top-0 left-0 bottom-0 w-[6px] bg-red-600 rounded-l-[10px] z-10"></div>
                  <div className="absolute top-0 right-0 bottom-0 w-[6px] bg-blue-600 rounded-r-[10px] z-10"></div>
                  {/* Logo */}
                  <div className="text-center pt-3 pb-2 px-3 flex-shrink-0">
                    <img src={companyLogo} alt={companyName} className="h-7 mx-auto" />
                    <div className="text-[7px] text-[#1a365d] font-bold mt-1 tracking-wide">{companyName}</div>
                  </div>
                  {/* Photo */}
                  <div className="text-center py-1 flex-shrink-0">
                    <div className="w-[80px] h-[80px] rounded-full border-[3px] border-blue-600 overflow-hidden bg-blue-50 inline-flex items-center justify-center">
                      {(previewCard.user.avatar || previewCard.photoUrl) ? (
                        <img src={previewCard.user.avatar || previewCard.photoUrl || ""} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-3xl">👤</span>
                      )}
                    </div>
                  </div>
                  {/* Name + Designation */}
                  <div className="text-center px-3 py-1 flex-shrink-0">
                    <div className="text-[12px] font-extrabold text-[#1a202c] leading-tight mb-1">{previewCard.user.name}</div>
                    <span className="inline-block bg-blue-600 text-white text-[7px] font-bold px-2.5 py-[2px] rounded-full uppercase tracking-wide">{previewCard.designation}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 px-3.5 pt-1.5 pb-1">
                    <div className="flex items-baseline mb-1 text-[8px]"><span className="font-extrabold text-[#1a202c] w-[44px]">ID No</span><span className="mx-1 text-[#4a5568]">:</span><span className="text-[#4a5568]">{previewCard.cardNumber}</span></div>
                    <div className="flex items-baseline mb-1 text-[8px]"><span className="font-extrabold text-[#1a202c] w-[44px]">Email</span><span className="mx-1 text-[#4a5568]">:</span><span className="text-[#4a5568] break-all">{previewCard.user.email}</span></div>
                    {previewCard.user.phone && <div className="flex items-baseline mb-1 text-[8px]"><span className="font-extrabold text-[#1a202c] w-[44px]">Phone</span><span className="mx-1 text-[#4a5568]">:</span><span className="text-[#4a5568]">{previewCard.user.phone}</span></div>}
                    {previewCard.user.collegeName && <div className="flex items-baseline mb-1 text-[8px]"><span className="font-extrabold text-[#1a202c] w-[44px]">College</span><span className="mx-1 text-[#4a5568]">:</span><span className="text-[#4a5568]">{previewCard.user.collegeName}</span></div>}
                    {previewCard.user.dob && <div className="flex items-baseline mb-1 text-[8px]"><span className="font-extrabold text-[#1a202c] w-[44px]">DOB</span><span className="mx-1 text-[#4a5568]">:</span><span className="text-[#4a5568]">{new Date(previewCard.user.dob).toLocaleDateString("en-IN")}</span></div>}
                  </div>
                  {/* Barcode */}
                  <div className="text-center px-5 pb-2.5 flex-shrink-0">
                    <div className="h-[22px] mx-auto w-[80%]" style={{ background: "repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 3px)" }}></div>
                    <div className="text-[6px] text-slate-500 mt-0.5 tracking-wider">{previewCard.cardNumber}</div>
                  </div>
                </div>
              </div>
              {/* BACK SIDE */}
              <div>
                <p className="text-xs text-slate-500 text-center mb-2 font-semibold uppercase">Back</p>
                <div className="rounded-[10px] overflow-hidden shadow-none flex flex-col relative" style={{ width: "204px", height: "325px", background: "white" }}>
                  <div className="absolute top-0 left-0 bottom-0 w-[6px] bg-red-600 rounded-l-[10px] z-10"></div>
                  <div className="absolute top-0 right-0 bottom-0 w-[6px] bg-blue-600 rounded-r-[10px] z-10"></div>
                  {/* Logo */}
                  <div className="text-center pt-4 pb-2 px-3 flex-shrink-0">
                    <img src={companyLogo} alt={companyName} className="h-6 mx-auto" />
                    <div className="text-[7px] text-[#1a365d] font-bold mt-1 tracking-wide">{companyName}</div>
                  </div>
                  {/* Terms */}
                  <div className="flex-1 px-3.5">
                    <div className="text-[10px] font-black text-[#1a202c] text-center uppercase mb-2 tracking-wide">Terms & Conditions</div>
                    <p className="text-[7px] text-[#4a5568] leading-[1.5] mb-1.5"><strong className="text-[#1a202c]">Identification:</strong> Employees are required to keep their ID badge visible or easily accessible during working hours to confirm identity when needed.</p>
                    <p className="text-[7px] text-[#4a5568] leading-[1.5] mb-1.5"><strong className="text-[#1a202c]">Proper Use:</strong> The ID badge is issued solely for company related activities. It may not be lent, duplicated, or used for any non-official purpose.</p>
                    <p className="text-[7px] text-[#4a5568] leading-[1.5]"><strong className="text-[#1a202c]">Security:</strong> If the badge is misplaced or suspected to be compromised, report it immediately so access can be disabled.</p>
                  </div>
                  {/* Footer */}
                  <div className="text-center px-3 pb-3 flex-shrink-0">
                    <span className="inline-block bg-[#1a365d] text-white text-[8px] font-bold px-3.5 py-1 rounded-full">ID: {previewCard.cardNumber}</span>
                    <div className="text-[7px] text-[#4a5568] mt-1.5">+91 7062010000 | {companyName}</div>
                    <div className="text-[6px] text-[#4a5568] mt-0.5">Valid: {new Date(previewCard.validFrom).toLocaleDateString("en-IN")} - {new Date(previewCard.validUntil).toLocaleDateString("en-IN")}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-center flex-wrap">
              <button onClick={() => setPreviewCard(null)} className="px-5 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20 font-medium">← Back</button>
              <button onClick={() => handlePrint(previewCard)} className="bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2] font-medium">Print (Both Sides)</button>
              <button onClick={() => handlePrint(previewCard)} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-700 font-medium">Download PDF</button>
              <button onClick={async (e) => { const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Sending..."; await handleEmailIDCard(previewCard); btn.disabled = false; btn.textContent = "📧 Email"; }} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-emerald-700 font-medium">📧 Email</button>
              <button onClick={() => setPreviewCard(null)} className="px-5 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-sm hover:bg-red-500/30 font-medium">✕ Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
          <p className="text-4xl mb-4">🪪</p>
          <p className="text-slate-400">{isStudent ? "Your ID card has not been generated yet." : "No ID cards generated yet."}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] border hover:shadow-none transition overflow-hidden">
              <div className="bg-[#0EA5B8] text-white py-2 px-3 flex items-center justify-center gap-2 relative">
                <img src={companyLogo} alt={companyName} className="h-5" />
                <span className="text-[8px] text-white/80 uppercase tracking-wide">{companyName}</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6B6B]"></div>
              </div>
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full border-2 border-[#0EA5B8] flex-shrink-0 bg-[#0EA5B8]/10 flex items-center justify-center text-2xl overflow-hidden mb-2">
                  {(card.user.avatar || card.photoUrl) ? (
                    <img src={card.user.avatar || card.photoUrl || ""} className="w-full h-full object-cover" alt="" />
                  ) : "👤"}
                </div>
                <div className="font-bold text-white text-sm uppercase truncate w-full">{card.user.name}</div>
                <div className="text-[10px] text-[#FF6B6B] font-bold uppercase">{card.designation}</div>
                <div className="text-[9px] text-slate-400 mt-1">{card.cardNumber}</div>
              </div>
              <div className="px-4 pb-3 flex gap-2">
                <button onClick={() => setPreviewCard(card)} className="flex-1 text-xs bg-[#0EA5B8]/10 text-[#22d3ee] border border-[#0EA5B8]/30 px-3 py-1.5 rounded-lg hover:bg-[#0EA5B8]/20 font-medium">View</button>
                <button onClick={() => handlePrint(card)} className="flex-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 font-medium">Print</button>
                <button onClick={async (e) => { const btn = e.currentTarget; btn.disabled = true; btn.textContent = "..."; await handleEmailIDCard(card); btn.disabled = false; btn.textContent = "📧"; }} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 font-medium" title="Email ID Card">📧</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
