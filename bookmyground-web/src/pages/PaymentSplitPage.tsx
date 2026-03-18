import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Users, IndianRupee, Plus, Trash2, Send, Check, Download, Share2, ChevronLeft, CheckCircle, Clock, Phone, User, Calendar, MapPin, History, X } from 'lucide-react';

interface Booking {
  id: number; booking_id: string; ground_name: string; booking_date: string;
  start_time: string; end_time: string; total_amount: number; status: string;
}

interface SplitMemberItem { name: string; phone: string; amount: number; paid: boolean; }

interface SavedSplit {
  id: number; booking_id: string; ground_name: string; booking_date: string;
  total_amount: number; my_share: number; split_type: string; created_at: string;
  members: Array<{ id: number; name: string; phone: string; amount: number; paid: number }>;
}

export default function PaymentSplitPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [members, setMembers] = useState<SplitMemberItem[]>([]);
  const [newMember, setNewMember] = useState({ name: '', phone: '' });
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'create' | 'history'>('create');
  const [savedSplits, setSavedSplits] = useState<SavedSplit[]>([]);
  const [saving, setSaving] = useState(false);
  const [successSplit, setSuccessSplit] = useState<{ totalAmount: number; membersCount: number; groundName: string } | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    Promise.all([
      api.getMyBookings('confirmed').catch(() => []),
      api.getMySplitPayments().catch(() => [])
    ]).then(([b, s]) => {
      setBookings(b);
      setSavedSplits(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, []);

  const loadHistory = async () => {
    try { const s = await api.getMySplitPayments(); setSavedSplits(Array.isArray(s) ? s : []); } catch { /* ignore */ }
  };

  const addMember = () => {
    if (!newMember.name.trim()) return;
    const updated = [...members, { ...newMember, amount: 0, paid: false }];
    setNewMember({ name: '', phone: '' });
    if (splitType === 'equal' && selectedBooking) {
      const perPerson = Math.round(selectedBooking.total_amount / (updated.length + 1));
      setMembers(updated.map(m => ({ ...m, amount: perPerson })));
    } else {
      setMembers(updated);
    }
  };

  const removeMember = (i: number) => {
    const updated = members.filter((_, idx) => idx !== i);
    if (splitType === 'equal' && selectedBooking && updated.length > 0) {
      const perPerson = Math.round(selectedBooking.total_amount / (updated.length + 1));
      setMembers(updated.map(m => ({ ...m, amount: perPerson })));
    } else {
      setMembers(updated);
    }
  };

  const calculateSplit = () => {
    if (!selectedBooking || members.length === 0) return;
    const perPerson = Math.round(selectedBooking.total_amount / (members.length + 1));
    setMembers(members.map(m => ({ ...m, amount: perPerson })));
  };

  const totalSplit = members.reduce((s, m) => s + m.amount, 0);
  const myShare = selectedBooking ? selectedBooking.total_amount - totalSplit : 0;

  const handleSave = async () => {
    if (!selectedBooking || members.length === 0) return;
    setSaving(true);
    try {
      await api.createSplitPayment({
        booking_id: selectedBooking.booking_id,
        ground_name: selectedBooking.ground_name,
        booking_date: selectedBooking.booking_date,
        total_amount: selectedBooking.total_amount,
        my_share: myShare,
        split_type: splitType,
        members: members.map(m => ({ name: m.name, phone: m.phone, amount: m.amount, paid: m.paid }))
      });
      setSuccessSplit({ totalAmount: selectedBooking.total_amount, membersCount: members.length, groundName: selectedBooking.ground_name });
      loadHistory();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      window.alert(msg);
    }
    setSaving(false);
  };

  const handleMarkPaid = async (splitId: number, memberId: number) => {
    try { await api.markSplitMemberPaid(splitId, memberId); loadHistory(); } catch { /* ignore */ }
  };

  const sendReminders = () => {
    if (!selectedBooking) return;
    const unpaid = members.filter(m => !m.paid && m.phone);
    if (unpaid.length === 0) return;
    const text = 'Hi! Please pay Rs.' + unpaid[0].amount + ' for ' + selectedBooking.ground_name + ' booking on ' + selectedBooking.booking_date + '. Pay via BookAGround wallet. - ' + (user.name || 'Organizer');
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  const shareSplit = (booking?: Booking | null, membersList?: SplitMemberItem[], share?: number) => {
    const b = booking || selectedBooking;
    const m = membersList || members;
    const ms = share ?? myShare;
    if (!b) return;
    const text = 'Split Payment - ' + b.ground_name + '\nDate: ' + b.booking_date + '\nTotal: Rs.' + b.total_amount + '\n\n' +
      m.map((mem, i) => (i + 1) + '. ' + mem.name + ': Rs.' + mem.amount + ' ' + (mem.paid ? 'Paid' : 'Pending')).join('\n') +
      '\n\nOrganizer (' + (user.name || 'Me') + '): Rs.' + ms + '\n\nPay via BookAGround - bookaground.com';
    if (navigator.share) {
      navigator.share({ title: 'Split Payment', text }).catch(() => { /* ignore */ });
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
  };

  const generatePDF = () => {
    if (!selectedBooking || members.length === 0) return;
    const html = '<!DOCTYPE html><html><head><style>' +
      'body{font-family:Segoe UI,Arial,sans-serif;padding:40px;max-width:700px;margin:auto;color:#333;background:#fff}' +
      '.header{text-align:center;background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:30px;border-radius:16px;color:white;margin-bottom:30px}' +
      '.title{font-size:28px;font-weight:bold;margin-bottom:5px}.subtitle{opacity:0.8;font-size:14px}' +
      '.card{background:#f8f7ff;padding:20px;border-radius:12px;margin-bottom:20px;border:1px solid #e9e5ff}' +
      '.card h3{color:#7c3aed;margin-bottom:12px;font-size:16px}' +
      '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.info-item label{font-size:11px;color:#888;text-transform:uppercase}.info-item p{font-size:14px;font-weight:600;margin-top:2px}' +
      'table{width:100%;border-collapse:separate;border-spacing:0;margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb}' +
      'th{background:#7c3aed;color:white;padding:12px 15px;text-align:left;font-size:12px;text-transform:uppercase}' +
      'td{padding:12px 15px;border-bottom:1px solid #f3f4f6;font-size:13px}tr:last-child td{border-bottom:none}tr:nth-child(even){background:#faf9ff}' +
      '.paid{color:#16a34a;font-weight:bold;background:#f0fdf4;padding:2px 8px;border-radius:12px;font-size:11px}' +
      '.pending{color:#ea580c;font-weight:bold;background:#fff7ed;padding:2px 8px;border-radius:12px;font-size:11px}' +
      '.summary{background:linear-gradient(135deg,#f0fdf4,#ecfdf5);padding:20px;border-radius:12px;border:1px solid #bbf7d0}' +
      '.summary .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}' +
      '.footer{text-align:center;margin-top:30px;color:#999;font-size:11px;padding-top:20px;border-top:1px solid #eee}' +
      '</style></head><body>' +
      '<div class="header"><div class="title">Split Payment</div><div class="subtitle">BookAGround</div></div>' +
      '<div class="card"><h3>Booking Details</h3><div class="info-grid">' +
      '<div class="info-item"><label>Ground</label><p>' + selectedBooking.ground_name + '</p></div>' +
      '<div class="info-item"><label>Date</label><p>' + selectedBooking.booking_date + '</p></div>' +
      '<div class="info-item"><label>Time</label><p>' + selectedBooking.start_time + ' - ' + selectedBooking.end_time + '</p></div>' +
      '<div class="info-item"><label>Booking ID</label><p>' + selectedBooking.booking_id + '</p></div>' +
      '</div></div>' +
      '<table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
      '<tr><td>1</td><td><strong>' + (user.name || 'You') + '</strong> (Organizer)</td><td>' + (user.phone || '-') + '</td><td><strong>Rs.' + myShare + '</strong></td><td><span class="paid">Paid</span></td></tr>' +
      members.map((m, i) => '<tr><td>' + (i + 2) + '</td><td>' + m.name + '</td><td>' + (m.phone || '-') + '</td><td><strong>Rs.' + m.amount + '</strong></td><td><span class="' + (m.paid ? 'paid' : 'pending') + '">' + (m.paid ? 'Paid' : 'Pending') + '</span></td></tr>').join('') +
      '</tbody></table>' +
      '<div class="summary"><div class="row"><span>Total</span><span><strong>Rs.' + selectedBooking.total_amount + '</strong></span></div>' +
      '<div class="row"><span>Your Share</span><span>Rs.' + myShare + '</span></div></div>' +
      '<div class="footer"><p>BookAGround - bookaground.com</p></div></body></html>';
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-purple-100 rounded-full transition">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Split Payment</h1>
            <p className="text-xs text-gray-500">Split booking costs with friends & teammates</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 my-5">
          <button onClick={() => setTab('create')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${tab === 'create' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-600 border'}`}>
            <Plus size={16} /> New Split
          </button>
          <button onClick={() => { setTab('history'); loadHistory(); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${tab === 'history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-600 border'}`}>
            <History size={16} /> My Splits ({savedSplits.length})
          </button>
        </div>

        {tab === 'create' ? (
          <div className="space-y-4">
            {/* Step 1: Select Booking */}
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">1</div>
                <h3 className="font-bold text-gray-800">Select Booking</h3>
              </div>
              {loading ? (
                <div className="py-8 text-center text-gray-400">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="py-6 text-center">
                  <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No confirmed bookings found</p>
                  <button onClick={() => navigate('/')} className="mt-3 text-purple-600 text-sm font-medium hover:underline">Book a ground first</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map(b => (
                    <button key={b.booking_id} onClick={() => { setSelectedBooking(b); setMembers([]); }}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition ${selectedBooking?.booking_id === b.booking_id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedBooking?.booking_id === b.booking_id ? 'bg-purple-500 text-white' : 'bg-white text-purple-600 border'}`}>
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{b.ground_name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={11} /> {b.booking_date} | {b.start_time}-{b.end_time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">Rs.{b.total_amount}</p>
                          {selectedBooking?.booking_id === b.booking_id && <CheckCircle size={16} className="text-purple-500 ml-auto mt-1" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedBooking && (
              <>
                {/* Step 2: Split Type */}
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">2</div>
                    <h3 className="font-bold text-gray-800">Split Type</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setSplitType('equal'); if (members.length > 0 && selectedBooking) { const pp = Math.round(selectedBooking.total_amount / (members.length + 1)); setMembers(members.map(m => ({ ...m, amount: pp }))); } }}
                      className={`p-4 rounded-xl border-2 text-center transition ${splitType === 'equal' ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-gray-200 hover:border-purple-200'}`}>
                      <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-purple-600" />
                      </div>
                      <p className="font-semibold text-sm text-gray-800">Equal Split</p>
                      <p className="text-xs text-gray-500 mt-1">Everyone pays same</p>
                    </button>
                    <button onClick={() => setSplitType('custom')}
                      className={`p-4 rounded-xl border-2 text-center transition ${splitType === 'custom' ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-gray-200 hover:border-purple-200'}`}>
                      <div className="w-10 h-10 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                        <IndianRupee size={20} className="text-orange-600" />
                      </div>
                      <p className="font-semibold text-sm text-gray-800">Custom Amount</p>
                      <p className="text-xs text-gray-500 mt-1">Set different amounts</p>
                    </button>
                  </div>
                </div>

                {/* Step 3: Add Members */}
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">3</div>
                    <h3 className="font-bold text-gray-800">Add Friends</h3>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Friend's name" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none"
                          value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && addMember()} />
                      </div>
                      <div className="flex-1 relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" placeholder="Phone number" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none"
                          value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && addMember()} />
                      </div>
                      <button onClick={addMember} className="bg-purple-600 text-white px-4 rounded-lg hover:bg-purple-700 transition shadow-sm">
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3 mb-3 border border-purple-100">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">{(user.name || 'Y')[0]}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{user.name || 'You'} <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full ml-1">Organizer</span></p>
                      <p className="text-xs text-gray-500">{user.phone || 'Your share'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 text-sm">Rs.{myShare > 0 ? myShare : '---'}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-xl">
                      <Users size={28} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">Add friends to split the payment</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border hover:shadow-sm transition">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">{m.name[0].toUpperCase()}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{m.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              {m.phone ? <><Phone size={10} /> {m.phone}</> : 'No phone'}
                            </p>
                          </div>
                          {splitType === 'custom' ? (
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs.</span>
                              <input type="number" className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-sm text-right font-semibold focus:border-purple-400 outline-none"
                                value={m.amount} onChange={e => { const nm = [...members]; nm[i].amount = parseInt(e.target.value) || 0; setMembers(nm); }} />
                            </div>
                          ) : (
                            <span className="font-bold text-green-600 text-sm">Rs.{m.amount}</span>
                          )}
                          <button onClick={() => { const nm = [...members]; nm[i].paid = !nm[i].paid; setMembers(nm); }}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition ${m.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                            {m.paid ? <Check size={14} /> : <Clock size={14} />}
                          </button>
                          <button onClick={() => removeMember(i)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {members.length > 0 && splitType === 'equal' && (
                    <button onClick={calculateSplit} className="mt-3 w-full bg-purple-50 text-purple-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-100 transition border border-purple-200">
                      Recalculate Equal Split
                    </button>
                  )}
                </div>

                {/* Summary & Actions */}
                {members.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-5 text-white">
                      <p className="text-sm text-purple-200 font-medium mb-1">Split Summary</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold">Rs.{selectedBooking.total_amount}</p>
                          <p className="text-purple-200 text-xs mt-1">{selectedBooking.ground_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Split among <span className="font-bold">{members.length + 1}</span> people</p>
                          <p className="text-xs text-purple-200">{members.filter(m => m.paid).length}/{members.length} members paid</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount</span><span className="font-bold">Rs.{selectedBooking.total_amount}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Members Share ({members.length})</span><span className="font-medium text-orange-600">Rs.{totalSplit}</span></div>
                      <div className="flex justify-between text-sm border-t pt-3"><span className="text-gray-500 font-medium">Your Share</span><span className="font-bold text-purple-600 text-lg">Rs.{myShare}</span></div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Payment Progress</span>
                          <span>{members.filter(m => m.paid).length + 1}/{members.length + 1} paid</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all"
                            style={{ width: `${((members.filter(m => m.paid).length + 1) / (members.length + 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 pt-0 space-y-2">
                      <button onClick={handleSave} disabled={saving}
                        className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? 'Saving...' : <><CheckCircle size={16} /> Save Split Payment</>}
                      </button>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={sendReminders} className="bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-green-100 transition flex items-center justify-center gap-1 border border-green-200">
                          <Send size={13} /> Remind
                        </button>
                        <button onClick={generatePDF} className="bg-blue-50 text-blue-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1 border border-blue-200">
                          <Download size={13} /> PDF
                        </button>
                        <button onClick={() => shareSplit()} className="bg-orange-50 text-orange-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-orange-100 transition flex items-center justify-center gap-1 border border-orange-200">
                          <Share2 size={13} /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="space-y-4">
            {savedSplits.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
                <History size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No split payments yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first split to track payments</p>
                <button onClick={() => setTab('create')} className="mt-4 bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">Create Split</button>
              </div>
            ) : (
              savedSplits.map(sp => (
                <div key={sp.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><MapPin size={18} className="text-purple-600" /></div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{sp.ground_name || 'Split Payment'}</p>
                          <p className="text-xs text-gray-500">{sp.booking_date || (sp.created_at ? sp.created_at.split('T')[0] : '-')} | {sp.split_type === 'equal' ? 'Equal' : 'Custom'} split</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">Rs.{sp.total_amount}</p>
                        <p className="text-xs text-gray-400">{sp.members?.filter(m => m.paid).length || 0}/{sp.members?.length || 0} paid</p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${sp.members?.length > 0 ? ((sp.members.filter(m => m.paid).length) / sp.members.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-2.5 mb-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{(user.name || 'Y')[0]}</div>
                      <div className="flex-1"><p className="text-xs font-semibold text-gray-800">{user.name || 'You'} <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">You</span></p></div>
                      <span className="text-xs font-bold text-purple-600">Rs.{sp.my_share}</span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Paid</span>
                    </div>
                    {sp.members?.map(m => (
                      <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5 mb-1.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{m.name[0].toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{m.name}</p>
                          {m.phone && <p className="text-[10px] text-gray-500">{m.phone}</p>}
                        </div>
                        <span className="text-xs font-bold">Rs.{m.amount}</span>
                        {m.paid ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"><Check size={10} /> Paid</span>
                        ) : (
                          <button onClick={() => handleMarkPaid(sp.id, m.id)}
                            className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-semibold border border-yellow-200 hover:bg-yellow-100 transition">Mark Paid</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <button onClick={() => {
                      const mi = sp.members?.map(m => ({ name: m.name, phone: m.phone, amount: m.amount, paid: !!m.paid })) || [];
                      shareSplit({ booking_id: sp.booking_id, ground_name: sp.ground_name, booking_date: sp.booking_date, total_amount: sp.total_amount, start_time: '', end_time: '', id: 0, status: '' }, mi, sp.my_share);
                    }} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-xs font-semibold hover:bg-green-100 flex items-center justify-center gap-1 border border-green-200">
                      <Share2 size={12} /> Share
                    </button>
                    <button onClick={() => {
                      const unpaid = sp.members?.filter(m => !m.paid && m.phone) || [];
                      if (unpaid.length === 0) return;
                      const text = 'Hi! Please pay Rs.' + unpaid[0].amount + ' for ' + sp.ground_name + ' booking. Pay via BookAGround. - ' + (user.name || 'Organizer');
                      window.open('https://wa.me/' + unpaid[0].phone + '?text=' + encodeURIComponent(text), '_blank');
                    }} className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg text-xs font-semibold hover:bg-purple-100 flex items-center justify-center gap-1 border border-purple-200">
                      <Send size={12} /> Remind Unpaid
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Success Modal */}
        {successSplit && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-out]">
              <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 px-6 pt-8 pb-10 text-center relative">
                <button onClick={() => { setSuccessSplit(null); setSelectedBooking(null); setMembers([]); setTab('history'); }} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={20} /></button>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle size={48} className="text-purple-500" />
                </div>
                <p className="text-purple-200 text-sm font-medium mb-1">Split Payment Saved!</p>
                <p className="text-white text-3xl font-bold">Rs.{successSplit.totalAmount.toLocaleString()}</p>
                <p className="text-purple-200 text-sm mt-2">Split among {successSplit.membersCount + 1} people</p>
              </div>
              <div className="px-6 -mt-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Ground</span><span className="font-medium">{successSplit.groundName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Members</span><span className="font-medium">{successSplit.membersCount} friends</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={14} /> Saved</span></div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <button onClick={() => { setSuccessSplit(null); shareSplit(); }} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-2">
                  <Share2 size={16} /> Share with Friends
                </button>
                <button onClick={() => { setSuccessSplit(null); setSelectedBooking(null); setMembers([]); setTab('history'); }} className="w-full border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition">
                  View History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
