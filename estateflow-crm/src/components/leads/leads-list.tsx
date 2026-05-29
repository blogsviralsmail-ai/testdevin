'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getLabel, LEAD_SOURCES, LEAD_STATUSES, LEAD_TEMPERATURES, formatCurrency } from '@/lib/constants';
import type { Lead, LeadSource, LeadStatus, LeadTemperature } from '@/types';

interface LeadsListProps {
  leads: (Lead & { assigned_agent: { id: string; full_name: string; avatar_url: string | null } | null })[];
}

function getStatusVariant(status: LeadStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'new': return 'default';
    case 'won': return 'default';
    case 'lost': return 'destructive';
    default: return 'secondary';
  }
}

function getTempVariant(temp: LeadTemperature): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (temp) {
    case 'hot': return 'destructive';
    case 'warm': return 'default';
    case 'cold': return 'secondary';
    default: return 'outline';
  }
}

export function LeadsList({ leads }: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No leads found</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first lead or adjust filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <Link key={lead.id} href={`/leads/${lead.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{lead.full_name}</h3>
                    <Badge variant={getTempVariant(lead.temperature)} className="text-[10px] px-1.5 py-0">
                      {getLabel(LEAD_TEMPERATURES, lead.temperature)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant={getStatusVariant(lead.status)} className="text-[10px]">
                      {getLabel(LEAD_STATUSES, lead.status)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {getLabel(LEAD_SOURCES, lead.source as LeadSource)}
                    </Badge>
                    {lead.budget_max && (
                      <span className="text-[10px] text-muted-foreground">
                        Budget: {formatCurrency(lead.budget_max)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </span>
                  {lead.assigned_agent && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                      {lead.assigned_agent.full_name}
                    </span>
                  )}
                  <div className="flex gap-1 mt-1">
                    <button
                      className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`tel:${lead.phone}`);
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-green-700" />
                    </button>
                    <button
                      className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`);
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                    </button>
                    {lead.next_follow_up && (
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Calendar className="h-3.5 w-3.5 text-amber-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
