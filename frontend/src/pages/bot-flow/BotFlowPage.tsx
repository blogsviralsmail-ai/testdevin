import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Workflow, Plus, Edit, Trash2, X, ToggleLeft, ToggleRight, Play, Settings } from 'lucide-react';

interface BotFlow { id: number; uid: string; name: string; trigger_type: string; trigger_value: string; flow_data: string; status: number; created_at: string; }

export default function BotFlowPage() {
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editFlow, setEditFlow] = useState<BotFlow | null>(null);
  const [showEditor, setShowEditor] = useState<BotFlow | null>(null);
  const [formData, setFormData] = useState({ name: '', triggerType: 'keyword', triggerValue: '', flowData: '{"nodes":[],"edges":[]}' });

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/bot-flows'); const d = data.data || data; setFlows(d.items || d.data || d || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editFlow) { await api.put(`/bot-flows/${editFlow.id}`, formData); toast.success('Updated'); }
      else { await api.post('/bot-flows', formData); toast.success('Created'); }
      setShowCreate(false); setEditFlow(null); setFormData({ name: '', triggerType: 'keyword', triggerValue: '', flowData: '{"nodes":[],"edges":[]}' }); fetchFlows();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/bot-flows/${id}`); toast.success('Deleted'); fetchFlows(); } catch { toast.error('Failed'); }
  };

  const handleToggle = async (flow: BotFlow) => {
    try { await api.put(`/bot-flows/${flow.id}`, { status: flow.status === 1 ? 0 : 1 }); toast.success(flow.status === 1 ? 'Disabled' : 'Enabled'); fetchFlows(); }
    catch { toast.error('Failed'); }
  };

  const triggerTypes = ['keyword', 'welcome', 'fallback', 'button_reply', 'list_reply'];
  const nodeTypes = [
    { type: 'message', label: 'Send Message', color: 'bg-blue-100 text-blue-700' },
    { type: 'condition', label: 'Condition', color: 'bg-yellow-100 text-yellow-700' },
    { type: 'delay', label: 'Delay', color: 'bg-purple-100 text-purple-700' },
    { type: 'api_call', label: 'API Call', color: 'bg-orange-100 text-orange-700' },
    { type: 'human_handoff', label: 'Human Handoff', color: 'bg-red-100 text-red-700' },
  ];

  const parseFlowData = (flowDataStr: string) => {
    try { return JSON.parse(flowDataStr || '{"nodes":[],"edges":[]}'); } catch { return { nodes: [], edges: [] }; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Bot Flow Builder</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create visual conversation flows</p></div>
        <button onClick={() => { setShowCreate(true); setEditFlow(null); setFormData({ name: '', triggerType: 'keyword', triggerValue: '', flowData: '{"nodes":[],"edges":[]}' }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Flow</button>
      </div>

      {/* Node Types Reference */}
      <div className="flex gap-2 flex-wrap">
        {nodeTypes.map(n => (
          <span key={n.type} className={`px-3 py-1 rounded-full text-xs font-medium ${n.color}`}>{n.label}</span>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : flows.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Workflow size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No bot flows yet. Create your first conversation flow!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map(flow => {
            const data = parseFlowData(flow.flow_data);
            return (
              <div key={flow.id} className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border dark:border-slate-700 ${flow.status !== 1 ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="text-emerald-500" size={20} />
                    <h3 className="font-semibold dark:text-white">{flow.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(flow)} className="p-1">{flow.status === 1 ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400" />}</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Trigger: {flow.trigger_type}</span>
                  {flow.trigger_value && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{flow.trigger_value}</span>}
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">{data.nodes?.length || 0} nodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEditor(flow)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs hover:bg-emerald-100"><Settings size={14} /> Edit Flow</button>
                  <button onClick={() => { setEditFlow(flow); setShowCreate(true); setFormData({ name: flow.name, triggerType: flow.trigger_type, triggerValue: flow.trigger_value || '', flowData: flow.flow_data || '{"nodes":[],"edges":[]}' }); }} className="p-1.5 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(flow.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editFlow ? 'Edit' : 'Create'} Bot Flow</h3><button onClick={() => { setShowCreate(false); setEditFlow(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Flow Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Trigger Type</label>
                  <select value={formData.triggerType} onChange={e => setFormData({...formData, triggerType: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    {triggerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Trigger Value</label><input value={formData.triggerValue} onChange={e => setFormData({...formData, triggerValue: e.target.value})} placeholder="e.g. hello" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Flow Data (JSON)</label><textarea value={formData.flowData} onChange={e => setFormData({...formData, flowData: e.target.value})} rows={8} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-mono" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editFlow ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditFlow(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Flow Editor: {showEditor.name}</h3><button onClick={() => setShowEditor(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-8 min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600">
              <div className="text-center">
                <Workflow size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">Visual Flow Builder</p>
                <p className="text-sm text-gray-400 mb-4">Drag and drop nodes to create conversation flows</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {nodeTypes.map(n => (
                    <button key={n.type} className={`px-4 py-2 rounded-lg text-sm font-medium ${n.color} cursor-grab`}>{n.label}</button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">Nodes: {parseFlowData(showEditor.flow_data).nodes?.length || 0} | Edges: {parseFlowData(showEditor.flow_data).edges?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
