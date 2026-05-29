'use server';

import { createClient } from '@/lib/supabase/server';
import type { DashboardStats } from '@/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    newLeads,
    callsToday,
    followUpsDue,
    hotLeads,
    siteVisits,
    inventory,
    attendance,
    totalTeam,
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('calls').select('id', { count: 'exact', head: true }).gte('started_at', todayISO),
    supabase.from('followups').select('id', { count: 'exact', head: true }).eq('status', 'pending').lte('scheduled_at', new Date().toISOString()),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('temperature', 'hot').not('status', 'in', '("won","lost")'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'site_visit_scheduled'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('availability', 'available'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).gte('check_in_time', todayISO),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    newLeadsToday: newLeads.count ?? 0,
    callsMadeToday: callsToday.count ?? 0,
    followUpsDueToday: followUpsDue.count ?? 0,
    hotLeads: hotLeads.count ?? 0,
    siteVisitsScheduled: siteVisits.count ?? 0,
    availableInventory: inventory.count ?? 0,
    teamCheckedIn: attendance.count ?? 0,
    totalTeamMembers: totalTeam.count ?? 0,
  };
}

export async function getRecentActivities(limit: number = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*, user:profiles!activities_user_id_fkey(id, full_name, avatar_url), lead:leads!activities_lead_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getLeadsBySource() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('source');

  if (error) return [];

  const counts: Record<string, number> = {};
  for (const lead of data) {
    counts[lead.source] = (counts[lead.source] || 0) + 1;
  }

  return Object.entries(counts).map(([source, count]) => ({ source, count }));
}

export async function getLeadsByStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('status');

  if (error) return [];

  const counts: Record<string, number> = {};
  for (const lead of data) {
    counts[lead.status] = (counts[lead.status] || 0) + 1;
  }

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}
