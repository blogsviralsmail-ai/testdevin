import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { logout, getUser } from "../lib/api";
import { LayoutDashboard, User, LifeBuoy, LogOut, GraduationCap, FileText, Menu as MenuIcon, X, ChevronLeft, Calendar, IndianRupee, Bell, MessageCircle, Briefcase } from "lucide-react";
import api from "../lib/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const menuItems = [
  { path: "/student", label: "Dashboard", icon: LayoutDashboard },
  { path: "/student/profile", label: "My Profile", icon: User },
  { path: "/student/documents", label: "My Documents", icon: FileText },
  { path: "/student/fees", label: "My Fees", icon: IndianRupee },
  { path: "/student/exam-timetable", label: "Exam Timetable", icon: Calendar },
  { path: "/student/notices", label: "Notice Board", icon: Bell },
  { path: "/student/chat", label: "Messages", icon: MessageCircle },
  { path: "/student/placements", label: "Placements", icon: Briefcase },
  { path: "/student/tickets", label: "Support Tickets", icon: LifeBuoy },
];

export default function StudentLayout() {
  const location = useLocation();
  const user = getUser();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [popups, setPopups] = useState<any[]>([]);
  const [activePopup, setActivePopup] = useState<any | null>(null);

  useEffect(() => {
    api.get("/api/students/me").then(r => {
      const s = r.data;
      if (s && s.photo) setStudentPhoto(s.photo.startsWith("/") ? API + s.photo : s.photo);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/api/popups").then(r => {
      const list = Array.isArray(r.data) ? r.data : [];
      setPopups(list);
      setActivePopup(list[0] || null);
    }).catch(() => {});
  }, []);

  const dismissPopup = async () => {
    if (!activePopup) return;
    const pid = activePopup.id;
    try {
      await api.post(`/api/popups/${pid}/dismiss`, {});
    } catch (e) {
      // ignore
    }
    const next = popups.filter(p => p.id !== pid);
    setPopups(next);
    setActivePopup(next[0] || null);
  };

  useEffect(() => { setMobileMenu(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={dismissPopup} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{activePopup.title || "Announcement"}</h2>
              </div>
              <button onClick={dismissPopup} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {activePopup.image_url && (
              <img
                src={(activePopup.image_url || "").startsWith("/") ? API + activePopup.image_url : activePopup.image_url}
                alt={activePopup.title || "Popup"}
                className="mt-3 w-full max-h-64 object-contain rounded-lg border"
              />
            )}

            {activePopup.content && (
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{activePopup.content}</div>
            )}

            {activePopup.link_url && (
              <a
                href={activePopup.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {activePopup.link_text || "Open link"}
              </a>
            )}

            <div className="mt-5 flex justify-end">
              <button onClick={dismissPopup} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-30">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden text-gray-600 hover:text-gray-900 p-2">
              {mobileMenu ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
            <Link to="/student" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">Education Hub</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {studentPhoto ? (
              <img src={studentPhoto} alt={user?.name} className="h-8 w-8 rounded-full object-cover border-2 border-blue-200" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-500" />
              </div>
            )}
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <button onClick={logout} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Desktop */}
        <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 fixed top-16 left-0 bottom-0 z-20 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-56"}`}>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-3 border-t border-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenu && (
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileMenu(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <aside className="absolute top-16 left-0 bottom-0 w-64 bg-white shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
              <nav className="py-4 px-3 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content - Full Width */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-56"}`}>
          <div className="p-4 lg:p-6 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
