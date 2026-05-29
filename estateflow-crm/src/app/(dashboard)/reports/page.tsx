import { Header } from '@/components/layout/header';
import { getDashboardStats, getLeadsBySource, getLeadsByStatus } from '@/actions/dashboard';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ReportsPage() {
  const [stats, leadsBySource, leadsByStatus] = await Promise.all([
    getDashboardStats(),
    getLeadsBySource(),
    getLeadsByStatus(),
  ]);

  return (
    <>
      <Header title="Reports" />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.newLeadsToday}</p>
              <p className="text-xs text-muted-foreground">New Leads Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.callsMadeToday}</p>
              <p className="text-xs text-muted-foreground">Calls Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.followUpsDueToday}</p>
              <p className="text-xs text-muted-foreground">Follow-ups Due</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.hotLeads}</p>
              <p className="text-xs text-muted-foreground">Hot Leads</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCharts leadsBySource={leadsBySource} leadsByStatus={leadsByStatus} />
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">Available Inventory</span>
                  <span className="font-semibold">{stats.availableInventory}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">Site Visits Scheduled</span>
                  <span className="font-semibold">{stats.siteVisitsScheduled}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">Team Checked In</span>
                  <span className="font-semibold">{stats.teamCheckedIn} / {stats.totalTeamMembers}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
