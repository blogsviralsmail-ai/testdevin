"use client";
import { useState, useEffect, use } from "react";

interface PortfolioData {
  profile: { id: string; name: string; email: string; avatar?: string; collegeName?: string; degree?: string; year?: string };
  skills: string[];
  programs: { title: string; domain: string; duration: number; status: string; certificates: { certNumber: string; type: string; issueDate: string }[]; topSubmissions: { id: string; task: { title: string }; percentage: number | null; createdAt: string }[] }[];
  quizzes: { title: string; score: number; completedAt: string | null }[];
}

export default function PortfolioPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portfolio/${userId}`).then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading portfolio...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Portfolio not found.</div>;

  const { profile, skills, programs, quizzes } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto">
            {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : profile.name[0]}
          </div>
          <h1 className="text-2xl font-bold mt-4">{profile.name}</h1>
          {profile.collegeName && <p className="text-sm text-gray-500">{profile.collegeName}{profile.degree ? ` — ${profile.degree}` : ""}</p>}
          <p className="text-sm text-gray-400 mt-1">{profile.email}</p>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {skills.map(s => <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{s}</span>)}
            </div>
          )}
        </div>

        {/* Programs */}
        <h2 className="text-lg font-bold mt-8 mb-4">Internship Programs</h2>
        <div className="space-y-4">
          {programs.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-xs text-gray-400">{p.domain} &middot; {p.duration} days</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${p.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{p.status}</span>
              </div>

              {/* Certificates */}
              {p.certificates.length > 0 && (
                <div className="mt-3">
                  {p.certificates.map(c => (
                    <span key={c.certNumber} className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded mr-2">
                      🏅 {c.type} Certificate — {c.certNumber}
                    </span>
                  ))}
                </div>
              )}

              {/* Top Submissions */}
              {p.topSubmissions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Recent Work:</p>
                  <div className="flex flex-wrap gap-2">
                    {p.topSubmissions.slice(0, 5).map(s => (
                      <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {s.task.title} {s.percentage ? `(${s.percentage}%)` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quizzes */}
        {quizzes.length > 0 && (
          <>
            <h2 className="text-lg font-bold mt-8 mb-4">Quiz Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quizzes.map((q, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border text-center">
                  <p className="text-sm font-medium text-gray-900">{q.title}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{q.score}%</p>
                  <p className="text-xs text-gray-400 mt-1">Passed</p>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-12">Powered by InternPro</p>
      </div>
    </div>
  );
}
