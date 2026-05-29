import { Sidebar } from '@/components/layout/sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 md:ml-64">
        <main className="pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
