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
    batch: { program: { title: string; mode: string; duration: number } };
  };
}

export default function OfferLetterPage() {
  const [letters, setLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<OfferLetter | null>(null);

  useEffect(() => {
    fetch("/api/offer-letters")
      .then((r) => r.json())
      .then((data) => { setLetters(data); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  if (viewing) {
    return (
      <div>
        <button onClick={() => setViewing(null)} className="mb-4 text-indigo-600 hover:underline">← Back</button>
        <div className="bg-white rounded-xl p-8 border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Offer Letter — {viewing.letterNumber}</h2>
            <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
              Print / Download PDF
            </button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: viewing.htmlContent || "" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Offer Letter</h1>
        <p className="text-gray-600">View your offer letter and joining details</p>
      </div>

      {letters.length === 0 ? (
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
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>💰 ₹{letter.enrollment.salary}/month</span>
                    <span>📅 Joining: {new Date(letter.enrollment.joiningDate).toLocaleDateString("en-IN")}</span>
                    <span>🏢 {letter.enrollment.workTiming}</span>
                  </div>
                </div>
                <button onClick={() => setViewing(letter)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  View Offer Letter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
