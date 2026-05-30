"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Search, File } from "lucide-react";

const documents = [
  { id: "1", name: "Product Catalog 2024.pdf", size: "2.4 MB", type: "pdf", agent: "Sales Agent", uploaded: "2024-03-01", pages: 45 },
  { id: "2", name: "FAQ Document.docx", size: "1.1 MB", type: "docx", agent: "Support Bot", uploaded: "2024-02-15", pages: 12 },
  { id: "3", name: "Pricing Guide.pdf", size: "890 KB", type: "pdf", agent: "Sales Agent", uploaded: "2024-02-20", pages: 8 },
  { id: "4", name: "Company Policies.txt", size: "256 KB", type: "txt", agent: "All Agents", uploaded: "2024-01-10", pages: 5 },
  { id: "5", name: "Return Policy.pdf", size: "320 KB", type: "pdf", agent: "Support Bot", uploaded: "2024-03-05", pages: 3 },
  { id: "6", name: "Customer Contacts.csv", size: "1.8 MB", type: "csv", agent: "Lead Qualifier", uploaded: "2024-03-10", pages: 0 },
];

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState("");

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSize = "6.7 MB";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
          <p className="text-gray-400">Upload documents to train your AI agents with custom knowledge</p>
        </div>
        <Button className="bg-[#00d4aa] text-black hover:bg-[#00b894]">
          <Upload className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Documents</p>
          <p className="text-2xl font-bold text-white mt-1">{documents.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Total Size</p>
          <p className="text-2xl font-bold text-white mt-1">{totalSize}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50 p-4">
          <p className="text-sm text-gray-400">Storage Used</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/10">
              <div className="h-full w-[13%] rounded-full bg-[#00d4aa]" />
            </div>
            <span className="text-sm text-gray-400">13%</span>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="rounded-xl border border-dashed border-white/20 bg-[#1a1f2e]/30 p-8 text-center">
        <Upload className="h-10 w-10 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-300 mb-1">Drag & drop files here or click to browse</p>
        <p className="text-xs text-gray-500 mb-4">Supports PDF, DOCX, TXT, CSV (Max 50MB per file)</p>
        <Button variant="outline" className="border-white/20 text-gray-300">
          Browse Files
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#1a1f2e] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#00d4aa] focus:outline-none"
        />
      </div>

      {/* Documents List */}
      <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/50">
        <div className="divide-y divide-white/5">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  {doc.type === "pdf" ? (
                    <FileText className="h-5 w-5 text-red-400" />
                  ) : doc.type === "csv" ? (
                    <File className="h-5 w-5 text-green-400" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {doc.size} &middot; {doc.agent} &middot; Uploaded {doc.uploaded}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="border-white/20 text-gray-300 h-8">
                  View
                </Button>
                <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
