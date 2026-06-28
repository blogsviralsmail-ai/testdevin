import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { QrCode, Download, Copy, RefreshCw } from 'lucide-react';

export default function QrCodePage() {
  const [qrData, setQrData] = useState<{ qr_url: string; phone_number: string; deep_link: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { (async () => { try { const { data } = await api.get('/whatsapp/qr-code'); setQrData(data.data || data); } catch {} finally { setLoading(false); } })(); }, []);

  const generateQr = async () => {
    setLoading(true);
    try { const { data } = await api.post('/whatsapp/qr-code', { message }); setQrData(data.data || data); toast.success('QR code generated'); }
    catch { toast.error('Failed to generate QR code'); } finally { setLoading(false); }
  };

  const copyLink = () => { if (qrData?.deep_link) { navigator.clipboard.writeText(qrData.deep_link); toast.success('Link copied'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><QrCode className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">WhatsApp QR Code</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">Generate QR Code</h3>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pre-filled Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Enter a message that will be pre-filled when someone scans..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
          <button onClick={generateQr} disabled={loading} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 mt-4 disabled:opacity-50">
            <RefreshCw size={18} /> {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700 flex flex-col items-center justify-center">
          {loading ? <div className="text-gray-500">Loading...</div> :
           qrData?.qr_url ? (<>
            <img src={qrData.qr_url} alt="WhatsApp QR Code" className="w-64 h-64 rounded-lg border" />
            <p className="text-sm text-gray-500 mt-4">Phone: {qrData.phone_number}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={copyLink} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm dark:border-slate-600 dark:text-gray-300"><Copy size={14} /> Copy Link</button>
              <a href={qrData.qr_url} download className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm dark:border-slate-600 dark:text-gray-300"><Download size={14} /> Download</a>
            </div></>) : (
            <div className="text-center"><QrCode size={64} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Configure your WhatsApp API first to generate a QR code.</p></div>)}
        </div>
      </div>
    </div>
  );
}
