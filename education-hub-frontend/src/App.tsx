import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getUser } from "./lib/api";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUniversities from "./pages/admin/Universities";
import AdminCategories from "./pages/admin/Categories";
import AdminStudents from "./pages/admin/Students";
import AdminExams from "./pages/admin/Exams";
import AdminAccounts from "./pages/admin/Accounts";
import AdminSupport from "./pages/admin/Support";
import AdminDocuments from "./pages/admin/Documents";
import AdminBranches from "./pages/admin/Branches";
import AdminSettings from "./pages/admin/Settings";
import AdminEnquiries from "./pages/admin/Enquiries";
import AdminTeam from "./pages/admin/Team";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminRoles from "./pages/admin/Roles";
import AdminStudentStatus from "./pages/admin/StudentStatusCategories";
import AdminBulkUpload from "./pages/admin/BulkUpload";
import AdminBlog from "./pages/admin/Blog";
import AdminGallery from "./pages/admin/Gallery";
import AdminCareers from "./pages/admin/Careers";
import AdminLeads from "./pages/admin/Leads";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminCommunication from "./pages/admin/Communication";
import StudentLayout from "./components/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentTickets from "./pages/student/Tickets";
import PublicLayout from "./components/PublicLayout";
import Home from "./pages/public/Home";
import Courses from "./pages/public/Courses";
import CourseDetail from "./pages/public/CourseDetail";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Enquiry from "./pages/public/Enquiry";
import Team from "./pages/public/Team";
import Services from "./pages/public/Services";
import BlogPage from "./pages/public/BlogPage";
import GalleryPage from "./pages/public/GalleryPage";
import CareersPage from "./pages/public/CareersPage";
import ClientsPartners from "./pages/public/ClientsPartners";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import TermsConditions from "./pages/public/TermsConditions";
import Universities from "./pages/public/Universities";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDocuments from "./pages/student/Documents";
import StudentExamTimetable from "./pages/student/ExamTimetable";
import StudentFees from "./pages/student/Fees";
import AdminNotices from "./pages/admin/Notices";
import AdminChat from "./pages/admin/Chat";
import AdminPlacements from "./pages/admin/Placements";
import StudentNotices from "./pages/student/Notices";
import StudentChat from "./pages/student/Chat";
import StudentPlacements from "./pages/student/Placements";
import PlatformLogin from "./pages/platform/PlatformLogin";
import PlatformLayout from "./components/PlatformLayout";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformTenants from "./pages/platform/PlatformTenants";
import PlatformInstallations from "./pages/platform/PlatformInstallations";
import CenterLayout from "./components/CenterLayout";
import CenterDashboard from "./pages/center/Dashboard";
import CenterStudents from "./pages/center/Students";
import CenterDocuments from "./pages/center/Documents";
import CenterFees from "./pages/center/Fees";
import CenterSubCenters from "./pages/center/SubCenters";
import CenterCommission from "./pages/center/Commission";
import CenterPaymentSettings from "./pages/center/PaymentSettings";
import CenterSupport from "./pages/center/Support";
import CenterAnnouncements from "./pages/center/Announcements";
import CenterExamTimetable from "./pages/center/ExamTimetable";
import CenterSettings from "./pages/center/Settings";
import AdminCenters from "./pages/admin/Centers";
import AdminCommissionSlabs from "./pages/admin/CommissionSlabs";
import AdminPopups from "./pages/admin/Popups";

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: string }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" />;
  if (role === "admin" && (user.role === "student" || user.role === "center")) {
    return <Navigate to="/login" />;
  }
  if (role === "student" && user.role !== "student") {
    return <Navigate to="/login" />;
  }
  if (role === "center" && user.role !== "center") {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/platform/login" element={<PlatformLogin />} />
        <Route path="/platform" element={<PlatformLayout />}>
          <Route index element={<PlatformDashboard />} />
          <Route path="tenants" element={<PlatformTenants />} />
          <Route path="installations" element={<PlatformInstallations />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="universities" element={<AdminUniversities />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="student-status" element={<AdminStudentStatus />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="bulk-upload" element={<AdminBulkUpload />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="careers" element={<AdminCareers />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="communication" element={<AdminCommunication />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="popups" element={<AdminPopups />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="placements" element={<AdminPlacements />} />
          <Route path="centers" element={<AdminCenters />} />
          <Route path="commission-slabs" element={<AdminCommissionSlabs />} />
        </Route>
        
        <Route path="/center" element={<ProtectedRoute role="center"><CenterLayout /></ProtectedRoute>}>
          <Route index element={<CenterDashboard />} />
          <Route path="students" element={<CenterStudents />} />
          <Route path="documents" element={<CenterDocuments />} />
          <Route path="fees" element={<CenterFees />} />
          <Route path="sub-centers" element={<CenterSubCenters />} />
          <Route path="commission" element={<CenterCommission />} />
          <Route path="payment-settings" element={<CenterPaymentSettings />} />
          <Route path="support" element={<CenterSupport />} />
          <Route path="announcements" element={<CenterAnnouncements />} />
          <Route path="exam-timetable" element={<CenterExamTimetable />} />
          <Route path="settings" element={<CenterSettings />} />
        </Route>
        
        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="exam-timetable" element={<StudentExamTimetable />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="chat" element={<StudentChat />} />
          <Route path="placements" element={<StudentPlacements />} />
          <Route path="tickets" element={<StudentTickets />} />
        </Route>
        
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="universities" element={<Universities />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:slug" element={<CourseDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="enquiry" element={<Enquiry />} />
          <Route path="team" element={<Team />} />
          <Route path="services" element={<Services />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="clients" element={<ClientsPartners />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-conditions" element={<TermsConditions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
