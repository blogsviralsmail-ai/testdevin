'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getTeamMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTeamMember(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/team');
  return { success: true };
}

export async function deactivateTeamMember(id: string) {
  return updateTeamMember(id, { is_active: false });
}

export async function activateTeamMember(id: string) {
  return updateTeamMember(id, { is_active: true });
}
