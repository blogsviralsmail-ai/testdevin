"use client";

import { useState, useEffect } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface OfferLetter {
  id: string;
  letterNumber: string;
  htmlContent: string;
  issuedAt: string;
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

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;

  if (viewing) {
    return (
      <div>
        <button onClick={() => setViewing(null)} className="mb-4 text-indigo-600 hover:underline text-sm">← Back to Letters</button>
        <div className="bg-white rounded-xl p-8 border shadow-sm">
          <div className="flex justify-end mb-4">
            <button onClick={() => handlePrint(viewing.htmlContent || "", viewing.letterNumber)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              Print / Download PDF
            </button>
          </div>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: viewing.htmlContent || "" }} />
        </div>
      </div>
    );
  }

  if (viewingExp) {
    return (
      <div>
        <button onClick={() => setViewingExp(null)} className="mb-4 text-indigo-600 hover:underline text-sm">← Back to Letters</button>
        <div className="bg-white rounded-xl p-8 border shadow-sm">
          <div className="flex justify-end mb-4">
            <button onClick={() => handlePrint(viewingExp.htmlContent || "", viewingExp.letterNumber)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              Print / Download PDF
            </button>
          </div>
          {viewingExp.htmlContent ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: viewingExp.htmlContent }} />
          ) : (
            <div className="text-center py-12 text-gray-500">
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
        <h1 className="text-2xl font-bold text-gray-900">My Letters</h1>
        <p className="text-gray-600">View your offer letter, experience letter, and joining details</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("offer")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "offer" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Offer Letters ({letters.length})
        </button>
        <button onClick={() => setActiveTab("experience")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "experience" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Experience Letters ({expLetters.length})
        </button>
      </div>

      {activeTab === "offer" ? (
        letters.length === 0 ? (
          <>
            <PaymentBlockMessage feature="Offer Letter" />
            <div className="bg-white rounded-xl p-12 text-center border">
              <div className="text-6xl mb-4">📨</div>
              <h3 className="text-lg font-semibold text-gray-700">No Offer Letter Yet</h3>
              <p className="text-gray-500 mt-2">Your offer letter will appear here once you are selected after the interview.</p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>Current Status Flow:</strong> Applied → Documents Review → Interview → Selection → Offer Letter
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-4">
            {letters.map((letter) => (
              <div key={letter.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{letter.enrollment.batch.program.title}</h3>
                    <p className="text-sm text-gray-600">Letter No: {letter.letterNumber}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span>💰 ₹{letter.enrollment.salary}/month</span>
                      <span>📅 Joining: {new Date(letter.enrollment.joiningDate).toLocaleDateString("en-IN")}</span>
                      <span>🏢 {letter.enrollment.workTiming}</span>
                      {letter.enrollment.feeType && (
                        <span className={`px-2 py-0.5 rounded text-xs ${letter.enrollment.feeType === "stipend" ? "bg-green-100 text-green-700" : letter.enrollment.feeType === "paid" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          {letter.enrollment.feeType === "stipend" ? "Company Pays You" : letter.enrollment.feeType === "paid" ? "You Pay Fee" : "Free"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewing(letter)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      View
                    </button>
                    <button onClick={() => handlePrint(letter.htmlContent || "", letter.letterNumber)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
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
          <div className="bg-white rounded-xl p-12 text-center border">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-lg font-semibold text-gray-700">No Experience Letter Yet</h3>
            <p className="text-gray-500 mt-2">Complete your internship and get approved by admin to receive your experience letter.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {expLetters.map((letter) => (
              <div key={letter.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {letter.enrollment.student?.name ? `${letter.enrollment.student.name} — ` : ""}{letter.enrollment.batch.program.title}
                    </h3>
                    <p className="text-sm text-gray-600">Letter No: {letter.letterNumber}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        letter.category === "excellent" ? "bg-green-100 text-green-700" :
                        letter.category === "good" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        Category: {letter.category}
                      </span>
                      <span>📅 Issued: {new Date(letter.issuedAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewingExp(letter)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      View
                    </button>
                    <button onClick={() => handlePrint(letter.htmlContent || "", letter.letterNumber)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      Print
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
