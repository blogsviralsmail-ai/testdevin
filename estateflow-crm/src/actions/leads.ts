'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import type { Lead, LeadStatus, LeadTemperature } from '@/types';

export async function getLeads(filters?: {
  status?: string;
  source?: string;
  temperature?: string;
  agentId?: string;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('leads')
    .select('*, assigned_agent:profiles!leads_assigned_agent_id_fkey(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.temperature) query = query.eq('temperature', filters.temperature);
  if (filters?.agentId) query = query.eq('assigned_agent_id', filters.agentId);
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as (Lead & { assigned_agent: { id: string; full_name: string; avatar_url: string | null } | null })[];
}

export async function getLead(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, assigned_agent:profiles!leads_assigned_agent_id_fkey(id, full_name, avatar_url, phone, email)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const lead = {
    organization_id: user.organization_id,
    full_name: formData.get('fullName') as string,
    phone: formData.get('phone') as string,
    email: (formData.get('email') as string) || null,
    source: formData.get('source') as string,
    property_type: (formData.get('propertyType') as string) || null,
    budget_min: formData.get('budgetMin') ? Number(formData.get('budgetMin')) : null,
    budget_max: formData.get('budgetMax') ? Number(formData.get('budgetMax')) : null,
    preferred_location: (formData.get('preferredLocation') as string) || null,
    notes: (formData.get('notes') as string) || null,
    assigned_agent_id: (formData.get('assignedAgentId') as string) || user.id,
    status: 'new' as LeadStatus,
    temperature: (formData.get('temperature') as LeadTemperature) || 'warm',
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('activities').insert({
    organization_id: user.organization_id,
    lead_id: data.id,
    user_id: user.id,
    type: 'note',
    title: 'Lead created',
    description: `Lead ${lead.full_name} created from ${lead.source}`,
  });

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true, leadId: data.id };
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };

  if (updates.status) {
    await supabase.from('activities').insert({
      organization_id: user.organization_id,
      lead_id: id,
      user_id: user.id,
      type: 'status_change',
      title: `Status changed to ${updates.status}`,
      description: `Lead status updated to ${updates.status}`,
    });
  }

  if (updates.assigned_agent_id) {
    await supabase.from('activities').insert({
      organization_id: user.organization_id,
      lead_id: id,
      user_id: user.id,
      type: 'assignment',
      title: 'Agent reassigned',
      description: `Lead assigned to a new agent`,
    });
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function addLeadNote(leadId: string, note: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('activities').insert({
    organization_id: user.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'note',
    title: 'Note added',
    description: note,
  });

  if (error) return { error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function getLeadActivities(leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*, user:profiles!activities_user_id_fkey(id, full_name, avatar_url)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAgents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, phone, email, is_active')
    .in('role', ['sales_agent', 'sales_manager', 'admin'])
    .eq('is_active', true)
    .order('full_name');

  if (error) throw new Error(error.message);
  return data;
}
