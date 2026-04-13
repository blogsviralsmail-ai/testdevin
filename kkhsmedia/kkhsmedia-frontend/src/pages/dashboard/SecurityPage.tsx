import { useState, useEffect } from 'react';
import { twoFactorAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function SecurityPage() {
  const [status, setStatus] = useState<{ enabled: boolean; hasBackupCodes: boolean } | null>(null);
  const [setupData, setSetupData] = useState<{ qrCodeUrl: string; secret: string; backupCodes: string[] } | null>(null);
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'status' | 'setup' | 'verify'>('status');

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await twoFactorAPI.getStatus();
      setStatus(res.data);
    } catch { /* not setup yet */ }
    finally { setLoading(false); }
  };

  const startSetup = async () => {
    try {
      const res = await twoFactorAPI.setup();
      setSetupData(res.data);
      setStep('setup');
    } catch { toast.error('Failed to start 2FA setup'); }
  };

  const verifySetup = async () => {
    if (!code || code.length !== 6) { toast.error('Enter 6-digit code'); return; }
    try {
      await twoFactorAPI.verifySetup({ code });
      toast.success('2FA enabled successfully!');
      setStep('status');
      setCode('');
      loadStatus();
    } catch { toast.error('Invalid code. Try again.'); }
  };

  const disable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) { toast.error('Enter 6-digit code to disable'); return; }
    try {
      await twoFactorAPI.disable({ code: disableCode });
      toast.success('2FA disabled');
      setDisableCode('');
      loadStatus();
    } catch { toast.error('Invalid code'); }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">Security Settings</h1>

      {/* 2FA Status */}
      <div className="surface-base border rounded-lg p-6 max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-tertiary">Protect your account with Google Authenticator</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status?.enabled ? 'bg-green-100 text-green-700' : 'surface-muted text-secondary'}`}>
            {status?.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {step === 'status' && !status?.enabled && (
          <button onClick={startSetup} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Enable 2FA
          </button>
        )}

        {step === 'status' && status?.enabled && (
          <div className="space-y-3">
            <p className="text-sm text-green-600 font-medium">Your account is protected with 2FA</p>
            <div className="border-t pt-3">
              <label className="text-sm text-secondary">Enter code to disable 2FA:</label>
              <div className="flex space-x-2 mt-1">
                <input type="text" maxLength={6} value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="border rounded p-2 text-sm w-32 text-center font-mono tracking-widest" />
                <button onClick={disable2FA} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">Disable 2FA</button>
              </div>
            </div>
          </div>
        )}

        {step === 'setup' && setupData && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Step 1: Scan QR Code with Google Authenticator</p>
              <div className="flex justify-center">
                <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-blue-600 mt-2 text-center break-all">Manual Key: {setupData.secret}</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Step 2: Save Backup Codes</p>
              <div className="grid grid-cols-2 gap-1 font-mono text-sm">
                {setupData.backupCodes?.map((c, i) => (
                  <span key={i} className="surface-base px-2 py-1 rounded text-center">{c}</span>
                ))}
              </div>
              <p className="text-xs text-yellow-600 mt-2">Store these codes safely. They can be used if you lose your authenticator.</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Step 3: Enter the 6-digit code from your app</p>
              <div className="flex space-x-2">
                <input type="text" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="border rounded p-2 text-sm w-32 text-center font-mono tracking-widest" />
                <button onClick={verifySetup} className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700">Verify & Enable</button>
                <button onClick={() => setStep('status')} className="text-tertiary px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Section */}
      <div className="surface-base border rounded-lg p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Password</h2>
        <p className="text-sm text-tertiary mb-4">Change your password from the Profile page</p>
        <a href="/profile" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Go to Profile →</a>
      </div>
    </div>
  );
}
