'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageSquare, FileText, Clock, Share2, ArrowLeftRight, UserPlus, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityType } from '@/types';

const activityIcons: Record<ActivityType, React.ElementType> = {
  call: Phone,
  message: MessageSquare,
  note: FileText,
  follow_up: Clock,
  property_share: Share2,
  status_change: ArrowLeftRight,
  assignment: UserPlus,
  site_visit: MapPin,
};

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  created_at: string;
  user?: { id: string; full_name: string; avatar_url: string | null } | null;
  lead?: { id: string; full_name: string } | null;
}

export function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type] || FileText;
          return (
            <div key={activity.id} className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {activity.user && (
                    <span className="text-xs text-muted-foreground">{activity.user.full_name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
