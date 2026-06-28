import { Code, ExternalLink, Copy } from 'lucide-react';

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', description: 'Authenticate user and get JWT token' },
  { method: 'POST', path: '/api/auth/register', description: 'Register a new vendor account' },
  { method: 'GET', path: '/api/contacts', description: 'List all contacts for the vendor' },
  { method: 'POST', path: '/api/contacts', description: 'Create a new contact' },
  { method: 'GET', path: '/api/contacts/:id', description: 'Get contact details' },
  { method: 'PUT', path: '/api/contacts/:id', description: 'Update contact' },
  { method: 'DELETE', path: '/api/contacts/:id', description: 'Delete contact' },
  { method: 'GET', path: '/api/contact-groups', description: 'List contact groups' },
  { method: 'POST', path: '/api/contact-groups', description: 'Create contact group' },
  { method: 'GET', path: '/api/templates', description: 'List WhatsApp message templates' },
  { method: 'POST', path: '/api/templates', description: 'Create a new template' },
  { method: 'DELETE', path: '/api/templates/:name', description: 'Delete template' },
  { method: 'POST', path: '/api/messages/send', description: 'Send a WhatsApp message' },
  { method: 'POST', path: '/api/messages/send-template', description: 'Send a template message' },
  { method: 'GET', path: '/api/campaigns', description: 'List campaigns' },
  { method: 'POST', path: '/api/campaigns', description: 'Create campaign' },
  { method: 'GET', path: '/api/analytics/dashboard', description: 'Get dashboard analytics' },
  { method: 'GET', path: '/api/message-logs', description: 'Get message logs' },
  { method: 'POST', path: '/webhook/whatsapp/:vendorUid', description: 'WhatsApp webhook endpoint' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function ApiDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Code className="text-indigo-600" /> API Documentation
        </h1>
        <p className="text-gray-500 text-sm mt-1">REST API reference for WabaPanel integration</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-2">Authentication</h2>
        <p className="text-sm text-gray-600 mb-4">
          All API requests require a Bearer token in the Authorization header.
          Get your token by calling the login endpoint.
        </p>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-6">
          <span className="text-gray-400">Authorization:</span> Bearer {'<your_jwt_token>'}
        </div>

        <h2 className="text-lg font-semibold mb-4">Endpoints</h2>
        <div className="space-y-2">
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <span className={`px-2 py-1 rounded text-xs font-bold min-w-[56px] text-center ${METHOD_COLORS[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono text-gray-800 flex-1">{ep.path}</code>
              <span className="text-sm text-gray-500">{ep.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-2">Webhook Events</h2>
        <p className="text-sm text-gray-600 mb-4">WhatsApp webhook events are forwarded to your configured webhook URL</p>
        <div className="space-y-2 text-sm">
          <div className="bg-gray-50 rounded p-3"><code>message.received</code> - Incoming message from a contact</div>
          <div className="bg-gray-50 rounded p-3"><code>message.status</code> - Message delivery status update (sent/delivered/read)</div>
          <div className="bg-gray-50 rounded p-3"><code>contact.created</code> - New contact added</div>
          <div className="bg-gray-50 rounded p-3"><code>campaign.completed</code> - Campaign finished sending</div>
        </div>
      </div>
    </div>
  );
}
