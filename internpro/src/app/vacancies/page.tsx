"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Program {
  id: string;
  title: string;
  domain: string;
  mode: string;
  duration: number;
  feeType: string;
  feeAmount: number | null;
  maxSeats: number;
  description: string | null;
  thumbnail: string | null;
  batches: { _count: { enrollments: number } }[];
  _count: { batches: number };
}

export default function VacanciesPage() {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    fetch("/api/programs?published=true").then(r => r.ok ? r.json() : []).then(setPrograms).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">IP</div>
            <span className="text-xl font-bold text-gray-900">InternPro</span>
          </Link>
          <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
            Apply Now
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Internship Openings</h1>
          <p className="text-gray-600">Browse available programs and apply for the ones that interest you</p>
        </div>

        {programs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500 text-lg">No openings available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => {
              const totalEnrolled = program.batches.reduce((sum, b) => sum + b._count.enrollments, 0);
              const seatsLeft = program.maxSeats - totalEnrolled;
              return (
                <div key={program.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                  {program.thumbnail && (
                    <img src={program.thumbnail} alt={program.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">{program.domain}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">{program.mode}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${program.feeType === "free" ? "bg-emerald-100 text-emerald-700" : program.feeType === "stipend" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                        {program.feeType === "free" ? "Free" : program.feeType === "stipend" ? `Stipend: ₹${program.feeAmount}/mo` : `Fee: ₹${program.feeAmount}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{program.title}</h3>
                    {program.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span>⏱ {program.duration} days</span>
                      <span>👥 {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}</span>
                    </div>
                    <Link href="/register" className="block text-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
                      Apply for this Program
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
