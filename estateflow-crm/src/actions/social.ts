'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

export async function getSocialPosts(filters?: {
  status?: string;
  postType?: string;
  assignedTo?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('social_posts')
    .select('*, assignee:profiles!social_posts_assigned_to_fkey(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.postType) query = query.eq('post_type', filters.postType);
  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createSocialPost(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const post = {
    organization_id: user.organization_id,
    post_type: formData.get('postType') as string,
    caption: (formData.get('caption') as string) || null,
    status: (formData.get('status') as string) || 'idea',
    scheduled_at: (formData.get('scheduledAt') as string) || null,
    assigned_to: (formData.get('assignedTo') as string) || user.id,
    notes: (formData.get('notes') as string) || null,
    media_urls: [],
  };

  const { error } = await supabase.from('social_posts').insert(post);
  if (error) return { error: error.message };

  revalidatePath('/social');
  return { success: true };
}

export async function updateSocialPost(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('social_posts')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/social');
  return { success: true };
}

export async function deleteSocialPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/social');
  return { success: true };
}
