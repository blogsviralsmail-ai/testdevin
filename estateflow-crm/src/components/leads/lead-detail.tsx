'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLabel, LEAD_SOURCES, LEAD_STATUSES, LEAD_TEMPERATURES, PROPERTY_TYPES, formatCurrency } from '@/lib/constants';
import type { LeadSource, LeadStatus, LeadTemperature, PropertyType } from '@/types';
import { format } from 'date-fns';
import { Phone, Mail, MapPin, Calendar, User } from 'lucide-react';

interface LeadDetailProps {
  lead: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    source: string;
    property_type: string | null;
    budget_min: number | null;
    budget_max: number | null;
    preferred_location: string | null;
    status: string;
    temperature: string;
    notes: string | null;
    next_follow_up: string | null;
    last_contacted_at: string | null;
    created_at: string;
    assigned_agent: { id: string; full_name: string; phone: string | null; email: string | null } | null;
  };
}

export function LeadDetail({ lead }: LeadDetailProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{lead.full_name}</CardTitle>
          <div className="flex gap-1.5">
            <Badge>{getLabel(LEAD_STATUSES, lead.status as LeadStatus)}</Badge>
            <Badge variant={lead.temperature === 'hot' ? 'destructive' : 'secondary'}>
              {getLabel(LEAD_TEMPERATURES, lead.temperature as LeadTemperature)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
            </div>
          )}
          {lead.preferred_location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {lead.preferred_location}
            </div>
          )}
          {lead.assigned_agent && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              {lead.assigned_agent.full_name}
            </div>
          )}
          {lead.next_follow_up && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Follow-up: {format(new Date(lead.next_follow_up), 'MMM d, yyyy h:mm a')}
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Source</span>
              <span className="font-medium">{getLabel(LEAD_SOURCES, lead.source as LeadSource)}</span>
            </div>
            {lead.property_type && (
              <div>
                <span className="text-muted-foreground block text-xs">Property Type</span>
                <span className="font-medium">{getLabel(PROPERTY_TYPES, lead.property_type as PropertyType)}</span>
              </div>
            )}
            {(lead.budget_min || lead.budget_max) && (
              <div>
                <span className="text-muted-foreground block text-xs">Budget</span>
                <span className="font-medium">
                  {lead.budget_min ? formatCurrency(lead.budget_min) : '—'} – {lead.budget_max ? formatCurrency(lead.budget_max) : '—'}
                </span>
              </div>
            )}
            {lead.last_contacted_at && (
              <div>
                <span className="text-muted-foreground block text-xs">Last Contacted</span>
                <span className="font-medium">{format(new Date(lead.last_contacted_at), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {lead.notes && (
          <div className="pt-2 border-t">
            <span className="text-xs text-muted-foreground">Notes</span>
            <p className="text-sm mt-1">{lead.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
