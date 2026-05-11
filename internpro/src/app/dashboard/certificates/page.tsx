"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, getDomainLabel } from "@/lib/utils";

interface Certificate {
  id: string;
  certNumber: string;
  type: string;
  studentName: string;
  programName: string;
  orgName: string;
  issueDate: string;
  enrollment: {
    student: { name: string; email: string };
    batch: { program: { title: string; domain: string } };
  };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [verifyNumber, setVerifyNumber] = useState("");
  const [verifyResult, setVerifyResult] = useState<null | { valid: boolean; certificate?: Record<string, string> }>(null);

  const fetchCertificates = useCallback(async () => {
    const res = await fetch("/api/certificates");
    if (res.ok) setCertificates(await res.json());
  }, []);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  const handleVerify = async () => {
    if (!verifyNumber.trim()) return;
    const res = await fetch(`/api/certificates/verify/${verifyNumber}`);
    const data = await res.json();
    setVerifyResult(data);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificates</h1>
          <p className="text-slate-400 text-sm">Auto-generated certificates with QR verification</p>
        </div>
      </div>

      {/* Verify Section */}
      <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border border-white/[0.06] mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Verify Certificate</h2>
        <div className="flex gap-3">
          <input
            value={verifyNumber}
            onChange={(e) => setVerifyNumber(e.target.value)}
            placeholder="Enter certificate number (e.g., IP-2025-XXXXXX)"
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
          />
          <button onClick={handleVerify} className="bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0891b2] transition">
            Verify
          </button>
        </div>
        {verifyResult && (
          <div className={`mt-4 p-4 rounded-lg ${verifyResult.valid ? "bg-transparent border border-green-200" : "bg-transparent border border-red-200"}`}>
            {verifyResult.valid ? (
              <div>
                <p className="text-emerald-400 font-semibold mb-2">Certificate is Valid!</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-medium">{verifyResult.certificate?.studentName}</span>
                  <span className="text-slate-400">Program:</span>
                  <span className="font-medium">{verifyResult.certificate?.programName}</span>
                  <span className="text-slate-400">Organization:</span>
                  <span className="font-medium">{verifyResult.certificate?.orgName}</span>
                  <span className="text-slate-400">Issue Date:</span>
                  <span className="font-medium">{verifyResult.certificate?.issueDate ? formatDate(verifyResult.certificate.issueDate) : "-"}</span>
                </div>
              </div>
            ) : (
              <p className="text-red-400">Certificate not found. Please check the number and try again.</p>
            )}
          </div>
        )}
      </div>

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-12 border border-white/[0.06] text-center">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-slate-400">No certificates issued yet. Complete a program and generate certificates from the Students page.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] p-6 border border-white/[0.06] card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-xl">🏆</div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{cert.studentName}</h3>
                      <p className="text-xs text-slate-500">{cert.enrollment.student.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-transparent text-[#22d3ee] px-2 py-1 rounded">{cert.programName}</span>
                    <span className="text-xs bg-transparent text-[#a78bfa] px-2 py-1 rounded capitalize">{cert.type}</span>
                    <span className="text-xs bg-transparent text-slate-300 px-2 py-1 rounded">{getDomainLabel(cert.enrollment.batch.program.domain)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono bg-transparent px-3 py-1.5 rounded text-slate-300">{cert.certNumber}</div>
                  <div className="text-xs text-slate-500 mt-2">Issued: {formatDate(cert.issueDate)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
