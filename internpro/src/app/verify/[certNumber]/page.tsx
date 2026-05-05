import { formatDate, getDomainLabel, getModeLabel } from "@/lib/utils";

interface CertData {
  valid: boolean;
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

async function verifyCert(certNumber: string): Promise<CertData> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/certificates/verify/${certNumber}`, { cache: "no-store" });
  return res.json();
}

export default async function VerifyPage({ params }: { params: Promise<{ certNumber: string }> }) {
  const { certNumber } = await params;
  const data = await verifyCert(certNumber);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white font-bold mx-auto mb-3">IP</div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-600 text-sm">InternPro Certified</p>
        </div>

        {data.valid && data.certificate ? (
          <div className="bg-white rounded-xl p-8 border-2 border-green-200 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏆</div>
              <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                Verified Certificate
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">{data.certificate.studentName}</h2>
                <p className="text-sm text-gray-500">has successfully completed</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Program</span>
                  <span className="font-medium">{data.certificate.programName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Organization</span>
                  <span className="font-medium">{data.certificate.orgName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Domain</span>
                  <span className="font-medium">{getDomainLabel(data.certificate.domain)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{data.certificate.duration} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mode</span>
                  <span className="font-medium">{getModeLabel(data.certificate.mode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Certificate Type</span>
                  <span className="font-medium capitalize">{data.certificate.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Issue Date</span>
                  <span className="font-medium">{formatDate(data.certificate.issueDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Certificate ID</span>
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{data.certificate.certNumber}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              This certificate was verified on InternPro — Internship Management Platform
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border-2 border-red-200 shadow-lg text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Certificate Not Found</h2>
            <p className="text-gray-600 mb-4">
              The certificate number <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{certNumber}</span> could not be verified.
            </p>
            <p className="text-sm text-gray-500">Please check the certificate number and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
