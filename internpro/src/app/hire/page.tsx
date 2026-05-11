"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Job { id: string; title: string; company: string; description: string; location?: string; salary?: string; type: string; skills?: string; createdAt: string; }

export default function HirePage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => { fetch("/api/jobs?public=true").then(r => r.json()).then(setJobs); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">InternPro</Link>
          <div className="flex gap-4">
            <Link href="/programs" className="text-sm text-gray-600 hover:text-indigo-600">Programs</Link>
            <Link href="/hire" className="text-sm text-indigo-600 font-medium">Hire Our Interns</Link>
            <Link href="/login" className="text-sm bg-[#0EA5B8] text-white px-4 py-2 rounded-lg">Login</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hire Our Trained Interns</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Our interns are trained in live projects and ready to contribute from day one. Post your openings or browse available talent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl p-6 border hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <p className="text-sm text-indigo-600 mb-2">{job.company}</p>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{job.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {job.location && <span className="text-xs bg-gray-100 px-2 py-1 rounded">📍 {job.location}</span>}
                {job.salary && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">💰 {job.salary}</span>}
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{job.type}</span>
              </div>
              {job.skills && <div className="flex flex-wrap gap-1">{job.skills.split(",").map((s, i) => <span key={i} className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{s.trim()}</span>)}</div>}
              <Link href="/login" className="mt-4 block text-center w-full py-2 bg-[#0EA5B8] text-white rounded-lg text-sm hover:bg-[#0891b2]">Apply Now</Link>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-400 mb-4">No open positions right now</p>
            <p className="text-gray-500">Check back soon or contact us at hari@kkhsmedia.com</p>
          </div>
        )}
      </div>
    </div>
  );
}
