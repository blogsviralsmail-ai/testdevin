'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Phone, Clock, Flame, MapPin, Building2, UserCheck, UsersRound } from 'lucide-react';
import type { DashboardStats } from '@/types';
import Link from 'next/link';

const statCards = [
  { key: 'newLeadsToday' as const, label: 'New Leads', icon: Users, color: 'text-blue-600 bg-blue-100', href: '/leads' },
  { key: 'callsMadeToday' as const, label: 'Calls Today', icon: Phone, color: 'text-green-600 bg-green-100', href: '/leads' },
  { key: 'followUpsDueToday' as const, label: 'Follow-ups Due', icon: Clock, color: 'text-orange-600 bg-orange-100', href: '/followups' },
  { key: 'hotLeads' as const, label: 'Hot Leads', icon: Flame, color: 'text-red-600 bg-red-100', href: '/leads' },
  { key: 'siteVisitsScheduled' as const, label: 'Site Visits', icon: MapPin, color: 'text-purple-600 bg-purple-100', href: '/leads' },
  { key: 'availableInventory' as const, label: 'Available', icon: Building2, color: 'text-teal-600 bg-teal-100', href: '/properties' },
  { key: 'teamCheckedIn' as const, label: 'Checked In', icon: UserCheck, color: 'text-emerald-600 bg-emerald-100', href: '/attendance' },
  { key: 'totalTeamMembers' as const, label: 'Team Size', icon: UsersRound, color: 'text-indigo-600 bg-indigo-100', href: '/team' },
];

export function DashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((card) => (
        <Link key={card.key} href={card.href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[card.key]}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
