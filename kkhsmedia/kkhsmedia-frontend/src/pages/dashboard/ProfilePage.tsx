import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { User, Lock, MapPin, Phone } from 'lucide-react';

export default function ProfilePage() {
  const { user, settings, refreshUser } = useAuth();
  const [nameForm, setNameForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [detailsForm, setDetailsForm] = useState({ phone: user?.phone || '', address: { street: user?.address?.street || '', city: user?.address?.city || '', state: user?.address?.state || '', pincode: user?.address?.pincode || '' } });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [nameMsg, setNameMsg] = useState('');
  const [detailsMsg, setDetailsMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [saving, setSaving] = useState('');
  const primary = settings?.primaryColor || '#6366f1';

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('name');
    try {
      await authAPI.updateUsername(nameForm);
      setNameMsg('Name updated successfully!');
      refreshUser();
    } catch { setNameMsg('Failed to update name.'); }
    setSaving('');
  };

  const handleDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('details');
    try {
      await authAPI.updateDetails(detailsForm);
      setDetailsMsg('Details updated successfully!');
      refreshUser();
    } catch { setDetailsMsg('Failed to update details.'); }
    setSaving('');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('Passwords do not match.'); return; }
    setSaving('pw');
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setPwMsg('Failed to update password.'); }
    setSaving('');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      {/* User Info */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: primary }}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} style={{ color: primary }} />
          <h2 className="font-semibold">Update Name</h2>
        </div>
        <form onSubmit={handleNameUpdate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" required value={nameForm.firstName} onChange={e => setNameForm({...nameForm, firstName: e.target.value})}
              placeholder="First Name" className="px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            <input type="text" required value={nameForm.lastName} onChange={e => setNameForm({...nameForm, lastName: e.target.value})}
              placeholder="Last Name" className="px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          </div>
          {nameMsg && <p className="text-sm text-green-600">{nameMsg}</p>}
          <button type="submit" disabled={saving === 'name'} className="px-4 py-2 rounded-xl text-white text-sm disabled:opacity-50" style={{ backgroundColor: primary }}>
            {saving === 'name' ? 'Saving...' : 'Update Name'}
          </button>
        </form>
      </div>

      {/* Phone & Address */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} style={{ color: primary }} />
          <h2 className="font-semibold">Contact Details</h2>
        </div>
        <form onSubmit={handleDetailsUpdate} className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <input type="tel" value={detailsForm.phone} onChange={e => setDetailsForm({...detailsForm, phone: e.target.value})}
              placeholder="Phone Number" className="flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          </div>
          <input type="text" value={detailsForm.address.street} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, street: e.target.value}})}
            placeholder="Street Address" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          <div className="grid grid-cols-3 gap-3">
            <input type="text" value={detailsForm.address.city} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, city: e.target.value}})}
              placeholder="City" className="px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            <input type="text" value={detailsForm.address.state} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, state: e.target.value}})}
              placeholder="State" className="px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
            <input type="text" value={detailsForm.address.pincode} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, pincode: e.target.value}})}
              placeholder="Pincode" className="px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          </div>
          {detailsMsg && <p className="text-sm text-green-600">{detailsMsg}</p>}
          <button type="submit" disabled={saving === 'details'} className="px-4 py-2 rounded-xl text-white text-sm disabled:opacity-50" style={{ backgroundColor: primary }}>
            {saving === 'details' ? 'Saving...' : 'Update Details'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} style={{ color: primary }} />
          <h2 className="font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordUpdate} className="space-y-3">
          <input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
            placeholder="Current Password" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          <input type="password" required value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
            placeholder="New Password" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          <input type="password" required value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
            placeholder="Confirm New Password" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
          {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
          <button type="submit" disabled={saving === 'pw'} className="px-4 py-2 rounded-xl text-white text-sm disabled:opacity-50" style={{ backgroundColor: primary }}>
            {saving === 'pw' ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
