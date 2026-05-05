"use client";

import { useState, useEffect, useCallback } from "react";

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  order: number;
  batchId: string;
}

interface Batch {
  id: string;
  name: string;
  program: { title: string };
}

const typeIcons: Record<string, string> = {
  video: "🎥",
  pdf: "📄",
  link: "🔗",
  document: "📋",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batchId: "", title: "", type: "video", url: "", order: "0" });

  const fetchData = useCallback(async () => {
    const [resRes, batchesRes] = await Promise.all([
      fetch("/api/resources"),
      fetch("/api/batches"),
    ]);
    if (resRes.ok) setResources(await resRes.json());
    if (batchesRes.ok) setBatches(await batchesRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ batchId: "", title: "", type: "video", url: "", order: "0" });
      fetchData();
    }
  };

  const groupedByBatch: Record<string, Resource[]> = {};
  resources.forEach((r) => {
    if (!groupedByBatch[r.batchId]) groupedByBatch[r.batchId] = [];
    groupedByBatch[r.batchId].push(r);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
          <p className="text-gray-600 text-sm">Pre-recorded videos, PDFs, and study materials</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
          {showForm ? "Cancel" : "+ Add Resource"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="video">Video (Pre-recorded)</option>
                <option value="pdf">PDF Document</option>
                <option value="link">External Link</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://youtube.com/..." required />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Add Resource</button>
        </form>
      )}

      {resources.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <p className="text-4xl mb-4">🎥</p>
          <p className="text-gray-600">No resources yet. Add pre-recorded videos and study materials.</p>
        </div>
      ) : (
        Object.entries(groupedByBatch).map(([batchId, batchResources]) => {
          const batch = batches.find((b) => b.id === batchId);
          return (
            <div key={batchId} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {batch ? `${batch.program.title} - ${batch.name}` : "Resources"}
              </h2>
              <div className="space-y-3">
                {batchResources.sort((a, b) => a.order - b.order).map((resource, idx) => (
                  <div key={resource.id} className="bg-white rounded-xl p-4 border border-gray-100 card-hover flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl shrink-0">
                      {typeIcons[resource.type] || "📁"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                        <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{resource.type}</span>
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      {resource.type === "video" ? "Watch" : "Open"} →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
