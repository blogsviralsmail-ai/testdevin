'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getLabel, LEAD_SOURCES, LEAD_STATUSES } from '@/lib/constants';
import type { LeadSource, LeadStatus } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

interface ChartProps {
  leadsBySource: { source: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
}

export function DashboardCharts({ leadsBySource, leadsByStatus }: ChartProps) {
  const sourceData = leadsBySource.map(item => ({
    name: getLabel(LEAD_SOURCES, item.source as LeadSource),
    value: item.count,
  }));

  const statusData = leadsByStatus.map(item => ({
    name: getLabel(LEAD_STATUSES, item.status as LeadStatus),
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          {sourceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No lead data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourceData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No lead data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
