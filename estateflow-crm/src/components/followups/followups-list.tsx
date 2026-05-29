'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, MessageSquare, Mail, Clock, Check, AlarmClock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { completeFollowUp, snoozeFollowUp } from '@/actions/followups';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const typeIcons: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  sms: MessageSquare,
  email: Mail,
  call: Phone,
};

interface FollowUpsListProps {
  followups: {
    id: string;
    type: string;
    status: string;
    message: string | null;
    scheduled_at: string;
    lead?: { id: string; full_name: string; phone: string; status: string; temperature: string } | null;
    agent?: { id: string; full_name: string } | null;
  }[];
}

export function FollowUpsList({ followups }: FollowUpsListProps) {
  const router = useRouter();
  const pending = followups.filter(f => f.status === 'pending');
  const overdue = pending.filter(f => isPast(new Date(f.scheduled_at)));
  const upcoming = pending.filter(f => !isPast(new Date(f.scheduled_at)));
  const completed = followups.filter(f => f.status === 'completed');

  async function handleComplete(id: string) {
    const result = await completeFollowUp(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Follow-up completed');
      router.refresh();
    }
  }

  async function handleSnooze(id: string) {
    const newDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = await snoozeFollowUp(id, newDate);
    if (result.error) toast.error(result.error);
    else {
      toast.success('Snoozed for 24 hours');
      router.refresh();
    }
  }

  function renderFollowUp(fu: typeof followups[0]) {
    const Icon = typeIcons[fu.type] || Clock;
    const isOverdue = fu.status === 'pending' && isPast(new Date(fu.scheduled_at));

    return (
      <Card key={fu.id} className={isOverdue ? 'border-red-200 bg-red-50/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              {fu.lead && (
                <Link href={`/leads/${fu.lead.id}`} className="font-medium text-sm hover:underline">
                  {fu.lead.full_name}
                </Link>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {fu.type.toUpperCase()} · {format(new Date(fu.scheduled_at), 'MMM d, h:mm a')}
              </p>
              {fu.message && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{fu.message}</p>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-[10px] mt-1">Overdue</Badge>
              )}
            </div>
            {fu.status === 'pending' && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleComplete(fu.id)}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleSnooze(fu.id)}>
                  <AlarmClock className="h-4 w-4 text-amber-600" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="pending">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="pending">
          Pending ({pending.length})
        </TabsTrigger>
        <TabsTrigger value="overdue">
          Overdue ({overdue.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completed.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-2 mt-4">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No pending follow-ups</p>
        ) : (
          <>
            {overdue.map(renderFollowUp)}
            {upcoming.map(renderFollowUp)}
          </>
        )}
      </TabsContent>

      <TabsContent value="overdue" className="space-y-2 mt-4">
        {overdue.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No overdue follow-ups</p>
        ) : (
          overdue.map(renderFollowUp)
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-2 mt-4">
        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No completed follow-ups</p>
        ) : (
          completed.map(renderFollowUp)
        )}
      </TabsContent>
    </Tabs>
  );
}
