'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getNotifications(unreadOnly: boolean = false) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return count ?? 0;
}

export async function markAsRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/notifications');
  return { success: true };
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { error: error.message };
  revalidatePath('/notifications');
  return { success: true };
}

export async function createNotification(
  userId: string,
  organizationId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from('notifications').insert({
    user_id: userId,
    organization_id: organizationId,
    type,
    title,
    message,
    metadata,
  });
}
