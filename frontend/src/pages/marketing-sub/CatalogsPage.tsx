import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketing/catalogs').then((r: any) => setCatalogs(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-orange-600" /> Product Catalogs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage product catalogs for WhatsApp Commerce</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700">
          <Plus size={16} /> Add Catalog
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : catalogs.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Catalogs Yet</h3>
            <p className="text-gray-400 mt-2">Create product catalogs to showcase your products on WhatsApp</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {catalogs.map((cat: any) => (
              <div key={cat.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.products_count || 0} products</p>
                <div className="flex gap-2 mt-3">
                  <button className="text-blue-500 text-sm"><Edit size={14} /></button>
                  <button className="text-red-500 text-sm"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
