import { useNavigate } from 'react-router-dom';
import { Facebook, Instagram, ShoppingBag, ShoppingCart } from 'lucide-react';

const integrations = [
  { name: 'Facebook', description: 'Connect your Facebook Page for messaging', icon: Facebook, color: 'bg-blue-500', path: '/facebook' },
  { name: 'Instagram', description: 'Connect Instagram Business Account', icon: Instagram, color: 'bg-gradient-to-tr from-purple-600 to-pink-500', path: '/instagram' },
  { name: 'Shopify', description: 'Sync products and orders from Shopify', icon: ShoppingBag, color: 'bg-green-600', path: '/integrations' },
  { name: 'WooCommerce', description: 'Connect your WooCommerce store', icon: ShoppingCart, color: 'bg-purple-600', path: '/integrations' },
];

export default function IntegrationsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold dark:text-white">Integrations</h1><p className="text-sm text-gray-500 mt-1">Connect third-party services</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.name} onClick={() => navigate(integration.path)} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition border dark:border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
                <integration.icon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold dark:text-white">{integration.name}</h3>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
            </div>
            <button className="w-full py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-lg">
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
