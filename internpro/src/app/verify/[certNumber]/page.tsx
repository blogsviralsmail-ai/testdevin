import { formatDate, getDomainLabel, getModeLabel } from "@/lib/utils";
import { redirect } from "next/navigation";

interface VerifyData {
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
  // Legacy cert format
  certificate?: {
    certNumber: string;
    type: string;
    studentName: string;
    programName: string;
    orgName: string;
    issueDate: string;
    domain: string;
    duration: number;
    mode: string;
  };
}

async function verifyDocument(number: string): Promise<VerifyData> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  // Try unified API first
  const res = await fetch(`${baseUrl}/api/verify?number=${encodeURIComponent(number)}`, { cache: "no-store" });
  const data = await res.json();
  if (data.valid) return data;
  // Fallback to legacy certificate API
  const certRes = await fetch(`${baseUrl}/api/certificates/verify/${number}`, { cache: "no-store" });
  return certRes.json();
}

const performanceMap: Record<string, string> = { excellent: "Outstanding", good: "Very Good", average: "Satisfactory" };

export default async function VerifyPage({ params }: { params: Promise<{ certNumber: string }> }) {
  const { certNumber } = await params;

  if (!certNumber || certNumber === "search") {
    redirect("/verify");
  }

  const data = await verifyDocument(certNumber);

  // Handle unified API response
  const isValid = data.valid;
  const docType = data.type || (data.certificate ? `${data.certificate.type} Certificate` : null);
  const info = data.data || (data.certificate ? {
    number: data.certificate.certNumber,
    studentName: data.certificate.studentName,
    programName: data.certificate.programName,
    domain: data.certificate.domain,
    duration: data.certificate.duration,
    mode: data.certificate.mode,
    orgName: data.certificate.orgName,
    issuedAt: data.certificate.issueDate,
  } : null);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">IP</div>
          <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600 text-sm">InternPro Certified</p>
        </div>

        {isValid && info ? (
          <div className="bg-white rounded-xl p-8 border-2 border-green-200 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">&#9989;</div>
              <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                Verified — {docType}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">{info.studentName}</h2>
                <p className="text-sm text-gray-500">
                  {docType === "Offer Letter" ? "has been offered an internship" :
                   docType === "Experience Certificate" ? "has successfully completed internship" :
                   "has been certified"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Document Type</span>
                  <span className="font-medium text-indigo-700">{docType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Program</span>
                  <span className="font-medium">{info.programName}</span>
                </div>
                {info.orgName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Organization</span>
                    <span className="font-medium">{info.orgName}</span>
                  </div>
                )}
                {info.domain && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Domain</span>
                    <span className="font-medium">{getDomainLabel(info.domain)}</span>
                  </div>
                )}
                {info.duration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">{info.duration} Days</span>
                  </div>
                )}
                {info.mode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mode</span>
                    <span className="font-medium">{getModeLabel(info.mode)}</span>
                  </div>
                )}
                {info.category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Performance</span>
                    <span className="font-medium text-green-700">{performanceMap[info.category] || info.category}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Issue Date</span>
                  <span className="font-medium">{formatDate(info.issuedAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Document ID</span>
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{info.number}</span>
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
              The number <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{certNumber}</span> could not be verified.
            </p>
            <p className="text-sm text-gray-500">Please check the number and try again.</p>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="/verify" className="text-sm text-indigo-600 hover:underline mr-4">Search Another Document</a>
          <a href="/" className="text-sm text-gray-500 hover:underline">Back to InternPro</a>
        </div>
      </div>
    </div>
  );
}
