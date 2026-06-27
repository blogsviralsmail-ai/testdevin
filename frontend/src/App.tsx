import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ChatPage from './pages/chat/ChatPage';
import ContactsPage from './pages/contacts/ContactsPage';
import CampaignsPage from './pages/campaigns/CampaignsPage';
import BotReplyPage from './pages/bot-reply/BotReplyPage';
import BotFlowPage from './pages/bot-flow/BotFlowPage';
import TemplatesPage from './pages/templates/TemplatesPage';
import PresetMessagesPage from './pages/preset-messages/PresetMessagesPage';
import FormsPage from './pages/forms/FormsPage';
import FlowsPage from './pages/flows/FlowsPage';
import VendorsPage from './pages/vendors/VendorsPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import PagesBuilderPage from './pages/pages-builder/PagesBuilderPage';
import BlogPage from './pages/blog/BlogPage';
import SettingsPage from './pages/settings/SettingsPage';
import UsersPage from './pages/users/UsersPage';
import MarketingPage from './pages/marketing/MarketingPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import PaymentLinksPage from './pages/payment-links/PaymentLinksPage';
import ProductCatalogPage from './pages/product-catalog/ProductCatalogPage';
import FacebookPage from './pages/facebook/FacebookPage';
import InstagramPage from './pages/instagram/InstagramPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:contactUid" element={<ChatPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="bot-reply" element={<BotReplyPage />} />
          <Route path="bot-flow" element={<BotFlowPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="preset-messages" element={<PresetMessagesPage />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="flows" element={<FlowsPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="pages" element={<PagesBuilderPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="payment-links" element={<PaymentLinksPage />} />
          <Route path="product-catalog" element={<ProductCatalogPage />} />
          <Route path="facebook" element={<FacebookPage />} />
          <Route path="instagram" element={<InstagramPage />} />
        </Route>
      </Routes>
    </>
  );
}
