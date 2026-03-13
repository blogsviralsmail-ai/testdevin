import { useState, useEffect } from "react";
import axios from "axios";
import { Server, Eye, Trash2, X, Globe, Users, RefreshCw, Activity } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("platform_token");
}

interface Installation {
  id: number;
  instance_id: string;
  name: string;
  domain: string;
  server_ip: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  company_name: string;
  version: string;
  total_students: number;
  total_enquiries: number;
  total_leads: number;
  total_universities: number;
  total_users: number;
  status: string;
  last_sync_at: string;
  created_at: string;
}

export default function PlatformInstallations() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewInst, setViewInst] = useState<Installation | null>(null);

  const headers = { Authorization: `Bearer ${getToken()}` };

  const loadInstallations = () => {
    setLoading(true);
    axios.get(`${API}/api/platform/remote/installations`, { headers })
      .then(r => setInstallations(r.data.installations || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInstallations(); }, []);

  const handleDeactivate = async (instanceId: string) => {
    if (!confirm("Are you sure you want to deactivate this installation?")) return;
    try {
      await axios.delete(`${API}/api/platform/remote/installations/${instanceId}`, { headers });
      loadInstallations();
    } catch { /* ignore */ }
  };

  const viewDetails = async (instanceId: string) => {
    try {
      const r = await axios.get(`${API}/api/platform/remote/installations/${instanceId}`, { headers });
      setViewInst(r.data.installation || r.data);
    } catch { /* ignore */ }
  };

  const timeSince = (dateStr: string) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Remote Installations</h1>
        <button onClick={loadInstallations}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2.5 rounded-lg">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Servers</p>
              <p className="text-xl font-bold">{installations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2.5 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold">{installations.filter(i => i.status === "active").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2.5 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students (All Servers)</p>
              <p className="text-xl font-bold">{installations.reduce((s, i) => s + (i.total_students || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Installations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {installations.map(inst => (
          <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Server className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{inst.name}</h3>
                  <p className="text-xs text-gray-500">{inst.company_name || inst.domain}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${inst.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {inst.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                <a href={`https://${inst.domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {inst.domain}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                <span>{inst.total_students} students, {inst.total_users} users</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Last sync: {timeSince(inst.last_sync_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span>IP: {inst.server_ip || "Unknown"}</span>
              <span>|</span>
              <span>v{inst.version}</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => viewDetails(inst.instance_id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition">
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              {inst.status === "active" ? (
                <button onClick={() => handleDeactivate(inst.instance_id)} className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition">
                  <Trash2 className="h-3.5 w-3.5" /> Deactivate
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {installations.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Server className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No remote installations yet.</p>
            <p className="text-xs text-gray-400 mt-1">When clients deploy Education Hub on their servers, they'll appear here.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold">{viewInst.name}</h2>
              <button onClick={() => setViewInst(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Domain:</span> <span className="font-medium">{viewInst.domain}</span></div>
                <div><span className="text-gray-500">Server IP:</span> <span className="font-medium">{viewInst.server_ip}</span></div>
                <div><span className="text-gray-500">Admin:</span> <span className="font-medium">{viewInst.admin_name}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{viewInst.admin_email}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{viewInst.admin_phone || "-"}</span></div>
                <div><span className="text-gray-500">Version:</span> <span className="font-medium">v{viewInst.version}</span></div>
                <div><span className="text-gray-500">Status:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${viewInst.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {viewInst.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <div><span className="text-gray-500">Instance ID:</span> <span className="font-medium text-xs">{viewInst.instance_id}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">Statistics</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{viewInst.total_students}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{viewInst.total_users}</p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{viewInst.total_enquiries}</p>
                    <p className="text-xs text-gray-500">Enquiries</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center mt-3">
                  <div>
                    <p className="text-xl font-bold text-amber-600">{viewInst.total_leads}</p>
                    <p className="text-xs text-gray-500">Leads</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-indigo-600">{viewInst.total_universities}</p>
                    <p className="text-xs text-gray-500">Universities</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-1">Access URL</h3>
                <a href={`https://${viewInst.domain}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm">
                  https://{viewInst.domain}
                </a>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <div>Last Sync: {viewInst.last_sync_at ? new Date(viewInst.last_sync_at).toLocaleString() : "Never"}</div>
                <div>Registered: {new Date(viewInst.created_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
