'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getFollowUps(filters?: {
  status?: string;
  agentId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('followups')
    .select('*, lead:leads(id, full_name, phone, status, temperature), agent:profiles!followups_agent_id_fkey(id, full_name, avatar_url)')
    .order('scheduled_at', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.agentId) query = query.eq('agent_id', filters.agentId);
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.dateFrom) query = query.gte('scheduled_at', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('scheduled_at', filters.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createFollowUp(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const followup = {
    organization_id: user.organization_id,
    lead_id: formData.get('leadId') as string,
    agent_id: (formData.get('agentId') as string) || user.id,
    type: formData.get('type') as string,
    message: (formData.get('message') as string) || null,
    scheduled_at: formData.get('scheduledAt') as string,
    notes: (formData.get('notes') as string) || null,
    status: 'pending',
  };

  const { error } = await supabase.from('followups').insert(followup);
  if (error) return { error: error.message };

  await supabase.from('leads').update({
    next_follow_up: followup.scheduled_at,
  }).eq('id', followup.lead_id);

  await supabase.from('activities').insert({
    organization_id: user.organization_id,
    lead_id: followup.lead_id,
    user_id: user.id,
    type: 'follow_up',
    title: `Follow-up scheduled (${followup.type})`,
    description: followup.message || 'Follow-up scheduled',
  });

  revalidatePath('/followups');
  revalidatePath(`/leads/${followup.lead_id}`);
  return { success: true };
}

export async function completeFollowUp(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('followups')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/followups');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function snoozeFollowUp(id: string, newDate: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('followups')
    .update({ status: 'snoozed', scheduled_at: newDate })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/followups');
  return { success: true };
}

export async function cancelFollowUp(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('followups')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/followups');
  return { success: true };
}
