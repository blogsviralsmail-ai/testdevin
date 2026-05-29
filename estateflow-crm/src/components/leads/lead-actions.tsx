'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MessageSquare, Share2, Flame, Calendar } from 'lucide-react';
import { LEAD_STATUSES, LEAD_TEMPERATURES } from '@/lib/constants';
import { updateLead } from '@/actions/leads';
import type { LeadStatus, LeadTemperature } from '@/types';
import { toast } from 'sonner';

interface LeadActionsProps {
  lead: {
    id: string;
    phone: string;
    full_name: string;
    status: string;
    temperature: string;
  };
}

export function LeadActions({ lead }: LeadActionsProps) {
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(status: string | null) {
    if (!status) return;
    setUpdating(true);
    await updateLead(lead.id, { status: status as LeadStatus });
    toast.success(`Status updated to ${status}`);
    setUpdating(false);
  }

  async function handleTempChange(temp: string | null) {
    if (!temp) return;
    setUpdating(true);
    await updateLead(lead.id, { temperature: temp as LeadTemperature });
    toast.success(`Temperature updated to ${temp}`);
    setUpdating(false);
  }

  async function handleMarkHot() {
    setUpdating(true);
    await updateLead(lead.id, { temperature: 'hot' as LeadTemperature });
    toast.success('Marked as Hot Lead');
    setUpdating(false);
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            className="h-9 bg-green-600 hover:bg-green-700"
            onClick={() => window.open(`tel:${lead.phone}`)}
          >
            <Phone className="h-4 w-4 mr-1" />
            Call
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-9 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi ${encodeURIComponent(lead.full_name)}`)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            WhatsApp
          </Button>
          <Button size="sm" variant="outline" className="h-9" onClick={handleMarkHot} disabled={updating}>
            <Flame className="h-4 w-4 mr-1 text-red-500" />
            Hot
          </Button>
          <Button size="sm" variant="outline" className="h-9">
            <Share2 className="h-4 w-4 mr-1" />
            Share Property
          </Button>
          <Button size="sm" variant="outline" className="h-9">
            <Calendar className="h-4 w-4 mr-1" />
            Follow-up
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Select defaultValue={lead.status} onValueChange={handleStatusChange} disabled={updating}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue={lead.temperature} onValueChange={handleTempChange} disabled={updating}>
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_TEMPERATURES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
