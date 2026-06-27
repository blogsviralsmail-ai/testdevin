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
import AiCallPage from './pages/ai-call/AiCallPage';
import TranslationsPage from './pages/translations/TranslationsPage';
import ContactInquiriesPage from './pages/contact-inquiries/ContactInquiriesPage';
import AddonsPage from './pages/addons/AddonsPage';
import SiteSettingsPage from './pages/site-settings/SiteSettingsPage';
import AutoFollowupPage from './pages/auto-followup/AutoFollowupPage';
import EcommercePage from './pages/ecommerce/EcommercePage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import BirthdayWishesPage from './pages/birthday-wishes/BirthdayWishesPage';
import TeamManagementPage from './pages/team-management/TeamManagementPage';
import MessageLogsPage from './pages/message-logs/MessageLogsPage';
import DripCampaignsPage from './pages/drip-campaigns/DripCampaignsPage';
import QrCodePage from './pages/qr-code/QrCodePage';
import PresetCampaignsPage from './pages/preset-campaigns/PresetCampaignsPage';
import CtwaPage from './pages/marketing-sub/CtwaPage';
import LeadFormsPage from './pages/marketing-sub/LeadFormsPage';
import CatalogsPage from './pages/marketing-sub/CatalogsPage';
import EventNotificationsPage from './pages/marketing-sub/EventNotificationsPage';
import ApiIntegrationPage from './pages/marketing-sub/ApiIntegrationPage';
import WhatsAppOrdersPage from './pages/whatsapp-orders/WhatsAppOrdersPage';
import LabelsPage from './pages/labels/LabelsPage';
import ContactGroupsPage from './pages/contact-groups/ContactGroupsPage';
import ContactFieldsPage from './pages/contact-fields/ContactFieldsPage';
import OneClickSignupPage from './pages/one-click-signup/OneClickSignupPage';
import ConfigPage from './pages/config/ConfigPage';
import ApiDocsPage from './pages/api-docs/ApiDocsPage';
import LicencePage from './pages/licence/LicencePage';
import VendorSettingsPage from './pages/vendor-settings/VendorSettingsPage';
import ShopifyPage from './pages/integrations/ShopifyPage';
import WooCommercePage from './pages/integrations/WooCommercePage';
import GoogleSheetsPage from './pages/integrations/GoogleSheetsPage';
import ApiAccessPage from './pages/integrations/ApiAccessPage';

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

          {/* Inbox / Chat */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:contactUid" element={<ChatPage />} />

          {/* Contacts & Labels */}
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contact-groups" element={<ContactGroupsPage />} />
          <Route path="contact-fields" element={<ContactFieldsPage />} />
          <Route path="labels" element={<LabelsPage />} />

          {/* Marketing & Campaigns */}
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="drip-campaigns" element={<DripCampaignsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="flows" element={<FlowsPage />} />

          {/* Save Money Free Campaign */}
          <Route path="preset-campaigns" element={<PresetCampaignsPage />} />
          <Route path="preset-messages" element={<PresetMessagesPage />} />

          {/* Standalone vendor features */}
          <Route path="auto-followup" element={<AutoFollowupPage />} />
          <Route path="ecommerce" element={<EcommercePage />} />
          <Route path="payment-links" element={<PaymentLinksPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="birthday-wishes" element={<BirthdayWishesPage />} />

          {/* Marketing sub-pages */}
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="marketing/ctwa" element={<CtwaPage />} />
          <Route path="marketing/lead-forms" element={<LeadFormsPage />} />
          <Route path="marketing/catalogs" element={<CatalogsPage />} />
          <Route path="marketing/events" element={<EventNotificationsPage />} />
          <Route path="marketing/api" element={<ApiIntegrationPage />} />

          {/* AI & Automation */}
          <Route path="ai-call" element={<AiCallPage />} />
          <Route path="bot-reply" element={<BotReplyPage />} />
          <Route path="bot-flow" element={<BotFlowPage />} />

          {/* Store & Orders */}
          <Route path="product-catalog" element={<ProductCatalogPage />} />
          <Route path="whatsapp-orders" element={<WhatsAppOrdersPage />} />

          {/* Integrations */}
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="integrations/shopify" element={<ShopifyPage />} />
          <Route path="integrations/woocommerce" element={<WooCommercePage />} />
          <Route path="integrations/google-sheets" element={<GoogleSheetsPage />} />
          <Route path="integrations/api-access" element={<ApiAccessPage />} />

          {/* Channels */}
          <Route path="facebook" element={<FacebookPage />} />
          <Route path="instagram" element={<InstagramPage />} />

          {/* Tools */}
          <Route path="team" element={<TeamManagementPage />} />
          <Route path="message-logs" element={<MessageLogsPage />} />
          <Route path="qr-code" element={<QrCodePage />} />

          {/* Vendor Settings */}
          <Route path="settings/:pageType" element={<VendorSettingsPage />} />

          {/* Billing */}
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="subscription/auto" element={<SubscriptionPage />} />
          <Route path="subscription/manual" element={<SubscriptionPage />} />

          {/* Admin pages */}
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="pages" element={<PagesBuilderPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="translations" element={<TranslationsPage />} />
          <Route path="contact-inquiries" element={<ContactInquiriesPage />} />
          <Route path="addons" element={<AddonsPage />} />
          <Route path="site-settings" element={<SiteSettingsPage />} />
          <Route path="one-click-signup" element={<OneClickSignupPage />} />
          <Route path="config/:pageType" element={<ConfigPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
          <Route path="licence" element={<LicencePage />} />

          {/* Shared */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </>
  );
}
