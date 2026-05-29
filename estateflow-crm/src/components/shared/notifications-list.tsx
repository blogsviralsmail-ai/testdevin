'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Phone, Clock, MapPin, Share2, CalendarCheck, Megaphone, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { markAsRead, markAllAsRead } from '@/actions/notifications';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { NotificationType } from '@/types';

const notifIcons: Record<NotificationType, React.ElementType> = {
  new_lead: Bell,
  missed_call: Phone,
  follow_up_due: Clock,
  site_visit: MapPin,
  property_shared: Share2,
  attendance_issue: CalendarCheck,
  social_post_due: Megaphone,
};

interface NotificationsListProps {
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  async function handleMarkRead(id: string) {
    await markAsRead(id);
    router.refresh();
  }

  async function handleMarkAllRead() {
    const result = await markAllAsRead();
    if (result.error) toast.error(result.error);
    else {
      toast.success('All marked as read');
      router.refresh();
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => {
          const Icon = notifIcons[notif.type as NotificationType] || Bell;
          return (
            <Card
              key={notif.id}
              className={`cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
