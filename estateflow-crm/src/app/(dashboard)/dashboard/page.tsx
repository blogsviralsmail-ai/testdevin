import { Header } from '@/components/layout/header';
import { getDashboardStats, getRecentActivities, getLeadsBySource, getLeadsByStatus } from '@/actions/dashboard';
import { DashboardCards } from '@/components/dashboard/dashboard-cards';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';

export default async function DashboardPage() {
  const [stats, activities, leadsBySource, leadsByStatus] = await Promise.all([
    getDashboardStats(),
    getRecentActivities(10),
    getLeadsBySource(),
    getLeadsByStatus(),
  ]);

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-4 md:p-6 space-y-6">
        <DashboardCards stats={stats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCharts leadsBySource={leadsBySource} leadsByStatus={leadsByStatus} />
          <RecentActivityFeed activities={activities} />
        </div>
      </div>
    </>
  );
}
