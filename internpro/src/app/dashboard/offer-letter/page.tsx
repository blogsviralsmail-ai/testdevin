"use client";

import { useState, useEffect } from "react";

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
      printWindow.document.write(`
        <html><head><title>${letterNumber}</title>
        <style>body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto;}
        @media print{body{padding:20px;}}</style></head>
        <body>${content}<script>window.onload=function(){window.print();}</script></body></html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;

  if (viewing) {
    return (
      <div>
        <button onClick={() => setViewing(null)} className="mb-4 text-indigo-600 hover:underline text-sm">← Back to Letters</button>
        <div className="bg-white rounded-xl p-8 border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Offer Letter — {viewing.letterNumber}</h2>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Experience Letter — {viewingExp.letterNumber}</h2>
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
          <div className="bg-white rounded-xl p-12 text-center border">
            <div className="text-6xl mb-4">📨</div>
            <h3 className="text-lg font-semibold text-gray-700">No Offer Letter Yet</h3>
            <p className="text-gray-500 mt-2">Your offer letter will appear here once you are selected after the interview.</p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <strong>Current Status Flow:</strong> Applied → Documents Review → Interview → Selection → Offer Letter
            </div>
          </div>
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
