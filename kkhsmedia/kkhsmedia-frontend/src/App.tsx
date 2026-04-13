import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LiveSlotsPage from './pages/dashboard/LiveSlotsPage';
import VideosPage from './pages/dashboard/VideosPage';
import BillingPage from './pages/dashboard/BillingPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import WebhooksPage from './pages/dashboard/WebhooksPage';
import ReferralsPage from './pages/dashboard/ReferralsPage';
import ResellerPage from './pages/dashboard/ResellerPage';
import StreamHealthPage from './pages/dashboard/StreamHealthPage';
import SchedulePage from './pages/dashboard/SchedulePage';
import OverlaysPage from './pages/dashboard/OverlaysPage';
import SecurityPage from './pages/dashboard/SecurityPage';
import RtmpPullPage from './pages/dashboard/RtmpPullPage';
import BandwidthPage from './pages/dashboard/BandwidthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSlots from './pages/admin/AdminSlots';
import AdminVideos from './pages/admin/AdminVideos';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminContacts from './pages/admin/AdminContacts';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminResellers from './pages/admin/AdminResellers';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminServers from './pages/admin/AdminServers';
import AdminRoles from './pages/admin/AdminRoles';
import DashboardLayout from './components/layout/DashboardLayout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin' && user.role !== 'moderator') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* User Dashboard */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/live-slots" element={<LiveSlotsPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/reseller" element={<ResellerPage />} />
        <Route path="/stream-health" element={<StreamHealthPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/overlays" element={<OverlaysPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/rtmp-pull" element={<RtmpPullPage />} />
        <Route path="/bandwidth" element={<BandwidthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin */}
      <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/slots" element={<AdminSlots />} />
        <Route path="/admin/videos" element={<AdminVideos />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/contacts" element={<AdminContacts />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
        <Route path="/admin/resellers" element={<AdminResellers />} />
        <Route path="/admin/affiliates" element={<AdminAffiliates />} />
        <Route path="/admin/servers" element={<AdminServers />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
