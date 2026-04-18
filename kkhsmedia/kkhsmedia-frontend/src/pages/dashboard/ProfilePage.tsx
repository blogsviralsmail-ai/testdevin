import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { User, Lock, MapPin, Phone, Shield, CheckCircle, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [nameForm, setNameForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [detailsForm, setDetailsForm] = useState({
    phone: user?.phone || '',
    address: { street: user?.address?.street || '', city: user?.address?.city || '', state: user?.address?.state || '', pincode: user?.address?.pincode || '' }
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [nameMsg, setNameMsg] = useState('');
  const [detailsMsg, setDetailsMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [saving, setSaving] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('name');
    try {
      await authAPI.updateUsername(nameForm);
      setNameMsg('Name updated successfully!');
      refreshUser();
    } catch { setNameMsg('Failed to update name.'); }
    setSaving('');
    setTimeout(() => setNameMsg(''), 3000);
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
    setTimeout(() => setDetailsMsg(''), 3000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(false);
    if (pwForm.newPassword.length < 6) { setPwMsg('Password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg('Passwords do not match.'); return; }
    setSaving('pw');
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password changed successfully!');
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setPwMsg('Failed to update password. Check your current password.'); setPwSuccess(false); }
    setSaving('');
    setTimeout(() => { setPwMsg(''); setPwSuccess(false); }, 4000);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-[rgb(var(--text-tertiary))]";

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-600 border-red-500/30',
      moderator: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      user: 'bg-green-500/10 text-green-600 border-green-500/30',
    };
    return styles[role] || styles.user;
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-primary">
          Profile Settings
        </h1>
        <p className="text-sm text-tertiary mt-1">Manage your account settings and preferences</p>
      </motion.div>

      {/* User Info Card */}
      <motion.div variants={cardAnim} initial="hidden" animate="show"
        className="surface-elevated rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-primary">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-tertiary">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg border font-medium capitalize ${getRoleBadge(user?.role || 'user')}`}>
                <Shield size={11} /> {user?.role}
              </span>
              {user?.emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Update Name */}
      <motion.div variants={cardAnim} initial="hidden" animate="show" transition={{ delay: 0.1 }}
        className="surface-elevated rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <User size={16} className="text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold">Update Name</h2>
        </div>
        <form onSubmit={handleNameUpdate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" required value={nameForm.firstName} onChange={e => setNameForm({...nameForm, firstName: e.target.value})}
              placeholder="First Name" className={inputClass} />
            <input type="text" required value={nameForm.lastName} onChange={e => setNameForm({...nameForm, lastName: e.target.value})}
              placeholder="Last Name" className={inputClass} />
          </div>
          <AnimatePresence>
            {nameMsg && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-sm font-medium flex items-center gap-1.5 ${nameMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                {nameMsg.includes('success') ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {nameMsg}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={saving === 'name'}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50">
            <Save size={14} /> {saving === 'name' ? 'Saving...' : 'Update Name'}
          </motion.button>
        </form>
      </motion.div>

      {/* Contact Details */}
      <motion.div variants={cardAnim} initial="hidden" animate="show" transition={{ delay: 0.2 }}
        className="surface-elevated rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <MapPin size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold">Contact Details</h2>
        </div>
        <form onSubmit={handleDetailsUpdate} className="space-y-3">
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input type="tel" value={detailsForm.phone} onChange={e => setDetailsForm({...detailsForm, phone: e.target.value})}
              placeholder="Phone Number" className={`${inputClass} pl-10`} />
          </div>
          <input type="text" value={detailsForm.address.street} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, street: e.target.value}})}
            placeholder="Street Address" className={inputClass} />
          <div className="grid grid-cols-3 gap-3">
            <input type="text" value={detailsForm.address.city} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, city: e.target.value}})}
              placeholder="City" className={inputClass} />
            <input type="text" value={detailsForm.address.state} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, state: e.target.value}})}
              placeholder="State" className={inputClass} />
            <input type="text" value={detailsForm.address.pincode} onChange={e => setDetailsForm({...detailsForm, address: {...detailsForm.address, pincode: e.target.value}})}
              placeholder="Pincode" className={inputClass} />
          </div>
          <AnimatePresence>
            {detailsMsg && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-sm font-medium flex items-center gap-1.5 ${detailsMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                {detailsMsg.includes('success') ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {detailsMsg}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={saving === 'details'}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
            <Save size={14} /> {saving === 'details' ? 'Saving...' : 'Update Details'}
          </motion.button>
        </form>
      </motion.div>

      {/* Change Password - Premium Design */}
      <motion.div variants={cardAnim} initial="hidden" animate="show" transition={{ delay: 0.3 }}
        className="surface-elevated rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lock size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Change Password</h2>
            <p className="text-[11px] text-tertiary">Keep your account secure with a strong password</p>
          </div>
        </div>
        <form onSubmit={handlePasswordUpdate} className="space-y-3">
          {/* Current Password */}
          <div className="relative">
            <input type={showCurrentPw ? 'text' : 'password'} required value={pwForm.currentPassword}
              onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
              placeholder="Current Password" className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors">
              {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* New Password */}
          <div className="relative">
            <input type={showNewPw ? 'text' : 'password'} required value={pwForm.newPassword}
              onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
              placeholder="New Password" className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors">
              {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password strength indicator */}
          {pwForm.newPassword && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    pwForm.newPassword.length >= i * 3
                      ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-emerald-500' : 'bg-emerald-400'
                      : 'bg-[rgb(var(--bg-muted))]'
                  }`} />
                ))}
              </div>
              <p className="text-[10px] text-tertiary">
                {pwForm.newPassword.length < 6 ? 'Too short - min 6 characters' :
                 pwForm.newPassword.length < 8 ? 'Fair' :
                 pwForm.newPassword.length < 12 ? 'Good' : 'Strong'}
              </p>
            </motion.div>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <input type={showConfirmPw ? 'text' : 'password'} required value={pwForm.confirmPassword}
              onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
              placeholder="Confirm New Password" className={`${inputClass} pr-10 ${
                pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'border-red-500/50' : ''
              }`} />
            <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors">
              {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
            <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Passwords do not match</p>
          )}

          {/* Status Message */}
          <AnimatePresence>
            {pwMsg && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                  pwSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                {pwSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {pwMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={saving === 'pw' || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            <Lock size={14} /> {saving === 'pw' ? 'Changing...' : 'Change Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
