"use client";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

interface VerifyResult {
  valid: boolean;
  type?: string;
  error?: string;
  data?: {
    number: string;
    studentName: string;
    programName: string;
    domain?: string;
    duration?: number;
    mode?: string;
    category?: string;
    orgName?: string;
    issuedAt: string;
  };
}

export default function VerifySearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/verify?number=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const performanceMap: Record<string, string> = { excellent: "Outstanding", good: "Very Good", average: "Satisfactory" };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">IP</div>
          <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600 text-sm mt-1">Verify Offer Letters, Experience Certificates & Internship Certificates</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl p-6 shadow-lg border mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enter Document / Certificate Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. OL-2026-XXXXXX or EXP-2026-XXXXXX or IP-2026-XXXXXX"
              className="flex-1 px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Verify"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">This number is printed on your letter/certificate issued by InternPro.</p>
        </form>

        {searched && !loading && result && (
          <>
            {result.valid && result.data ? (
              <div className="bg-white rounded-xl p-8 border-2 border-green-200 shadow-lg">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">&#9989;</div>
                  <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Verified — {result.type}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">{result.data.studentName}</h2>
                    <p className="text-sm text-gray-500">
                      {result.type === "Offer Letter" ? "has been offered an internship" :
                       result.type === "Experience Certificate" ? "has successfully completed internship" :
                       "has been certified"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Document Type</span>
                      <span className="font-medium text-indigo-700">{result.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Program</span>
                      <span className="font-medium">{result.data.programName}</span>
                    </div>
                    {result.data.duration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium">{result.data.duration} Days</span>
                      </div>
                    )}
                    {result.data.mode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mode</span>
                        <span className="font-medium capitalize">{result.data.mode}</span>
                      </div>
                    )}
                    {result.data.category && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Performance</span>
                        <span className="font-medium text-green-700">{performanceMap[result.data.category] || result.data.category}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Issue Date</span>
                      <span className="font-medium">{formatDate(result.data.issuedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Document ID</span>
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{result.data.number}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center mt-6">
                  This document was verified on InternPro — Internship Management Platform
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border-2 border-red-200 shadow-lg text-center">
                <div className="text-5xl mb-4">&#10060;</div>
                <h2 className="text-xl font-bold text-red-700 mb-2">Document Not Found</h2>
                <p className="text-gray-600 mb-4">
                  The number <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{query}</span> could not be verified.
                </p>
                <p className="text-sm text-gray-500">Please check the number and try again. Make sure you are entering the exact reference number from your letter or certificate.</p>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-indigo-600 hover:underline">Back to InternPro</a>
        </div>
      </div>
    </div>
  );
}
