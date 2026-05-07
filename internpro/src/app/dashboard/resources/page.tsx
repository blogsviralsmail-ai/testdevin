"use client";

import { useState, useEffect, useCallback } from "react";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  fileUrl: string | null;
  dayNumber: number | null;
  order: number;
  batchId: string;
}

interface Batch {
  id: string;
  name: string;
  program: { title: string };
}

interface UserSession {
  id: string;
  role: string;
}

const typeIcons: Record<string, string> = {
  video: "🎥",
  pdf: "📄",
  link: "🔗",
  document: "📋",
  image: "🖼️",
  word: "📝",
  excel: "📊",
  ppt: "📑",
  file: "📎",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batchId: "", title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0" });
  const [fileUploading, setFileUploading] = useState(false);

  const fetchData = useCallback(async () => {
    const [resRes, batchesRes, meRes] = await Promise.all([
      fetch("/api/resources"),
      fetch("/api/batches"),
      fetch("/api/auth/me"),
    ]);
    if (resRes.ok) setResources(await resRes.json());
    if (batchesRes.ok) setBatches(await batchesRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dayNumber: form.dayNumber ? parseInt(form.dayNumber) : undefined,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ batchId: "", title: "", type: "video", url: "", fileUrl: "", dayNumber: "", order: "0" });
      fetchData();
    }
  };

  const isStudent = user?.role === "student";

  // Group resources by day number
  const dayGroups: Record<string, Resource[]> = {};
  const generalResources: Resource[] = [];
  resources.forEach((r) => {
    if (r.dayNumber) {
      const key = `Day ${r.dayNumber}`;
      if (!dayGroups[key]) dayGroups[key] = [];
      dayGroups[key].push(r);
    } else {
      generalResources.push(r);
    }
  });

  const sortedDays = Object.keys(dayGroups).sort((a, b) => {
    const numA = parseInt(a.replace("Day ", ""));
    const numB = parseInt(b.replace("Day ", ""));
    return numA - numB;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStudent ? "Study Material" : "Learning Resources"}
          </h1>
          <p className="text-gray-600 text-sm">
            {isStudent
              ? "Day-wise study materials — complete each day sequentially like office attendance"
              : "Manage day-based pre-recorded videos and study materials"}
          </p>
        </div>
        {!isStudent && (
          <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
            {showForm ? "Cancel" : "+ Add Resource"}
          </button>
        )}
      </div>

      {/* Info Banner for Students */}
      {isStudent && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <strong>Note:</strong> Materials are unlocked day by day based on your working days. You cannot skip ahead — just like coming to office daily. If you were on leave, you will see the missed materials but your task will be for your current working day.
        </div>
      )}

      {/* Add Resource Form (Admin/TeamLeader) */}
      {showForm && !isStudent && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Resource</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.program.title} - {b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
              <input type="number" min="1" value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 1, 2, 3..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
                <option value="video">Video (Pre-recorded)</option>
                <option value="pdf">PDF Document</option>
                <option value="link">External Link</option>
                <option value="document">Document</option>
                <option value="image">Image / Photo</option>
                <option value="word">Word Document</option>
                <option value="excel">Excel / Spreadsheet</option>
                <option value="ppt">PowerPoint / PPT</option>
                <option value="file">Other File (any format)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL / File Link</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="YouTube/Drive/Dropbox link, or any file URL" required />
              <div className="flex items-center gap-3 mt-2">
                <label className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium border border-indigo-200 rounded-lg px-3 py-1.5 inline-block">
                  {fileUploading ? "Uploading..." : "Or Upload File"}
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setFileUploading(true);
                    const fd = new FormData(); fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) {
                      const d = await res.json();
                      setForm({...form, fileUrl: d.url, url: d.url});
                    }
                    setFileUploading(false);
                  }} />
                </label>
                {form.fileUrl && <span className="text-xs text-green-600">File uploaded: {form.fileUrl}</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">Koi bhi format ka file link — YouTube, Google Drive, Dropbox, direct URL ya file upload karo</p>
            </div>
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Add Resource</button>
        </form>
      )}

      {resources.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border text-center">
          <p className="text-4xl mb-4">🎥</p>
          <p className="text-gray-600">{isStudent ? "No study materials available yet." : "No resources yet. Add pre-recorded videos and study materials."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Day-based Resources */}
          {sortedDays.map((dayLabel) => (
            <div key={dayLabel} className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-indigo-50 px-6 py-3 border-b">
                <h2 className="text-base font-semibold text-indigo-900">{dayLabel}</h2>
              </div>
              <div className="divide-y">
                {dayGroups[dayLabel].map((resource) => (
                  <div key={resource.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeIcons[resource.type] || "📎"}</span>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                        <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                      </div>
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      Open →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* General Resources (no day number) */}
          {generalResources.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="text-base font-semibold text-gray-700">General Resources</h2>
              </div>
              <div className="divide-y">
                {generalResources.map((resource) => (
                  <div key={resource.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeIcons[resource.type] || "📎"}</span>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                        <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                      </div>
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      Open →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
