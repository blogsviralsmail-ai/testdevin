"use client";

import { useState, useEffect } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface OfferLetter {
  id: string;
  letterNumber: string;
  htmlContent: string;
  issuedAt: string;
  isAccepted: boolean;
  acceptedAt: string | null;
  signatureUrl: string | null;
  enrollment: {
    salary: number;
    weekoffs: number;
    paidLeaves: number;
    workTiming: string;
    joiningDate: string;
    feeType: string | null;
    batch: { program: { title: string; mode: string; duration: number } };
  };
}

interface ExperienceLetter {
  id: string;
  letterNumber: string;
  category: string;
  htmlContent: string | null;
  issuedAt: string;
  enrollment: {
    batch: { program: { title: string; duration: number } };
    student: { name: string };
  };
}

export default function OfferLetterPage() {
  const [letters, setLetters] = useState<OfferLetter[]>([]);
  const [expLetters, setExpLetters] = useState<ExperienceLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<OfferLetter | null>(null);
  const [viewingExp, setViewingExp] = useState<ExperienceLetter | null>(null);
  const [activeTab, setActiveTab] = useState<"offer" | "experience">("offer");
  const [showSignModal, setShowSignModal] = useState<string | null>(null);
  const [signFile, setSignFile] = useState<File | null>(null);
  const [signPreview, setSignPreview] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/offer-letters").then((r) => r.json()),
      fetch("/api/experience-letters").then((r) => r.json()),
    ]).then(([offerData, expData]) => {
      setLetters(offerData);
      setExpLetters(expData);
      setLoading(false);
    });
  }, []);

  const handlePrint = (content: string, letterNumber: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${letterNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; padding: 20px; margin: 0 auto; background: #e8e8e8; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  .letter-wrap { background: white; margin: 0 auto; }
  .a4-page { width: 210mm; min-height: 297mm; margin: 0 auto 20px; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; box-sizing: border-box; page-break-after: always; }
  .a4-page:last-child { page-break-after: auto; }
  .page-content { flex: 1; padding: 20px 36px 10px; }
  .page-footer { flex-shrink: 0; }
  .btn-bar { text-align: center; margin-bottom: 15px; display: flex; gap: 10px; justify-content: center; }
  .btn-bar button { padding: 10px 28px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
  .btn-print { background: #0000AA; color: white; }
  .btn-print:hover { background: #000088; }
  .btn-pdf { background: #d32f2f; color: white; }
  .btn-pdf:hover { background: #b71c1c; }
  table { border-collapse: collapse; }
  td, th { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  img { max-width: 100%; display: inline-block; }
  @media print {
    .btn-bar { display: none !important; }
    body { padding: 0; margin: 0; background: white !important; }
    .letter-wrap { box-shadow: none; }
    .a4-page { box-shadow: none; margin-bottom: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
</style></head><body>
<div class="btn-bar"><button class="btn-print" onclick="window.print()">Print</button><button class="btn-pdf" onclick="window.print()">Download PDF</button></div>
<div class="letter-wrap">${content}</div>
</body></html>`);
      printWindow.document.close();
    }
  };

  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;

  const handleAccept = async () => {
    if (!showSignModal || !signFile) return;
    setAccepting(true);
    try {
      const formData = new FormData();
      formData.append("file", signFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) { alert("Failed to upload signature"); setAccepting(false); return; }
      const uploadData = await uploadRes.json();
      const res = await fetch("/api/offer-letters/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: showSignModal, signatureUrl: uploadData.url }),
      });
      if (res.ok) {
        setShowSignModal(null);
        setSignFile(null);
        setSignPreview(null);
        // Refresh
        const offerData = await fetch("/api/offer-letters").then(r => r.json());
        setLetters(offerData);
        alert("Offer letter accepted successfully!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to accept");
      }
    } catch { alert("Error accepting offer letter"); }
    setAccepting(false);
  };

  if (viewing) {
    return (
      <div>
        <button onClick={() => setViewing(null)} className="mb-4 text-[#22d3ee] hover:underline text-sm">← Back to Letters</button>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-8 border shadow-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              {viewing.isAccepted ? (
                <span className="text-emerald-400 text-sm font-medium">✅ Accepted on {new Date(viewing.acceptedAt!).toLocaleDateString("en-IN")}</span>
              ) : (
                <button onClick={() => setShowSignModal(viewing.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
                  ✅ Accept Offer Letter
                </button>
              )}
            </div>
            <button onClick={() => handlePrint(viewing.htmlContent || "", viewing.letterNumber)}
              className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2]">
              Print / Download PDF
            </button>
          </div>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: viewing.htmlContent || "" }} />
          {viewing.isAccepted && viewing.signatureUrl && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-sm font-medium mb-2">Your Signature:</p>
              <img src={viewing.signatureUrl} alt="Signature" className="max-h-16" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewingExp) {
    return (
      <div>
        <button onClick={() => setViewingExp(null)} className="mb-4 text-[#22d3ee] hover:underline text-sm">← Back to Letters</button>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-8 border shadow-none">
          <div className="flex justify-end mb-4">
            <button onClick={() => handlePrint(viewingExp.htmlContent || "", viewingExp.letterNumber)}
              className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2]">
              Print / Download PDF
            </button>
          </div>
          {viewingExp.htmlContent ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: viewingExp.htmlContent }} />
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Experience Letter #{viewingExp.letterNumber}</p>
              <p className="mt-2">Category: {viewingExp.category}</p>
              <p className="mt-1">Issued: {new Date(viewingExp.issuedAt).toLocaleDateString("en-IN")}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Letters</h1>
        <p className="text-slate-400">View your offer letter, experience letter, and joining details</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("offer")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "offer" ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400"}`}>
          Offer Letters ({letters.length})
        </button>
        <button onClick={() => setActiveTab("experience")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "experience" ? "bg-[#0EA5B8] text-white" : "bg-transparent text-slate-400"}`}>
          Experience Letters ({expLetters.length})
        </button>
      </div>

      {activeTab === "offer" ? (
        letters.length === 0 ? (
          <>
            <PaymentBlockMessage feature="Offer Letter" />
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
              <div className="text-6xl mb-4">📨</div>
              <h3 className="text-lg font-semibold text-slate-300">No Offer Letter Yet</h3>
              <p className="text-slate-500 mt-2">Your offer letter will appear here once you are selected after the interview.</p>
              <div className="mt-6 p-4 rounded-lg bg-[rgba(255,255,255,0.03)] border border-white/[0.06] text-sm text-blue-800">
                <strong>Current Status Flow:</strong> Applied → Documents Review → Interview → Selection → Offer Letter
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-4">
            {letters.map((letter) => (
              <div key={letter.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border hover:shadow-none transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{letter.enrollment.batch.program.title}</h3>
                    <p className="text-sm text-slate-400">Letter No: {letter.letterNumber}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                      <span>💰 ₹{letter.enrollment.salary}/month</span>
                      <span>📅 Joining: {new Date(letter.enrollment.joiningDate).toLocaleDateString("en-IN")}</span>
                      <span>🏢 {letter.enrollment.workTiming}</span>
                      {letter.enrollment.feeType && (
                        <span className={`px-2 py-0.5 rounded text-xs ${letter.enrollment.feeType === "stipend" ? "bg-emerald-500/10 text-emerald-400" : letter.enrollment.feeType === "paid" ? "bg-red-500/10 text-red-400" : "bg-transparent text-slate-400"}`}>
                          {letter.enrollment.feeType === "stipend" ? "Company Pays You" : letter.enrollment.feeType === "paid" ? "You Pay Fee" : "Free"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {letter.isAccepted ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">✅ Accepted</span>
                    ) : (
                      <button onClick={() => setShowSignModal(letter.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
                        Accept
                      </button>
                    )}
                    <button onClick={() => setViewing(letter)}
                      className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2]">
                      View
                    </button>
                    <button onClick={() => handlePrint(letter.htmlContent || "", letter.letterNumber)}
                      className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20 font-medium">
                      Print
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        expLetters.length === 0 ? (
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-lg font-semibold text-slate-300">No Experience Letter Yet</h3>
            <p className="text-slate-500 mt-2">Complete your internship and get approved by admin to receive your experience letter.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {expLetters.map((letter) => (
              <div key={letter.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border hover:shadow-none transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {letter.enrollment.student?.name ? `${letter.enrollment.student.name} — ` : ""}{letter.enrollment.batch.program.title}
                    </h3>
                    <p className="text-sm text-slate-400">Letter No: {letter.letterNumber}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        letter.category === "excellent" ? "bg-emerald-500/10 text-emerald-400" :
                        letter.category === "good" ? "bg-blue-500/10 text-[#60a5fa]" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        Category: {letter.category}
                      </span>
                      <span>📅 Issued: {new Date(letter.issuedAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewingExp(letter)}
                      className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2]">
                      View
                    </button>
                    <button onClick={() => handlePrint(letter.htmlContent || "", letter.letterNumber)}
                      className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20 font-medium">
                      Print
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Signature Upload Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowSignModal(null); setSignFile(null); setSignPreview(null); }}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{background: '#111827', border: '1px solid rgba(255,255,255,0.1)'}} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Accept Offer Letter</h2>
            <p className="text-slate-400 text-sm mb-4">Please upload your signature to accept the offer letter. This confirms your acceptance.</p>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center mb-4">
              {signPreview ? (
                <div>
                  <img src={signPreview} alt="Signature Preview" className="max-h-24 mx-auto mb-3" />
                  <button onClick={() => { setSignFile(null); setSignPreview(null); }} className="text-xs text-red-400 hover:underline">Remove</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="text-4xl mb-2">✍️</div>
                  <p className="text-white text-sm font-medium">Click to upload your signature</p>
                  <p className="text-slate-500 text-xs mt-1">PNG, JPG (Max 2MB)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSignFile(file);
                      const reader = new FileReader();
                      reader.onload = ev => setSignPreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSignModal(null); setSignFile(null); setSignPreview(null); }}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20">
                Cancel
              </button>
              <button onClick={handleAccept} disabled={!signFile || accepting}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {accepting ? "Accepting..." : "Accept & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
