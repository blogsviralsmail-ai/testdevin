import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CalendarDays, Clock, MapPin, X, Star, RotateCcw, AlertTriangle, Navigation, Phone, User, QrCode, MessageCircle, Download } from 'lucide-react';

interface Booking {
  id: number; booking_id: string; ground_name: string; ground_address: string; ground_city: string;
  booking_date: string; start_time: string; end_time: string; total_amount: number; token_amount: number;
  remaining_amount: number; status: string; payment_gateway: string; created_at: string;
  discount_amount: number; cashback_amount: number; ground_id: number;
  refund_amount?: number; cancel_charge?: number;
  ground_latitude?: number; ground_longitude?: number; sport_type?: string;
  owner_name?: string; owner_phone?: string;
  ground_amenities?: string; ground_photos?: string;
  payment_mode?: string;
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState('confirmed');
  const [loading, setLoading] = useState(true);
  const [cancelPopup, setCancelPopup] = useState<Booking | null>(null);
  const [ratePopup, setRatePopup] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadBookings();
  }, [tab]);

  const loadBookings = async () => {
    setLoading(true);
    try { const data = await api.getMyBookings(tab === 'all' ? undefined : tab); setBookings(data); } catch { /* */ }
    setLoading(false);
  };

  const getCancelCharges = (b: Booking) => {
    const now = new Date();
    const bookingTime = new Date(`${b.booking_date}T${b.start_time}`);
    const hoursLeft = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    let chargePercent = 100;
    if (hoursLeft > 48) chargePercent = 10;
    else if (hoursLeft > 24) chargePercent = 25;
    else if (hoursLeft > 4) chargePercent = 50;
    const charge = Math.round(b.token_amount * chargePercent / 100);
    const refund = b.token_amount - charge;
    return { chargePercent, charge, refund, hoursLeft: Math.max(0, Math.round(hoursLeft)) };
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const res = await api.cancelBooking(bookingId, 'Change of plans');
      alert(`Cancelled! Refund: Rs.${res.refund_amount} to wallet. Cancel charge: Rs.${res.cancel_charge}`);
      setCancelPopup(null);
      loadBookings();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Cancel failed'); }
  };

  const handleRate = async () => {
    if (!ratePopup || rating === 0) return;
    try {
      await api.rateBooking(ratePopup.booking_id, rating, review);
      alert('Rating submitted!');
      setRatePopup(null); setRating(0); setReview('');
      loadBookings();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Rating failed'); }
  };

  const handleRebook = async (b: Booking) => {
    navigate(`/book/${b.ground_id}`);
  };

  const handleExportCSV = () => {
    const rows = bookings.map(b => [
      b.booking_id, b.ground_name, b.ground_address, b.booking_date,
      `${b.start_time}-${b.end_time}`, b.status, b.total_amount, b.token_amount,
      b.remaining_amount, b.payment_gateway, b.created_at
    ]);
    const header = ['Booking ID','Ground','Address','Date','Time','Status','Total','Token','Remaining','Payment','Created'];
    const csv = [header, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'my-bookings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const statusColors: Record<string, string> = {
      confirmed: '#16a34a', completed: '#2563eb', cancelled: '#dc2626',
      pending: '#ca8a04', pending_cash: '#ea580c', awaiting_approval: '#d97706',
      no_show: '#dc2626', attended: '#16a34a',
    };
    const rows = bookings.map((b, i) => {
      const sc = statusColors[b.status] || '#6b7280';
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      return `<tr style="background:${bg}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;color:#1f2937">${b.booking_id}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px"><div style="font-weight:600;color:#1f2937">${b.ground_name}</div><div style="font-size:10px;color:#9ca3af;margin-top:2px">${b.ground_address || ''}</div></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151">${new Date(b.booking_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151">${b.start_time} - ${b.end_time}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><span style="background:${sc}15;color:${sc};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">${statusLabel[b.status]||b.status}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#1f2937">Rs.${b.total_amount?.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#16a34a;font-weight:600">Rs.${b.token_amount?.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-transform:capitalize">${b.payment_gateway}</td>
      </tr>`;
    }).join('');
    const totalAmount = bookings.reduce((s, b) => s + (b.total_amount || 0), 0);
    const totalToken = bookings.reduce((s, b) => s + (b.token_amount || 0), 0);
    const html = `<!DOCTYPE html><html><head><title>My Bookings Report - BookAGround</title>
    <style>
      @page{size:A4 landscape;margin:15mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1f2937;padding:30px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #16a34a;padding-bottom:16px}
      .logo{font-size:24px;font-weight:800;color:#16a34a;letter-spacing:-0.5px}
      .logo span{color:#374151}
      .meta{text-align:right;font-size:11px;color:#6b7280;line-height:1.6}
      .summary{display:flex;gap:16px;margin-bottom:20px}
      .stat{flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px}
      .stat-label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
      .stat-value{font-size:20px;font-weight:700}
      table{width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb}
      thead th{background:#16a34a;color:white;padding:10px 12px;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
      .footer{margin-top:24px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}
    </style></head><body>
      <div class="header">
        <div><div class="logo">Book<span>AGround</span></div><div style="font-size:12px;color:#6b7280;margin-top:4px">Sports Ground Booking Platform</div></div>
        <div class="meta"><strong style="font-size:14px;color:#1f2937">${user.name || 'User'}</strong><br>${user.phone || ''}<br>${user.email || ''}<br>Generated: ${new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Total Bookings</div><div class="stat-value" style="color:#1f2937">${bookings.length}</div></div>
        <div class="stat"><div class="stat-label">Total Amount</div><div class="stat-value" style="color:#16a34a">Rs.${totalAmount.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-label">Token Paid</div><div class="stat-value" style="color:#2563eb">Rs.${totalToken.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-label">Remaining</div><div class="stat-value" style="color:#ea580c">Rs.${(totalAmount - totalToken).toLocaleString()}</div></div>
      </div>
      <table><thead><tr><th>Booking ID</th><th>Ground</th><th>Date</th><th>Time</th><th>Status</th><th>Total</th><th>Token</th><th>Payment</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">BookAGround | bookaground.com | This is a computer-generated document</div>
    <script>window.onload=function(){window.print();}<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const openDirections = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const sc: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700',
    pending_cash: 'bg-orange-100 text-orange-700', awaiting_approval: 'bg-amber-100 text-amber-700',
    no_show: 'bg-red-100 text-red-700',
  };

  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
    pending: 'Pending', pending_cash: 'Pending Cash', awaiting_approval: 'Awaiting Approval',
    no_show: 'Not Attended', attended: 'Attended',
  };

  const tabs = [
    ['confirmed', 'Upcoming'], ['pending_cash', 'Waiting for Confirmation'], ['completed', 'Completed'], ['no_show', 'Not Attended'], ['cancelled', 'Cancelled'], ['all', 'All'],
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === val ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-600 border hover:border-green-300'}`}
            >{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No {tab === 'all' ? '' : tab} bookings found</p>
            <button onClick={() => navigate('/')} className="mt-3 text-green-600 font-medium hover:underline">Browse Grounds</button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{b.ground_name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${sc[b.status] || 'bg-gray-100'}`}>{statusLabel[b.status] || b.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-1"><MapPin size={13} /> {b.ground_address}{b.ground_city ? `, ${b.ground_city}` : ''}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1"><CalendarDays size={14} /> {b.booking_date}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {b.start_time} - {b.end_time}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Booking ID: {b.booking_id}</p>

                    {/* QR Code Button */}
                    {(b.status === 'confirmed' || b.status === 'completed') && (
                      <button onClick={() => setQrBooking(b)} className="mt-2 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-200 transition w-fit">
                        <QrCode size={14} /> Show QR Code
                      </button>
                    )}

                    {/* Direction & Owner Contact - shown for confirmed/completed bookings */}
                    {(b.status === 'confirmed' || b.status === 'completed') && (
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <button
                          onClick={() => openDirections(b.ground_latitude, b.ground_longitude, b.ground_address)}
                          className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-100 transition"
                        >
                          <Navigation size={14} /> Get Directions
                        </button>
                        {b.owner_phone && (
                          <a href={`tel:${b.owner_phone}`} className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-green-100 transition">
                            <Phone size={14} /> Call Owner
                          </a>
                        )}
                        {b.owner_name && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <User size={14} /> {b.owner_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">Rs.{b.total_amount}</p>
                    {b.remaining_amount > 0 && <p className="text-sm text-orange-500">Rs.{b.remaining_amount} remaining</p>}
                    {b.cashback_amount > 0 && <p className="text-sm text-blue-500">+Rs.{b.cashback_amount} cashback</p>}
                    <p className="text-xs text-gray-400 mt-1">{b.payment_gateway}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  {b.status === 'confirmed' && (
                    <button onClick={() => setCancelPopup(b)} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-red-100 transition">
                      <X size={14} /> Cancel
                    </button>
                  )}
                  {b.status === 'completed' && (
                    <>
                      <button onClick={() => setRatePopup(b)} className="text-sm bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-yellow-100 transition">
                        <Star size={14} /> Rate Ground
                      </button>
                      <button onClick={() => handleRebook(b)} className="text-sm bg-green-50 text-green-600 px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-green-100 transition">
                        <RotateCcw size={14} /> Rebook
                      </button>
                    </>
                  )}
                  {(b.status === 'confirmed' || b.status === 'completed' || b.status === 'no_show' || b.status === 'cancelled') && (
                    <button onClick={() => {
                      const user = JSON.parse(localStorage.getItem('user') || '{}');
                      const invoiceNo = 'INV-' + b.booking_id.replace('BMG-', '');
                      const subtotal = b.total_amount;
                      const gst = Math.round(subtotal * 0.18);
                      const invoiceContent = `<!DOCTYPE html><html><head><title>Invoice ${invoiceNo}</title><style>
      @page{size:A4;margin:15mm 10mm}
      *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;max-width:850px;margin:auto;color:#1f2937;background:#fff}
      .invoice-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;margin-bottom:20px;border-bottom:4px solid #16a34a}
      .company-info{display:flex;align-items:center;gap:15px}
      .company-logo{width:55px;height:55px;background-color:#16a34a!important;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:bold}
      .company-name{font-size:20px;font-weight:800;color:#16a34a}
      .company-details{font-size:10px;color:#6b7280;line-height:1.5}
      .invoice-badge{text-align:right}
      .invoice-badge h2{font-size:28px;font-weight:800;color:#16a34a;letter-spacing:-1px}
      .invoice-badge p{font-size:11px;color:#6b7280;margin-top:2px}
      .info-grid{display:flex;gap:20px;margin-bottom:20px}
      .info-card{flex:1;background-color:#f9fafb!important;border-radius:10px;padding:15px;border:1px solid #e5e7eb}
      .info-card h4{color:#16a34a;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:700}
      .info-card p{font-size:12px;color:#374151;line-height:1.6}
      .info-card strong{color:#111827}
      table{width:100%;border-collapse:collapse;margin:15px 0}
      thead tr{background-color:#16a34a!important}
      th{padding:12px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:white!important;font-weight:700;background-color:#16a34a!important}
      th:last-child{text-align:right}
      td{padding:12px 14px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151}
      td:last-child{text-align:right;font-weight:600}
      tr:last-child td{border-bottom:none}
      .total-section{background-color:#f0fdf4!important;border-radius:10px;padding:18px;margin-top:12px;border:2px solid #bbf7d0}
      .total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
      .total-row.grand{font-size:18px;font-weight:800;color:#16a34a;border-top:2px solid #16a34a;padding-top:10px;margin-top:6px}
      .gst-note{background-color:#eff6ff!important;padding:12px;border-radius:8px;margin-top:15px;font-size:11px;color:#1e40af;border:1px solid #bfdbfe}
      .terms{margin-top:15px;padding:12px;background-color:#f9fafb!important;border-radius:8px;font-size:10px;color:#6b7280}
      .footer{text-align:center;margin-top:25px;padding-top:15px;border-top:2px solid #e5e7eb;color:#9ca3af;font-size:10px}
      .footer strong{color:#16a34a}
      @media print{body{padding:0;margin:0;max-width:100%}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}}
    </style></head><body>
      <div class="invoice-header">
        <div class="company-info">
          <div class="company-logo">B</div>
          <div>
            <div class="company-name">BookAGround</div>
            <div class="company-details">Jaipur, Rajasthan, India<br>Sports Ground Booking Platform</div>
          </div>
        </div>
        <div class="invoice-badge">
          <h2>TAX INVOICE</h2>
          <p><strong>${invoiceNo}</strong></p>
          <p>Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-card">
          <h4>Bill To</h4>
          <p><strong>${user.name || 'Customer'}</strong><br>${user.phone || ''}<br>${user.email || ''}</p>
        </div>
        <div class="info-card">
          <h4>Booking Details</h4>
          <p><strong>${b.ground_name}</strong><br>${b.ground_address || ''}${b.ground_city ? ', ' + b.ground_city : ''}<br>Date: ${b.booking_date}<br>Time: ${b.start_time} - ${b.end_time}<br>Booking ID: ${b.booking_id}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Booking ID</th><th>Qty</th><th>Amount (Rs)</th></tr></thead>
        <tbody>
          <tr><td>Ground Booking - ${b.ground_name}<br><small style="color:#6b7280">${b.booking_date} | ${b.start_time} - ${b.end_time}</small></td><td>${b.booking_id}</td><td>1</td><td>Rs.${subtotal}</td></tr>
          ${b.discount_amount > 0 ? '<tr><td>Discount Applied</td><td>-</td><td>-</td><td style="color:#16a34a">- Rs.' + b.discount_amount + '</td></tr>' : ''}
        </tbody>
      </table>
      <div class="total-section">
        <div class="total-row"><span>Subtotal</span><span>Rs.${subtotal}</span></div>
        ${b.discount_amount > 0 ? '<div class="total-row"><span>Discount</span><span style="color:#16a34a">- Rs.' + b.discount_amount + '</span></div>' : ''}
        <div class="total-row"><span>GST (18% included)</span><span>Rs.${gst}</span></div>
        <div class="total-row"><span>Token Paid</span><span>Rs.${b.token_amount}</span></div>
        <div class="total-row grand"><span>Total Payable</span><span>Rs.${subtotal}</span></div>
      </div>
      <div class="gst-note"><strong>Note:</strong> GST is included in the booking amount. This is a computer-generated tax invoice.</div>
      <div class="terms"><strong>Terms &amp; Conditions:</strong> Cancellation charges apply as per policy. Refunds credited to wallet within 24 hours.</div>
      <div class="footer"><p><strong>BookAGround</strong> | Sports Ground Booking Platform</p><p>Thank you for choosing BookAGround!</p></div>
    <script>window.onload=function(){window.print();};</script></body></html>`;
                      const w = window.open('', '_blank');
                      if (w) { w.document.write(invoiceContent); w.document.close(); }
                    }} className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition">
                      <Download size={14} /> Invoice
                    </button>
                  )}
                  {(b.status === 'confirmed' || b.status === 'completed') && (
                    <button onClick={() => {
                      let text = `BookAGround Booking\n\nBooking ID: ${b.booking_id}\nGround: ${b.ground_name}\nAddress: ${b.ground_address || ''}${b.ground_city ? ', ' + b.ground_city : ''}\nDate: ${b.booking_date}\nTime: ${b.start_time} - ${b.end_time}\nAmount: Rs.${b.total_amount}\nStatus: ${b.status}`;
                      if (b.owner_name) text += `\n\nOwner: ${b.owner_name}`;
                      if (b.owner_phone) text += `\nOwner Contact: ${b.owner_phone}`;
                      if (b.ground_latitude && b.ground_longitude) text += `\n\nLocation: https://www.google.com/maps?q=${b.ground_latitude},${b.ground_longitude}`;
                      else if (b.ground_address) text += `\n\nLocation: https://www.google.com/maps/search/${encodeURIComponent(b.ground_address)}`;
                      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
                    }} className="text-sm bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition">
                      <MessageCircle size={14} /> Share
                    </button>
                  )}
                  {b.status === 'cancelled' && (
                    <div className="text-sm text-gray-500">
                      {b.refund_amount != null && <span className="text-green-600 mr-3">Refund: Rs.{b.refund_amount}</span>}
                      {b.cancel_charge != null && <span className="text-red-500">Cancel charge: Rs.{b.cancel_charge}</span>}
                    </div>
                  )}
                  {b.status === 'no_show' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                      <p className="text-red-700 font-medium">You did not attend this booking</p>
                      <p className="text-red-500 text-xs mt-1">Token amount of Rs.{b.token_amount} has been forfeited. Remaining Rs.{b.remaining_amount} was not charged.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Popup */}
      {cancelPopup && (() => {
        const c = getCancelCharges(cancelPopup);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCancelPopup(null)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4 text-red-600"><AlertTriangle size={24}/><h3 className="text-xl font-bold">Cancel Booking?</h3></div>
              <div className="space-y-3 text-sm bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Ground</span><span className="font-medium">{cancelPopup.ground_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{cancelPopup.booking_date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time left</span><span>{c.hoursLeft} hours</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Token Paid</span><span>Rs.{cancelPopup.token_amount}</span></div>
                <div className="flex justify-between text-red-600"><span>Cancel Charge ({c.chargePercent}%)</span><span>Rs.{c.charge}</span></div>
                <div className="flex justify-between text-green-600 font-bold border-t pt-2"><span>Refund to Wallet</span><span>Rs.{c.refund}</span></div>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Cancel policy: 10% (48+ hrs), 25% (24-48 hrs), 50% (4-24 hrs), 100% (&lt;4 hrs)
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancelPopup(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Keep Booking</button>
                <button onClick={() => handleCancel(cancelPopup.booking_id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700">Confirm Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Rate Popup */}
      {/* QR Code Modal */}
      {qrBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrBooking(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Booking QR Code</h3>
            <p className="text-sm text-gray-500 mb-4">Show this at the ground for verification</p>
            <div className="bg-white p-4 rounded-xl inline-block mb-4 border-2 border-gray-100 mx-auto">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify({booking_id: qrBooking.booking_id, ground: qrBooking.ground_name, date: qrBooking.booking_date, time: qrBooking.start_time + '-' + qrBooking.end_time, amount: qrBooking.total_amount, status: qrBooking.status, payment: qrBooking.payment_mode}))}`} alt="QR Code" className="w-52 h-52 mx-auto" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">QR Code</text></svg>'); }} />
            </div>
            <div className="text-sm text-gray-600 space-y-1.5 mb-4 text-left bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between"><span className="text-gray-500">Booking ID</span><span className="font-bold text-gray-800">{qrBooking.booking_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ground</span><span className="font-bold text-gray-800">{qrBooking.ground_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{qrBooking.booking_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{qrBooking.start_time} - {qrBooking.end_time}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-green-700">Rs.{qrBooking.total_amount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium">{qrBooking.payment_mode}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-bold ${qrBooking.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>{qrBooking.status}</span></div>
            </div>
            <button onClick={() => setQrBooking(null)} className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}

      {ratePopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRatePopup(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rate {ratePopup.ground_name}</h3>
            <div className="flex gap-2 justify-center my-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-3xl">
                  <Star size={32} className={s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea placeholder="Write a review (optional)..." className="w-full border rounded-xl px-4 py-3 mb-4 outline-none focus:border-green-500" rows={3}
              value={review} onChange={e => setReview(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setRatePopup(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
              <button onClick={handleRate} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">Submit Rating</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
