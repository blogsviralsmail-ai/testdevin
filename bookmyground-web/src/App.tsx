import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GroundDetailPage from './pages/GroundDetailPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FavouritesPage from './pages/FavouritesPage';
import ExportPage from './pages/ExportPage';
import ComparisonPage from './pages/ComparisonPage';
import GroupBookingPage from './pages/GroupBookingPage';
import RecurringBookingPage from './pages/RecurringBookingPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import TournamentPage from './pages/TournamentPage';
import MembershipPage from './pages/MembershipPage';
import WaitlistPage from './pages/WaitlistPage';
import WeatherPage from './pages/WeatherPage';
import InvoicePage from './pages/InvoicePage';
import PaymentSplitPage from './pages/PaymentSplitPage';
import PublicPage from './pages/PublicPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import WalletPage from './pages/WalletPage';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ground/:id" element={<GroundDetailPage />} />
        <Route path="/book/:groundId" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/owner/*" element={<OwnerDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/favourites" element={<FavouritesPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/group-booking" element={<GroupBookingPage />} />
        <Route path="/recurring" element={<RecurringBookingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/tournaments" element={<TournamentPage />} />
        <Route path="/memberships" element={<MembershipPage />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/invoices" element={<InvoicePage />} />
        <Route path="/split-payment" element={<PaymentSplitPage />} />
        <Route path="/page/:slug" element={<PublicPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
