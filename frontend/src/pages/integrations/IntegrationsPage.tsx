import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plug, Trash2, X, ShoppingBag, ShoppingCart, Globe, CheckCircle, Link2 } from 'lucide-react';

export default function IntegrationsPage() {
  const [showConnect, setShowConnect] = useState<string | null>(null);
  const [formData, setFormData] = useState({ shopDomain: '', accessToken: '', storeUrl: '', consumerKey: '', consumerSecret: '' });
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/integrations/shopify/connect', { shopDomain: formData.shopDomain, accessToken: formData.accessToken });
      toast.success('Shopify connected!');
      setShowConnect(null);
      setConnected({ ...connected, shopify: true });
    } catch { toast.error('Failed to connect Shopify'); }
  };

  const handleConnectWooCommerce = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/integrations/woocommerce/connect', { storeUrl: formData.storeUrl, consumerKey: formData.consumerKey, consumerSecret: formData.consumerSecret });
      toast.success('WooCommerce connected!');
      setShowConnect(null);
      setConnected({ ...connected, woocommerce: true });
    } catch { toast.error('Failed to connect WooCommerce'); }
  };

  const handleDisconnect = async (type: string) => {
    if (!confirm(`Disconnect ${type}?`)) return;
    try {
      await api.delete(`/integrations/${type}/disconnect`);
      toast.success('Disconnected');
      setConnected({ ...connected, [type]: false });
    } catch { toast.error('Failed'); }
  };

  const integrations = [
    { type: 'shopify', name: 'Shopify', desc: 'Sync products and orders from your Shopify store', icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
    { type: 'woocommerce', name: 'WooCommerce', desc: 'WordPress e-commerce integration for orders and products', icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
    { type: 'webhook', name: 'Custom Webhook', desc: 'Connect any external service via webhooks', icon: Link2, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { type: 'zapier', name: 'Zapier', desc: 'Connect 5000+ apps via Zapier automations', icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Integrations</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect external services and e-commerce platforms</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(intg => (
          <div key={intg.type} className={`rounded-xl p-6 border ${intg.bg} dark:bg-slate-800 dark:border-slate-700`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${intg.bg}`}><intg.icon size={24} className={intg.color} /></div>
              <div>
                <h3 className="font-semibold dark:text-white">{intg.name}</h3>
                {connected[intg.type] && <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12} /> Connected</span>}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">{intg.desc}</p>
            <div className="flex gap-2">
              {connected[intg.type] ? (
                <>
                  <button className="flex-1 py-2 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300">Settings</button>
                  <button onClick={() => handleDisconnect(intg.type)} className="py-2 px-3 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50"><Trash2 size={14} /></button>
                </>
              ) : (
                <button onClick={() => setShowConnect(intg.type)} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Connect</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Webhook Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
        <h3 className="font-semibold dark:text-white mb-2">Webhook Endpoints</h3>
        <p className="text-sm text-gray-500 mb-4">Use these webhook URLs to receive events from external services</p>
        <div className="space-y-2">
          {[
            { label: 'Shopify Webhook', url: '/api/integrations/shopify/webhook/{vendorId}' },
            { label: 'WooCommerce Webhook', url: '/api/integrations/woocommerce/webhook/{vendorId}' },
            { label: 'WhatsApp Webhook', url: '/api/webhook/whatsapp/{vendorUid}' },
          ].map(wh => (
            <div key={wh.label} className="flex items-center justify-between py-2 border-b dark:border-slate-700">
              <span className="text-sm dark:text-gray-300">{wh.label}</span>
              <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{wh.url}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Shopify Connect Modal */}
      {showConnect === 'shopify' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Connect Shopify</h3><button onClick={() => setShowConnect(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleConnectShopify} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Shop Domain *</label><input value={formData.shopDomain} onChange={e => setFormData({...formData, shopDomain: e.target.value})} required placeholder="mystore.myshopify.com" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Access Token *</label><input value={formData.accessToken} onChange={e => setFormData({...formData, accessToken: e.target.value})} required type="password" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">Connect Shopify</button>
                <button type="button" onClick={() => setShowConnect(null)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WooCommerce Connect Modal */}
      {showConnect === 'woocommerce' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Connect WooCommerce</h3><button onClick={() => setShowConnect(null)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleConnectWooCommerce} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Store URL *</label><input value={formData.storeUrl} onChange={e => setFormData({...formData, storeUrl: e.target.value})} required placeholder="https://mystore.com" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Consumer Key *</label><input value={formData.consumerKey} onChange={e => setFormData({...formData, consumerKey: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Consumer Secret *</label><input value={formData.consumerSecret} onChange={e => setFormData({...formData, consumerSecret: e.target.value})} required type="password" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium">Connect WooCommerce</button>
                <button type="button" onClick={() => setShowConnect(null)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generic Connect Modal (Webhook, Zapier) */}
      {(showConnect === 'webhook' || showConnect === 'zapier') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Connect {showConnect === 'webhook' ? 'Webhook' : 'Zapier'}</h3><button onClick={() => setShowConnect(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="text-center py-8">
              <Plug size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Use the webhook URL provided above to connect your {showConnect === 'webhook' ? 'external service' : 'Zapier zaps'}.</p>
              <button onClick={() => setShowConnect(null)} className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
