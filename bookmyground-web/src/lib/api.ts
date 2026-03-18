const API_URL = import.meta.env.VITE_API_URL || '';
const API_AUTH = import.meta.env.VITE_API_AUTH || '';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['X-Auth-Token'] = token;
  if (API_AUTH) headers['Authorization'] = 'Basic ' + API_AUTH;
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    let errMsg = 'Request failed';
    if (typeof err.detail === 'string') errMsg = err.detail;
    else if (Array.isArray(err.detail)) errMsg = err.detail.map((e: Record<string, unknown>) => e.msg || String(e)).join(', ');
    else if (err.detail) errMsg = JSON.stringify(err.detail);
    throw new Error(errMsg);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv')) return res.text();
  if (ct.includes('text/html') && res.headers.get('content-disposition')) return res.text();
  return res.json();
}

export const api = {
  sendOTP: (phone: string) => fetchAPI('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOTP: (phone: string, otp: string, name?: string) => fetchAPI('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp, name }) }),
  loginWithPassword: (identifier: string, password: string) => fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  signup: (data: Record<string, unknown>) => fetchAPI('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (identifier: string) => fetchAPI('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  resetPassword: (identifier: string, otp: string, password: string) => fetchAPI('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier, otp, new_password: password }) }),
  getGrounds: (params?: Record<string, string>) => { const qs = params ? '?' + new URLSearchParams(params).toString() : ''; return fetchAPI('/api/grounds' + qs); },
  getFeaturedGrounds: () => fetchAPI('/api/grounds/featured'),
  getCities: () => fetchAPI('/api/grounds/cities'),
  getGround: (id: number) => fetchAPI('/api/grounds/' + id),
  getGroundBySlug: (slug: string) => fetchAPI('/api/grounds/by-slug/' + slug),
  getSlugMap: () => fetchAPI('/api/grounds/slug-map'),
  getSlots: (groundId: number, date: string) => fetchAPI('/api/grounds/' + groundId + '/slots?date=' + date),
  createBooking: (data: Record<string, unknown>) => fetchAPI('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: (status?: string) => fetchAPI('/api/bookings' + (status ? '?status=' + status : '')),
  getBooking: (id: string) => fetchAPI('/api/bookings/' + id),
  cancelBooking: (id: string, reason: string) => fetchAPI('/api/bookings/' + id + '/cancel', { method: 'POST', body: JSON.stringify({ reason }) }),
  getProfile: () => fetchAPI('/api/users/me'),
  updateProfile: (data: Record<string, unknown>) => fetchAPI('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  getWallet: () => fetchAPI('/api/users/me/wallet'),
  addMoney: (amount: number, gateway: string) => fetchAPI('/api/users/me/wallet/add', { method: 'POST', body: JSON.stringify({ amount, gateway }) }),
  verifyWalletTopup: (data: Record<string, unknown>) => fetchAPI('/api/users/me/wallet/topup-verify', { method: 'POST', body: JSON.stringify(data) }),
  withdrawMoney: (amount: number) => fetchAPI('/api/users/me/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
  submitKYC: (data: Record<string, unknown>) => fetchAPI('/api/users/me/kyc', { method: 'POST', body: JSON.stringify(data) }),
  getReferralInfo: () => fetchAPI('/api/users/me/referral'),
  getPaymentGateways: () => fetchAPI('/api/payment-gateways'),
  validatePromo: (code: string, amount: number) => fetchAPI('/api/promos/validate/' + code + '?amount=' + amount),
  getPublicSettings: () => fetchAPI('/api/settings/public'),
  getOffers: () => fetchAPI('/api/promos/active'),
  getTeams: () => fetchAPI('/api/teams'),
  getMyTeams: () => fetchAPI('/api/teams/my-teams'),
  createTeam: (name: string) => fetchAPI('/api/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  joinTeam: (teamId: number) => fetchAPI('/api/teams/' + teamId + '/join', { method: 'POST' }),
  addTeamMember: (teamId: number, phone: string, name?: string) => fetchAPI('/api/teams/' + teamId + '/members', { method: 'POST', body: JSON.stringify({ phone: phone || undefined, name: name || undefined }) }),
  challengeTeam: (opponentTeamId: number, groundId?: number, matchDate?: string, matchTime?: string) =>
    fetchAPI('/api/teams/challenge', { method: 'POST', body: JSON.stringify({ opponent_team_id: opponentTeamId, ground_id: groundId, match_date: matchDate, match_time: matchTime }) }),
  getMyChallenges: () => fetchAPI('/api/teams/challenges'),
  respondChallenge: (challengeId: number, accept: boolean) => fetchAPI('/api/teams/challenges/' + challengeId + '/respond?accept=' + accept, { method: 'POST' }),
  getOwnerDashboard: () => fetchAPI('/api/owner/dashboard'),
  getOwnerGrounds: () => fetchAPI('/api/owner/grounds'),
  addOwnerGround: (data: Record<string, unknown>) => fetchAPI('/api/owner/grounds', { method: 'POST', body: JSON.stringify(data) }),
  getOwnerBookings: (status?: string) => fetchAPI('/api/owner/bookings' + (status ? '?status=' + status : '')),
  ownerCancelBooking: (id: string) => fetchAPI('/api/owner/bookings/' + id + '/cancel', { method: 'POST' }),
  ownerOfflineBooking: (data: Record<string, unknown>) => fetchAPI('/api/owner/bookings/offline', { method: 'POST', body: JSON.stringify(data) }),
  getOwnerSlots: (groundId: number, date: string) => fetchAPI('/api/owner/grounds/' + groundId + '/slots?date=' + date),
  rateUser: (bookingId: string, rating: number) => fetchAPI('/api/owner/bookings/' + bookingId + '/rate-user', { method: 'POST', body: JSON.stringify({ rating }) }),
  markAttendance: (bookingId: string, status: string) => fetchAPI('/api/owner/bookings/' + bookingId + '/attendance', { method: 'POST', body: JSON.stringify({ status }) }),
  setDayOff: (groundId: number, date: string, reason: string) => fetchAPI('/api/owner/grounds/' + groundId + '/dayoff', { method: 'POST', body: JSON.stringify({ ground_id: groundId, date, reason }) }),
  removeDayOff: (groundId: number, date: string) => fetchAPI('/api/owner/grounds/' + groundId + '/dayoff?date=' + date, { method: 'DELETE' }),
  blockSlot: (slotId: number) => fetchAPI('/api/owner/slots/' + slotId + '/block', { method: 'POST' }),
  ownerPayout: (amount: number) => fetchAPI('/api/owner/wallet/payout', { method: 'POST', body: JSON.stringify({ amount }) }),
  ownerKYC: (data: Record<string, unknown>) => fetchAPI('/api/owner/kyc', { method: 'POST', body: JSON.stringify(data) }),
  getAdminDashboard: () => fetchAPI('/api/admin/dashboard'),
  getAdminUsers: (role?: string) => fetchAPI('/api/admin/users' + (role ? '?role=' + role : '')),
  addAdminUser: (data: Record<string, unknown>) => fetchAPI('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminUser: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/users/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  exportUsersCSV: () => fetchAPI('/api/admin/users/csv'),
  getAdminGrounds: () => fetchAPI('/api/admin/grounds'),
  addAdminGround: (data: Record<string, unknown>) => fetchAPI('/api/admin/grounds', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateGround: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/grounds/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminBookings: (status?: string) => fetchAPI('/api/admin/bookings' + (status ? '?status=' + status : '')),
  exportBookingsCSV: () => fetchAPI('/api/admin/bookings/csv'),
  adminCancelBooking: (id: string) => fetchAPI('/api/admin/bookings/' + id + '/cancel', { method: 'POST' }),
  adminConfirmBooking: (id: string) => fetchAPI('/api/admin/bookings/' + id + '/confirm', { method: 'POST' }),
  adminCreateBooking: (data: Record<string, unknown>) => fetchAPI('/api/admin/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getAdminPromos: () => fetchAPI('/api/admin/promos'),
  createAdminPromo: (data: Record<string, unknown>) => fetchAPI('/api/admin/promos', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminPromo: (id: number) => fetchAPI('/api/admin/promos/' + id, { method: 'DELETE' }),
  getAdminSettings: () => fetchAPI('/api/admin/settings'),
  updateAdminSetting: (key: string, value: string) => fetchAPI('/api/admin/settings/' + key, { method: 'PUT', body: JSON.stringify({ value }) }),
  getAdminGateways: () => fetchAPI('/api/admin/gateways'),
  updateAdminGateway: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/gateways/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  setGroundCommission: (id: number, rate: number) => fetchAPI('/api/admin/grounds/' + id + '/commission?commission_rate=' + rate, { method: 'PUT' }),
  toggleGround: (id: number) => fetchAPI('/api/admin/grounds/' + id + '/toggle', { method: 'PUT' }),
  featureGround: (id: number) => fetchAPI('/api/admin/grounds/' + id + '/featured', { method: 'PUT' }),
  approveGround: (id: number) => fetchAPI('/api/admin/grounds/' + id + '/approve', { method: 'PUT' }),
  banUser: (id: number) => fetchAPI('/api/admin/users/' + id + '/ban', { method: 'PUT' }),
  suspendUser: (id: number) => fetchAPI('/api/admin/users/' + id + '/suspend', { method: 'PUT' }),
  verifyKYC: (id: number) => fetchAPI('/api/admin/users/' + id + '/kyc/verify', { method: 'PUT' }),
  getAdminSettlements: () => fetchAPI('/api/admin/settlements'),
  processSettlement: (ownerId: number) => fetchAPI('/api/admin/settlements/' + ownerId + '/process', { method: 'POST' }),
  getRevenueReport: (period: string) => fetchAPI('/api/admin/reports/revenue?period=' + period),
  getGroundReport: () => fetchAPI('/api/admin/reports/grounds'),
  getGroundStatementCSV: (groundId: number) => fetchAPI('/api/admin/grounds/' + groundId + '/statement/csv'),
  getGroundStatementPDF: (groundId: number) => fetchAPI('/api/admin/grounds/' + groundId + '/statement/pdf'),
  testTelegram: () => fetchAPI('/api/admin/notifications/telegram/test', { method: 'POST' }),
  toggleFavourite: (groundId: number) => fetchAPI('/api/grounds/' + groundId + '/favourite', { method: 'POST' }),
  rateBooking: (bookingId: string, rating: number, review: string) => fetchAPI('/api/bookings/' + bookingId + '/rate', { method: 'POST', body: JSON.stringify({ rating, review }) }),
  // v6 new endpoints
  verifyCashPayment: (id: string) => fetchAPI('/api/admin/bookings/' + id + '/verify-cash', { method: 'POST' }),
  rejectCashPayment: (id: string) => fetchAPI('/api/admin/bookings/' + id + '/reject-cash', { method: 'POST' }),
  markNoShow: (id: string) => fetchAPI('/api/admin/bookings/' + id + '/no-show', { method: 'POST' }),
  toggleGroundApproval: (id: number) => fetchAPI('/api/admin/grounds/' + id + '/approval', { method: 'PUT' }),
  adminOwnerApprove: (id: string) => fetchAPI('/api/admin/bookings/' + id + '/owner-approve', { method: 'POST' }),
  getWithdrawals: (status?: string) => fetchAPI('/api/admin/withdrawals' + (status ? '?status=' + status : '')),
  approveWithdrawal: (id: number) => fetchAPI('/api/admin/withdrawals/' + id + '/approve', { method: 'POST' }),
  rejectWithdrawal: (id: number) => fetchAPI('/api/admin/withdrawals/' + id + '/reject', { method: 'POST' }),
  getPendingKYC: () => fetchAPI('/api/admin/kyc/pending'),
  rejectKYC: (id: number, reason?: string) => fetchAPI('/api/admin/users/' + id + '/kyc/reject', { method: 'PUT', body: JSON.stringify({ reason: reason || 'Your KYC documents could not be verified. Please re-submit with valid documents.' }) }),
  getNotificationConfig: () => fetchAPI('/api/admin/notifications/config'),
  updateNotificationConfig: (data: Record<string, unknown>) => fetchAPI('/api/admin/notifications/config', { method: 'PUT', body: JSON.stringify(data) }),
  ownerApproveBooking: (id: string) => fetchAPI('/api/owner/bookings/' + id + '/approve', { method: 'POST' }),
  getOwnerWallet: () => fetchAPI('/api/owner/wallet'),
  addOwnerSlot: (data: Record<string, unknown>) => fetchAPI('/api/owner/slots/add', { method: 'POST', body: JSON.stringify(data) }),
  updateOwnerSlot: (slotId: number, data: Record<string, unknown>) => fetchAPI('/api/owner/slots/' + slotId, { method: 'PUT', body: JSON.stringify(data) }),
  // v7 new endpoints
  deleteOwnerSlot: (slotId: number) => fetchAPI('/api/owner/slots/' + slotId, { method: 'DELETE' }),
  getOwnerTransactions: () => fetchAPI('/api/owner/transactions'),
  getUserTransactions: () => fetchAPI('/api/users/me/transactions'),
  // v8 - Tickets & KYC
  createTicket: (data: Record<string, unknown>) => fetchAPI('/api/users/me/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getMyTickets: () => fetchAPI('/api/users/me/tickets'),
  replyTicket: (ticketId: number, message: string) => fetchAPI('/api/users/me/tickets/' + ticketId + '/reply', { method: 'POST', body: JSON.stringify({ message }) }),
  createOwnerTicket: (data: Record<string, unknown>) => fetchAPI('/api/owner/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getOwnerTickets: () => fetchAPI('/api/owner/tickets'),
  replyOwnerTicket: (ticketId: number, message: string) => fetchAPI('/api/owner/tickets/' + ticketId + '/reply', { method: 'POST', body: JSON.stringify({ message }) }),
  getAdminTickets: (status?: string) => fetchAPI('/api/admin/tickets' + (status ? '?status=' + status : '')),
  replyAdminTicket: (ticketId: number, message: string) => fetchAPI('/api/admin/tickets/' + ticketId + '/reply', { method: 'POST', body: JSON.stringify({ message }) }),
  updateTicketStatus: (ticketId: number, status: string) => fetchAPI('/api/admin/tickets/' + ticketId + '/status', { method: 'PUT', body: JSON.stringify({ status }) }),
  getAllKYC: () => fetchAPI('/api/admin/kyc/all'),
  getKYCDetails: (userId: number) => fetchAPI('/api/admin/kyc/' + userId),
  // v9 - Team data, withdrawal with txn details
  getAdminTeams: () => fetchAPI('/api/admin/teams'),
  approveWithdrawalWithDetails: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/withdrawals/' + id + '/approve', { method: 'POST', body: JSON.stringify(data) }),
  uploadWithdrawalProof: async (wid: number, file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['X-Auth-Token'] = token;
    const API_URL_VAL = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${API_URL_VAL}/api/admin/withdrawals/${wid}/upload-proof`, { method: 'POST', headers, body: formData });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(typeof err.detail === 'string' ? err.detail : 'Upload failed'); }
    return res.json();
  },
  razorpayPayout: (wid: number) => fetchAPI('/api/admin/withdrawals/' + wid + '/razorpay-payout', { method: 'POST' }),
  // v10 - Transaction history, owner cash verification
  getAdminTransactionHistory: () => fetchAPI('/api/admin/transactions/history'),
  ownerVerifyCash: (id: string) => fetchAPI('/api/owner/bookings/' + id + '/verify-cash', { method: 'POST' }),
  // v11 - Settlements CSV, Team CSV, Reports, Email, Re-KYC, Roles
  getSettlementsCSV: () => fetchAPI('/api/admin/settlements/csv'),
  getTeamsCSV: () => fetchAPI('/api/admin/teams/csv'),
  emailGroundStatement: (groundId: number) => fetchAPI('/api/admin/grounds/' + groundId + '/statement/email', { method: 'POST' }),
  triggerReKYC: (userId: number) => fetchAPI('/api/admin/users/' + userId + '/kyc/rekyc', { method: 'PUT' }),
  sendTestEmail: (toEmail: string) => fetchAPI('/api/admin/notifications/email/test', { method: 'POST', body: JSON.stringify({ to_email: toEmail }) }),
  sendNotification: (data: Record<string, unknown>) => fetchAPI('/api/admin/notifications/send', { method: 'POST', body: JSON.stringify(data) }),
  // v12 new endpoints
  changePassword: (currentPassword: string, newPassword: string) => fetchAPI('/api/users/me/password', { method: 'PUT', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),
  ownerMarkNoShow: (bookingId: string) => fetchAPI('/api/owner/bookings/' + bookingId + '/no-show', { method: 'POST' }),
  getSettlementsPDF: () => fetchAPI('/api/admin/settlements/pdf'),
  getWithdrawalsCSV: (status?: string) => fetchAPI('/api/admin/withdrawals/csv' + (status ? '?status=' + status : '')),
  getWithdrawalsPDF: (status?: string) => fetchAPI('/api/admin/withdrawals/pdf' + (status ? '?status=' + status : '')),
  getTransactionsCSV: () => fetchAPI('/api/admin/transactions/csv'),
  getTransactionsPDF: () => fetchAPI('/api/admin/transactions/pdf'),
  getUserTransactionsCSV: () => fetchAPI('/api/users/me/transactions/csv'),
  getCustomizeSettings: () => fetchAPI('/api/admin/settings/customize'),
  updateCustomizeSettings: (data: Record<string, unknown>) => fetchAPI('/api/admin/settings/customize', { method: 'PUT', body: JSON.stringify(data) }),
  getKYCImage: (userId: number) => fetchAPI('/api/admin/kyc/image/' + userId),
  getDetailedReport: (reportType: string) => fetchAPI('/api/admin/reports/detailed?report_type=' + reportType),
  getReportCSV: (reportType: string) => fetchAPI('/api/admin/reports/csv?report_type=' + reportType),
  emailReport: (toEmail: string, reportType: string) => fetchAPI('/api/admin/reports/email', { method: 'POST', body: JSON.stringify({ to_email: toEmail, report_type: reportType }) }),
  getAdminRoles: () => fetchAPI('/api/admin/roles'),
  updateUserPermissions: (userId: number, data: Record<string, unknown>) => fetchAPI('/api/admin/users/' + userId + '/permissions', { method: 'PUT', body: JSON.stringify(data) }),
  // v13 - New features
  // Chat
  sendChat: (receiverId: number, message: string, groundId?: number) => fetchAPI('/api/chat/send', { method: 'POST', body: JSON.stringify({ receiver_id: receiverId, message, ground_id: groundId }) }),
  getChatMessages: (otherUserId: number, groundId?: number) => fetchAPI('/api/chat/messages/' + otherUserId + (groundId ? '?ground_id=' + groundId : '')),
  getChatConversations: () => fetchAPI('/api/chat/conversations'),
  // Owner features
  getOwnerAnalytics: () => fetchAPI('/api/owner/analytics'),
  getDynamicPricing: () => fetchAPI('/api/owner/dynamic-pricing'),
  addDynamicPricing: (data: Record<string, unknown>) => fetchAPI('/api/owner/dynamic-pricing', { method: 'POST', body: JSON.stringify(data) }),
  deleteDynamicPricing: (id: number) => fetchAPI('/api/owner/dynamic-pricing/' + id, { method: 'DELETE' }),
  getOwnerStaff: () => fetchAPI('/api/owner/staff'),
  addOwnerStaff: (data: Record<string, unknown>) => fetchAPI('/api/owner/staff', { method: 'POST', body: JSON.stringify(data) }),
  deleteOwnerStaff: (id: number) => fetchAPI('/api/owner/staff/' + id, { method: 'DELETE' }),
  getOwnerCoupons: () => fetchAPI('/api/owner/coupons'),
  addOwnerCoupon: (data: Record<string, unknown>) => fetchAPI('/api/owner/coupons', { method: 'POST', body: JSON.stringify(data) }),
  deleteOwnerCoupon: (id: number) => fetchAPI('/api/owner/coupons/' + id, { method: 'DELETE' }),
  getOwnerExpenses: () => fetchAPI('/api/owner/expenses'),
  addOwnerExpense: (data: Record<string, unknown>) => fetchAPI('/api/owner/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteOwnerExpense: (id: number) => fetchAPI('/api/owner/expenses/' + id, { method: 'DELETE' }),
  getOwnerMaintenance: () => fetchAPI('/api/owner/maintenance'),
  addOwnerMaintenance: (data: Record<string, unknown>) => fetchAPI('/api/owner/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  deleteOwnerMaintenance: (id: number) => fetchAPI('/api/owner/maintenance/' + id, { method: 'DELETE' }),
  getOwnerAutoReplies: () => fetchAPI('/api/owner/auto-replies'),
  addOwnerAutoReply: (data: Record<string, unknown>) => fetchAPI('/api/owner/auto-replies', { method: 'POST', body: JSON.stringify(data) }),
  deleteOwnerAutoReply: (id: number) => fetchAPI('/api/owner/auto-replies/' + id, { method: 'DELETE' }),
  getOwnerCRM: () => fetchAPI('/api/owner/crm'),
  getOwnerGallery: (groundId: number) => fetchAPI('/api/owner/gallery/' + groundId),
  addGalleryImage: (data: Record<string, unknown>) => fetchAPI('/api/owner/gallery', { method: 'POST', body: JSON.stringify(data) }),
  deleteGalleryImage: (id: number) => fetchAPI('/api/owner/gallery/' + id, { method: 'DELETE' }),
  // Tournaments
  getTournaments: () => fetchAPI('/api/tournaments'),
  createTournament: (data: Record<string, unknown>) => fetchAPI('/api/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  registerTournament: (id: number, data: Record<string, unknown>) => fetchAPI('/api/tournaments/' + id + '/register', { method: 'POST', body: JSON.stringify(data) }),
  // Memberships
  getMemberships: () => fetchAPI('/api/memberships'),
  createMembership: (data: Record<string, unknown>) => fetchAPI('/api/memberships', { method: 'POST', body: JSON.stringify(data) }),
  subscribeMembership: (planId: number) => fetchAPI('/api/memberships/' + planId + '/subscribe', { method: 'POST' }),
  getMyMemberships: () => fetchAPI('/api/users/me/memberships'),
  // Waitlist
  joinWaitlist: (data: Record<string, unknown>) => fetchAPI('/api/waitlist', { method: 'POST', body: JSON.stringify(data) }),
  getMyWaitlist: () => fetchAPI('/api/waitlist'),
  leaveWaitlist: (id: number) => fetchAPI('/api/waitlist/' + id, { method: 'DELETE' }),
  // Invoice
  getInvoice: (bookingId: string) => fetchAPI('/api/invoices/' + bookingId),
  // Favourites
  getMyFavourites: () => fetchAPI('/api/users/me/favourites'),
  // Blog
  getBlogPosts: (publishedOnly?: boolean) => fetchAPI('/api/blog' + (publishedOnly === false ? '?published_only=false' : '')),
  createBlogPost: (data: Record<string, unknown>) => fetchAPI('/api/admin/blog', { method: 'POST', body: JSON.stringify(data) }),
  updateBlogPost: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/blog/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBlogPost: (id: number) => fetchAPI('/api/admin/blog/' + id, { method: 'DELETE' }),
  // Marketing
  getMarketingCampaigns: () => fetchAPI('/api/admin/marketing'),
  createMarketingCampaign: (data: Record<string, unknown>) => fetchAPI('/api/admin/marketing', { method: 'POST', body: JSON.stringify(data) }),
  sendMarketingCampaign: (id: number) => fetchAPI('/api/admin/marketing/' + id + '/send', { method: 'POST' }),
  deleteMarketingCampaign: (id: number) => fetchAPI('/api/admin/marketing/' + id, { method: 'DELETE' }),
  // Affiliates
  getAffiliates: () => fetchAPI('/api/admin/affiliates'),
  createAffiliate: (data: Record<string, unknown>) => fetchAPI('/api/admin/affiliates', { method: 'POST', body: JSON.stringify(data) }),
  // Push Notifications
  getPushNotifications: () => fetchAPI('/api/admin/push-notifications'),
  sendPushNotification: (data: Record<string, unknown>) => fetchAPI('/api/admin/push-notifications', { method: 'POST', body: JSON.stringify(data) }),
  // City Reports
  getCityReports: () => fetchAPI('/api/admin/reports/city'),
  // Auto Settlements
  autoSettle: () => fetchAPI('/api/admin/auto-settle', { method: 'POST' }),
  // App Version
  getAppVersion: () => fetchAPI('/api/admin/app-version'),
  updateAppVersion: (data: Record<string, unknown>) => fetchAPI('/api/admin/app-version', { method: 'PUT', body: JSON.stringify(data) }),
  // Weather
  getWeather: (city: string) => fetchAPI('/api/weather/' + encodeURIComponent(city)),
  // Recurring Bookings
  createRecurringBooking: (data: Record<string, unknown>) => fetchAPI('/api/bookings/recurring', { method: 'POST', body: JSON.stringify(data) }),
  getMyRecurringBookings: () => fetchAPI('/api/bookings/recurring'),
  cancelRecurringBooking: (id: number) => fetchAPI('/api/bookings/recurring/' + id, { method: 'DELETE' }),
  // KYC Document Upload
  // v14 - Owner wallets, staff details, image upload
  getOwnerWallets: () => fetchAPI('/api/admin/owner-wallets'),
  getOwnerStaffAdmin: (ownerId: number) => fetchAPI('/api/admin/owner/' + ownerId + '/staff'),
  uploadGalleryImage: async (groundId: number, file: File, caption: string) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const result = await fetchAPI('/api/admin/gallery/upload', {
            method: 'POST',
            body: JSON.stringify({ ground_id: groundId, image_data: reader.result, caption }),
          });
          resolve(result);
        } catch (e) { reject(e); }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },
  // V17 - New feature endpoints
  // Tournament Management (Admin)
  getAdminTournaments: () => fetchAPI('/api/admin/tournaments'),
  createAdminTournament: (data: Record<string, unknown>) => fetchAPI('/api/admin/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminTournament: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/tournaments/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminTournament: (id: number) => fetchAPI('/api/admin/tournaments/' + id, { method: 'DELETE' }),
  getTournamentRegistrations: (id: number) => fetchAPI('/api/admin/tournaments/' + id + '/registrations'),
  // Audit Log
  getAuditLog: () => fetchAPI('/api/admin/audit-log'),
  addAuditLog: (data: Record<string, unknown>) => fetchAPI('/api/admin/audit-log', { method: 'POST', body: JSON.stringify(data) }),
  // Equipment Rental
  getAdminEquipment: () => fetchAPI('/api/admin/equipment'),
  addAdminEquipment: (data: Record<string, unknown>) => fetchAPI('/api/admin/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminEquipment: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/equipment/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminEquipment: (id: number) => fetchAPI('/api/admin/equipment/' + id, { method: 'DELETE' }),
  getGroundEquipment: (groundId: number) => fetchAPI('/api/equipment/' + groundId),
  // Loyalty Points
  getAdminLoyalty: () => fetchAPI('/api/admin/loyalty'),
  adjustLoyaltyPoints: (data: Record<string, unknown>) => fetchAPI('/api/admin/loyalty/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getMyLoyaltyPoints: () => fetchAPI('/api/loyalty/my-points'),
  redeemLoyaltyPoints: (points: number) => fetchAPI('/api/loyalty/redeem', { method: 'POST', body: JSON.stringify({ points }) }),
  // Auto Settlement
  getAutoSettlements: () => fetchAPI('/api/admin/auto-settlements'),
  createAutoSettlement: (data: Record<string, unknown>) => fetchAPI('/api/admin/auto-settlements', { method: 'POST', body: JSON.stringify(data) }),
  runAutoSettlements: () => fetchAPI('/api/admin/auto-settlements/run', { method: 'POST' }),
  // Email Templates
  getEmailTemplates: () => fetchAPI('/api/admin/email-templates'),
  updateEmailTemplate: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/email-templates/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  previewEmailTemplate: (data: Record<string, unknown>) => fetchAPI('/api/admin/email-templates/preview', { method: 'POST', body: JSON.stringify(data) }),
  // Pages (CMS)
  getAdminPages: () => fetchAPI('/api/admin/pages'),
  updateAdminPage: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/pages/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  createAdminPage: (data: Record<string, unknown>) => fetchAPI('/api/admin/pages', { method: 'POST', body: JSON.stringify(data) }),
  getPublicPage: (slug: string) => fetchAPI('/api/pages/' + slug),
  // Bulk Operations
  bulkBookingAction: (action: string, ids: string[]) => fetchAPI('/api/admin/bulk/bookings', { method: 'POST', body: JSON.stringify({ action, ids }) }),
  bulkUserAction: (action: string, ids: number[]) => fetchAPI('/api/admin/bulk/users', { method: 'POST', body: JSON.stringify({ action, ids }) }),
  bulkGroundAction: (action: string, ids: number[]) => fetchAPI('/api/admin/bulk/grounds', { method: 'POST', body: JSON.stringify({ action, ids }) }),
  // V18 - New endpoints
  registerTournamentWithPayment: (id: number, data: Record<string, unknown>) => fetchAPI('/api/tournaments/' + id + '/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyTournamentPayment: (id: number, data: Record<string, unknown>) => fetchAPI('/api/tournaments/' + id + '/verify-payment', { method: 'POST', body: JSON.stringify(data) }),
  ownerVerifyTournamentReg: (tournamentId: number, regId: number) => fetchAPI('/api/owner/tournaments/' + tournamentId + '/verify-registration/' + regId, { method: 'POST' }),
  getChatContacts: () => fetchAPI('/api/chat/contacts'),
  getAvailableSlots: (groundId: number, date: string) => fetchAPI('/api/grounds/' + groundId + '/available-slots?date=' + date),
  requestGroundChange: (data: Record<string, unknown>) => fetchAPI('/api/owner/ground-change-request', { method: 'POST', body: JSON.stringify(data) }),
  getOwnerChangeRequests: () => fetchAPI('/api/owner/ground-change-requests'),
  getAdminChangeRequests: () => fetchAPI('/api/admin/ground-change-requests'),
  approveChangeRequest: (id: number) => fetchAPI('/api/admin/ground-change-requests/' + id + '/approve', { method: 'POST' }),
  rejectChangeRequest: (id: number) => fetchAPI('/api/admin/ground-change-requests/' + id + '/reject', { method: 'POST' }),
  adminSettlementPayout: (data: Record<string, unknown>) => fetchAPI('/api/admin/settlement-payout', { method: 'POST', body: JSON.stringify(data) }),
  getSettlementStatement: (ownerId: number) => fetchAPI('/api/admin/settlement-statement/' + ownerId),
  getKYCHistory: (userId: number) => fetchAPI('/api/admin/kyc/history/' + userId),
  updateAffiliate: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/affiliates/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAffiliate: (id: number) => fetchAPI('/api/admin/affiliates/' + id, { method: 'DELETE' }),
  updateLoyaltySettings: (data: Record<string, unknown>) => fetchAPI('/api/admin/loyalty/settings', { method: 'PUT', body: JSON.stringify(data) }),
  createEmailTemplate: (data: Record<string, unknown>) => fetchAPI('/api/admin/email-templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteEmailTemplate: (id: number) => fetchAPI('/api/admin/email-templates/' + id, { method: 'DELETE' }),
  bulkDelete: (entity: string, ids: number[]) => fetchAPI('/api/admin/bulk/delete', { method: 'POST', body: JSON.stringify({ entity, ids }) }),
  createOwnerTournament: (data: Record<string, unknown>) => fetchAPI('/api/owner/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  getOwnerTournaments: () => fetchAPI('/api/owner/tournaments'),
  updateOwnerTournament: (id: number, data: Record<string, unknown>) => fetchAPI('/api/owner/tournaments/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOwnerTournament: (id: number) => fetchAPI('/api/owner/tournaments/' + id, { method: 'DELETE' }),
  updateOwnerEquipment: (id: number, data: Record<string, unknown>) => fetchAPI('/api/owner/equipment/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOwnerEquipment: (id: number) => fetchAPI('/api/owner/equipment/' + id, { method: 'DELETE' }),
  getAdminGroundPhotos: (groundId: number) => fetchAPI('/api/admin/grounds/' + groundId + '/photos'),
  addAdminGroundPhoto: (groundId: number, data: Record<string, unknown>) => fetchAPI('/api/admin/grounds/' + groundId + '/photos', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminGroundPhoto: (photoId: number) => fetchAPI('/api/admin/grounds/photos/' + photoId, { method: 'DELETE' }),
  getAdminGroundFull: (groundId: number) => fetchAPI('/api/admin/grounds/' + groundId + '/full'),
  getAutoSettlementConfig: () => fetchAPI('/api/admin/auto-settlements/config'),
  updateAutoSettlementConfig: (data: Record<string, unknown>) => fetchAPI('/api/admin/auto-settlements/config', { method: 'PUT', body: JSON.stringify(data) }),
  rentEquipment: (data: Record<string, unknown>) => fetchAPI('/api/equipment/rent', { method: 'POST', body: JSON.stringify(data) }),
  bulkCSVImport: (entity: string, data: string) => fetchAPI('/api/admin/bulk/csv-import', { method: 'POST', body: JSON.stringify({ entity, csv_data: data }) }),
  getMyTournamentRegistrations: () => fetchAPI('/api/tournaments/my-registrations'),
  cancelTournamentRegistration: (tournamentId: number) => fetchAPI('/api/tournaments/' + tournamentId + '/cancel', { method: 'POST' }),
  getOwnerTournamentRegistrations: (tournamentId: number) => fetchAPI('/api/owner/tournaments/' + tournamentId + '/registrations'),
  ownerCancelTournamentRegistration: (tournamentId: number, regId: number) => fetchAPI('/api/owner/tournaments/' + tournamentId + '/cancel-registration/' + regId, { method: 'POST' }),
  adminCancelTournamentRegistration: (tournamentId: number, regId: number) => fetchAPI('/api/admin/tournaments/' + tournamentId + '/cancel-registration/' + regId, { method: 'POST' }),
  adminCancelTournamentReg: (tournamentId: number, regId: number) => fetchAPI('/api/admin/tournaments/' + tournamentId + '/cancel-registration/' + regId, { method: 'POST' }),
  // Contact form & admin contact submissions
  submitContactForm: (data: Record<string, unknown>) => fetchAPI('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
  getContactSubmissions: () => fetchAPI('/api/admin/contact-submissions'),
  updateContactSubmission: (id: number, data: Record<string, unknown>) => fetchAPI('/api/admin/contact-submissions/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContactSubmission: (id: number) => fetchAPI('/api/admin/contact-submissions/' + id, { method: 'DELETE' }),
  // Razorpay Payment Integration
  createRazorpayOrder: (data: Record<string, unknown>) => fetchAPI('/api/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyRazorpayPayment: (data: Record<string, unknown>) => fetchAPI('/api/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  razorpayPaymentFailed: (data: Record<string, unknown>) => fetchAPI('/api/payments/failed', { method: 'POST', body: JSON.stringify(data) }),
  getRazorpayGatewayInfo: () => fetchAPI('/api/payments/gateway-info'),
  // Split Payments
  createSplitPayment: (data: Record<string, unknown>) => fetchAPI('/api/split-payments', { method: 'POST', body: JSON.stringify(data) }),
  getMySplitPayments: () => fetchAPI('/api/split-payments'),
  markSplitMemberPaid: (splitId: number, memberId: number) => fetchAPI(`/api/split-payments/${splitId}/member/${memberId}/paid`, { method: 'PUT' }),
  adminGetSplitPayments: () => fetchAPI('/api/admin/split-payments'),
  uploadKYCDocument: async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file);
    const headers: Record<string, string> = {};
    if (token) headers['X-Auth-Token'] = token;
    if (API_AUTH) headers['Authorization'] = 'Basic ' + API_AUTH;
    const res = await fetch(`${API_URL}/api/users/me/kyc/upload`, { method: 'POST', headers, body: formData });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(err.detail || 'Upload failed'); }
    return res.json();
  },
};
