"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Trash2, Search, Loader2, Eye, EyeOff, Plus } from "lucide-react";

interface KnowledgeDoc {
  id: string;
  agent_id: string;
  name: string;
  content: string;
  type: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"text" | "file">("text");
  const [saving, setSaving] = useState(false);
  const [newDoc, setNewDoc] = useState({ agent_id: "", name: "", content: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadDocs();
    loadAgents();
  }, []);

  async function loadDocs() {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load knowledge docs:", err);
    }
    setLoading(false);
  }

  async function loadAgents() {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  }

  async function handleAdd() {
    if (!newDoc.agent_id || !newDoc.name || !newDoc.content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: newDoc.agent_id,
          name: newDoc.name,
          content: newDoc.content,
          type: addMode,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewDoc({ agent_id: "", name: "", content: "" });
        loadDocs();
      }
    } catch (err) {
      console.error("Failed to add knowledge:", err);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this knowledge document?")) return;
    try {
      await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      loadDocs();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewDoc((prev) => ({ ...prev, name: file.name }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewDoc((prev) => ({ ...prev, content: ev.target?.result as string }));
    };
    reader.readAsText(file);
  }

  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  const filtered = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase())
  );

  const totalChars = docs.reduce((sum, d) => sum + d.content.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
          <p className="text-gray-400">
            Add product info, FAQs, and documents to train your AI agents
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-[#00d4aa] text-black hover:bg-[#00b894]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Knowledge
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Documents</p>
          <p className="text-2xl font-bold text-white mt-1">{docs.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Content</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalChars > 1000
              ? `${(totalChars / 1000).toFixed(1)}K chars`
              : `${totalChars} chars`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Agents with Knowledge</p>
          <p className="text-2xl font-bold text-white mt-1">
            {new Set(docs.map((d) => d.agent_id)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search knowledge..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#1a1f2e] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#00d4aa] focus:outline-none"
        />
      </div>

      {/* Documents List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-[#1a1f2e]/30 p-8 text-center">
          <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 mb-1">No knowledge documents yet</p>
          <p className="text-xs text-gray-500 mb-4">
            Add text content or upload files to train your agents
          </p>
          <Button
            onClick={() => setShowAdd(true)}
            className="bg-[#00d4aa] text-black hover:bg-[#00b894]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add First Document
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
          <div className="divide-y divide-white/5">
            {filtered.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 shrink-0">
                      <FileText className="h-5 w-5 text-[#00d4aa]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{doc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {agentMap.get(doc.agent_id) || "Unknown Agent"} &middot;{" "}
                        {doc.type} &middot;{" "}
                        {doc.content.length > 1000
                          ? `${(doc.content.length / 1000).toFixed(1)}K chars`
                          : `${doc.content.length} chars`}{" "}
                        &middot; {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {expandedId !== doc.id && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {doc.content.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExpandedId(expandedId === doc.id ? null : doc.id)
                      }
                      className="border-white/20 text-gray-300 h-8"
                    >
                      {expandedId === doc.id ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc.id)}
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {expandedId === doc.id && (
                  <div className="mt-3 ml-13 p-3 rounded-lg bg-[#0a0f1a] border border-white/5">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                      {doc.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Knowledge Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                Add Knowledge
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode("text")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  addMode === "text"
                    ? "bg-[#00d4aa] text-black"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Manual Text
              </button>
              <button
                onClick={() => setAddMode("file")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  addMode === "file"
                    ? "bg-[#00d4aa] text-black"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Upload className="inline h-3 w-3 mr-1" /> Upload File
              </button>
            </div>

            {/* Agent Selection */}
            <div>
              <Label className="text-gray-400">Assign to Agent</Label>
              <select
                value={newDoc.agent_id}
                onChange={(e) =>
                  setNewDoc({ ...newDoc, agent_id: e.target.value })
                }
                className="mt-1 w-full rounded-md bg-[#0a0f1a] border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="">Select an agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <Label className="text-gray-400">Title / Name</Label>
              <Input
                value={newDoc.name}
                onChange={(e) =>
                  setNewDoc({ ...newDoc, name: e.target.value })
                }
                placeholder="e.g., Product Price List, FAQ, Company Info"
                className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
              />
            </div>

            {/* Content */}
            {addMode === "text" ? (
              <div>
                <Label className="text-gray-400">Content</Label>
                <Textarea
                  value={newDoc.content}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, content: e.target.value })
                  }
                  placeholder={`Paste your product info, FAQ, pricing here...\n\nExample:\nProduct: Italian Marble Tiles\nPrice: ₹85/sqft\nSizes: 2x2, 2x4, 4x4\nColors: White, Beige, Grey`}
                  rows={10}
                  className="mt-1 bg-[#0a0f1a] border-white/10 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newDoc.content.length} characters
                </p>
              </div>
            ) : (
              <div>
                <Label className="text-gray-400">
                  Upload File (.txt, .csv, .md)
                </Label>
                <div className="mt-2 rounded-lg border border-dashed border-white/20 bg-[#0a0f1a] p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".txt,.csv,.md,.text"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[#00d4aa] file:text-black hover:file:bg-[#00b894]"
                  />
                </div>
                {newDoc.content && (
                  <p className="text-xs text-green-400 mt-2">
                    File loaded: {newDoc.content.length} characters
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowAdd(false)}
                className="text-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  saving ||
                  !newDoc.agent_id ||
                  !newDoc.name ||
                  !newDoc.content
                }
                className="bg-[#00d4aa] text-black hover:bg-[#00b894]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" /> Save Knowledge
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
