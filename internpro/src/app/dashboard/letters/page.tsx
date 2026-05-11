"use client";

import { useState, useEffect, useCallback } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface UserSession {
  id: string;
  name: string;
  role: string;
}

interface LetterResult {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  studentAvatar: string | null;
  program: string;
  batch: string;
  domain: string;
  duration: number;
  status: string;
  employeeCardNumber: string | null;
  idCard: { id: string; cardNumber: string } | null;
  offerLetter: { id: string; letterNumber: string; htmlContent: string | null; issuedAt: string } | null;
  experienceLetter: { id: string; letterNumber: string; htmlContent: string | null; category: string; issuedAt: string } | null;
  internshipCertificate: { id: string; certNumber: string; issueDate: string } | null;
}

export default function LettersPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [results, setResults] = useState<LetterResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "name" | "employee_id" | "phone">("all");
  const [viewingLetter, setViewingLetter] = useState<{ html: string; title: string; email?: string; phone?: string } | null>(null);
  const [generatingCert, setGeneratingCert] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const d = await res.json();
      setUser(d.user);
    }
  }, []);

  const fetchLetters = useCallback(async (query = "", type = "name") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) {
      params.set("search", query);
      params.set("type", type);
    }
    const res = await fetch(`/api/letters?${params.toString()}`);
    if (res.ok) {
      setResults(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    fetchLetters();
  }, [fetchUser, fetchLetters]);

  const handleSearch = () => {
    fetchLetters(searchQuery, searchType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handlePrintLetter = (htmlContent: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
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
<div class="letter-wrap">${htmlContent}</div>
</body></html>`);
      printWindow.document.close();
    }
  };

  const viewIDCard = async (studentId: string) => {
    const res = await fetch("/api/employee-cards");
    if (res.ok) {
      const cards = await res.json();
      const card = cards.find((c: { userId: string }) => c.userId === studentId);
      if (card) {
        window.open(`/dashboard/id-cards?view=${card.id}`, "_blank");
      }
    }
  };

  const viewCertificate = async (enrollmentId: string, studentName: string) => {
    setGeneratingCert(enrollmentId);
    try {
      const res = await fetch(`/api/certificates/internship?enrollmentId=${enrollmentId}`);
      if (res.ok) {
        const data = await res.json();
        const matchResult = results.find(rr => rr.enrollmentId === enrollmentId);
        setViewingLetter({ html: data.html, title: `Internship Certificate — ${studentName}`, email: matchResult?.studentEmail, phone: matchResult?.studentPhone || "" });
      } else {
        alert("Failed to generate certificate");
      }
    } catch {
      alert("Error generating certificate");
    }
    setGeneratingCert(null);
  };

  const isStudent = user?.role === "student";
  const pageTitle = isStudent ? "My Letters" : "Letters";
  const pageDesc = isStudent
    ? "View all your documents — ID Card, Offer Letter, Experience Letter, and Internship Certificate."
    : "Search and view all student documents in one place.";

  const handlePrint = () => {
    if (!viewingLetter) return;
    handlePrintLetter(viewingLetter.html, viewingLetter.title);
  };

  if (viewingLetter) {
    return (
      <div>
        <button onClick={() => setViewingLetter(null)} className="mb-4 text-[#22d3ee] hover:underline text-sm">
          &larr; Back to {pageTitle}
        </button>
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] shadow-none border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-white">{viewingLetter.title}</h3>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handlePrint}
                className="px-4 py-1.5 bg-[#0EA5B8] text-white rounded text-sm hover:bg-[#0891b2]">
                Print / PDF
              </button>
              {viewingLetter.email && (
                <button onClick={async () => {
                  try {
                    const btn = document.activeElement as HTMLButtonElement;
                    if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
                    const res = await fetch("/api/send-letter-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: viewingLetter.email, subject: viewingLetter.title, htmlContent: viewingLetter.html }),
                    });
                    if (res.ok) { alert("Email sent successfully!"); }
                    else {
                      const data = await res.json().catch(() => ({}));
                      alert("Failed: " + (data.error || `Server returned ${res.status}`));
                    }
                    if (btn) { btn.disabled = false; btn.textContent = "Email"; }
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    alert("Network error: " + msg);
                  }
                }}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-green-700">
                  Email
                </button>
              )}
              {viewingLetter.phone && (
                <button onClick={() => {
                  const msg = encodeURIComponent(`Dear Student,\n\nYour ${viewingLetter.title} has been generated. Please login to your InternPro dashboard to view and download it.\n\nPortal: https://internship.kkhsmedia.com/login\n\nRegards,\nKKHS Media Private Limited`);
                  const phone = viewingLetter.phone!.replace(/[^0-9]/g, "");
                  const waPhone = phone.startsWith("91") ? phone : `91${phone}`;
                  window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
                }}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">
                  WhatsApp
                </button>
              )}
              <button onClick={() => setViewingLetter(null)}
                className="px-4 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded text-sm hover:bg-red-500/30 font-medium">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="p-4 bg-transparent overflow-auto max-h-[80vh]">
            <div dangerouslySetInnerHTML={{ __html: viewingLetter.html }} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
        <p className="text-slate-400 text-sm">{pageDesc}</p>
      </div>

      {/* Search Section — hidden for students */}
      {!isStudent && (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border mb-6">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Search By</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "all" | "name" | "employee_id" | "phone")}
                className="px-3 py-2 border rounded-lg text-sm bg-transparent min-w-[160px]"
              >
                <option value="all">All</option>
                <option value="name">Name</option>
                <option value="employee_id">Employee ID</option>
                <option value="phone">Phone Number</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {searchType === "all" ? "Search anything..." : searchType === "name" ? "Student Name" : searchType === "employee_id" ? "Employee ID / Card Number" : "Phone Number"}
              </label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchType === "name" ? "Enter student name..." : searchType === "employee_id" ? "Enter employee ID..." : "Enter phone number..."}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium hover:bg-[#0891b2] transition"
            >
              Search
            </button>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); fetchLetters(); }}
                className="px-4 py-2 bg-white/10 border border-white/20 text-slate-300 rounded-lg text-sm hover:bg-white/20 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <>
          <PaymentBlockMessage feature="Letters & Documents" />
          <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 text-center border">
            <p className="text-slate-500">
              {searchQuery ? "No results for your search. Try a different search term." : "No documents available yet."}
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.enrollmentId} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-5 border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {r.studentAvatar ? (
                    <img src={r.studentAvatar} alt={r.studentName} className="w-10 h-10 rounded-full object-cover border flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0EA5B8]/10 flex items-center justify-center text-[#22d3ee] font-bold text-sm flex-shrink-0">
                      {r.studentName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{r.studentName}</p>
                    <p className="text-sm text-slate-400">{r.program} — {r.batch}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.employeeCardNumber && <span className="text-[#22d3ee] font-medium mr-2">ID: {r.employeeCardNumber}</span>}
                      {r.studentEmail}
                      {r.studentPhone && <span className="ml-2">{r.studentPhone}</span>}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${r.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-[#60a5fa]"}`}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>

              {/* Documents — inline buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                {/* ID Card */}
                {r.idCard ? (
                  <>
                    <button
                      onClick={() => viewIDCard(r.studentId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      ID Card
                    </button>
                    <button
                      onClick={async (e) => {
                        const btn = e.currentTarget;
                        btn.disabled = true; btn.textContent = "Sending...";
                        try {
                          const res = await fetch("/api/send-id-card-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ studentId: r.studentId }),
                          });
                          if (res.ok) alert("ID Card emailed to " + r.studentEmail);
                          else { const d = await res.json().catch(() => ({})); alert("Failed: " + (d.error || res.status)); }
                        } catch (err: unknown) { alert("Error: " + (err instanceof Error ? err.message : String(err))); }
                        btn.disabled = false; btn.textContent = "📧 Email ID Card";
                      }}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                    >
                      📧 Email ID Card
                    </button>
                  </>
                ) : (
                  <span className="px-4 py-2 bg-transparent text-slate-500 rounded-lg text-sm border border-dashed border-white/[0.08]">ID Card — Not Generated</span>
                )}

                {/* Offer Letter */}
                {r.offerLetter ? (
                  <button
                    onClick={() => setViewingLetter({ html: r.offerLetter!.htmlContent || "", title: `Offer Letter — ${r.studentName}`, email: r.studentEmail, phone: r.studentPhone || "" })}
                    className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2] transition"
                  >
                    Offer Letter
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-transparent text-slate-500 rounded-lg text-sm border border-dashed border-white/[0.08]">Offer Letter — Not Generated</span>
                )}

                {/* Experience Letter */}
                {r.experienceLetter ? (
                  <button
                    onClick={() => setViewingLetter({ html: r.experienceLetter!.htmlContent || "", title: `Experience Letter — ${r.studentName}`, email: r.studentEmail, phone: r.studentPhone || "" })}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    Experience Letter
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-transparent text-slate-500 rounded-lg text-sm border border-dashed border-white/[0.08]">
                    {r.status === "completed" ? "Experience Letter — Pending" : "Experience Letter — After Completion"}
                  </span>
                )}

                {/* Internship Certificate */}
                {r.internshipCertificate ? (
                  <button
                    onClick={() => viewCertificate(r.enrollmentId, r.studentName)}
                    disabled={generatingCert === r.enrollmentId}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition disabled:opacity-50"
                  >
                    {generatingCert === r.enrollmentId ? "Loading..." : "Internship Certificate"}
                  </button>
                ) : r.experienceLetter ? (
                  <button
                    onClick={() => viewCertificate(r.enrollmentId, r.studentName)}
                    disabled={generatingCert === r.enrollmentId}
                    className="px-4 py-2 bg-yellow-600/80 text-white rounded-lg text-sm hover:bg-yellow-600 transition disabled:opacity-50"
                  >
                    {generatingCert === r.enrollmentId ? "Generating..." : "Generate Certificate"}
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-transparent text-slate-500 rounded-lg text-sm border border-dashed border-white/[0.08]">Certificate — After Experience Letter</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
