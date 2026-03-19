import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryPage from "./pages/CategoryPage";
import DesignPage from "./pages/DesignPage";
import GoldRatePage from "./pages/GoldRatePage";
import BlogListPage from "./pages/BlogListPage";
import BlogPage from "./pages/BlogPage";
import { AboutPage, ContactPage, PrivacyPage, DisclaimerPage } from "./pages/StaticPages";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminDesigns from "./pages/admin/AdminDesigns";
import AdminBlogs from "./pages/admin/AdminBlogs";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/designs" element={<AdminDesigns />} />
            <Route path="/admin/blogs" element={<AdminBlogs />} />

            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/categories" element={<PublicLayout><CategoriesPage /></PublicLayout>} />
            <Route path="/category/:slug" element={<PublicLayout><CategoryPage /></PublicLayout>} />
            <Route path="/design/:slug" element={<PublicLayout><DesignPage /></PublicLayout>} />
            <Route path="/gold-rate" element={<PublicLayout><GoldRatePage /></PublicLayout>} />
            <Route path="/blog" element={<PublicLayout><BlogListPage /></PublicLayout>} />
            <Route path="/blog/:slug" element={<PublicLayout><BlogPage /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
            <Route path="/disclaimer" element={<PublicLayout><DisclaimerPage /></PublicLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
