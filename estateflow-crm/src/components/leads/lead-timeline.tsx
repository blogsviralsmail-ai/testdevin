'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Phone, MessageSquare, FileText, Clock, Share2, ArrowLeftRight, UserPlus, MapPin, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { addLeadNote } from '@/actions/leads';
import { toast } from 'sonner';
import type { ActivityType } from '@/types';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  message: MessageSquare,
  note: FileText,
  follow_up: Clock,
  property_share: Share2,
  status_change: ArrowLeftRight,
  assignment: UserPlus,
  site_visit: MapPin,
};

interface TimelineProps {
  activities: {
    id: string;
    type: ActivityType;
    title: string;
    description: string | null;
    created_at: string;
    user?: { id: string; full_name: string } | null;
  }[];
  leadId: string;
}

export function LeadTimeline({ activities, leadId }: TimelineProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddNote() {
    if (!note.trim()) return;
    setSaving(true);
    const result = await addLeadNote(leadId, note.trim());
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Note added');
      setNote('');
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button size="icon" onClick={handleAddNote} disabled={saving || !note.trim()} className="h-auto">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || FileText;
              return (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {activity.user?.full_name && `${activity.user.full_name} · `}
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
