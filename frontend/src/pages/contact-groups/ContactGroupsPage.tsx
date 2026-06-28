import { useState, useEffect } from 'react';
import { UsersRound, Plus, Trash2, Edit, Users } from 'lucide-react';
import api from '../../services/api';

export default function ContactGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contact-groups').then((r: any) => setGroups(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersRound className="text-green-600" /> Contact Groups
          </h1>
          <p className="text-gray-500 text-sm mt-1">Organize contacts into groups for targeted campaigns</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus size={16} /> Create Group
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <UsersRound size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No contact groups yet. Create your first group!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 p-6">
            {groups.map(g => (
              <div key={g.id || g._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{g.title || g.name}</h3>
                    <p className="text-xs text-gray-500">{g.contacts_count || 0} contacts</p>
                  </div>
                </div>
                {g.description && <p className="text-sm text-gray-500 mb-3">{g.description}</p>}
                <div className="flex gap-2 pt-2 border-t">
                  <button className="text-blue-500 text-sm flex items-center gap-1"><Edit size={14} /> Edit</button>
                  <button className="text-red-500 text-sm flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
