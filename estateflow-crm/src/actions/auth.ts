'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const orgName = formData.get('orgName') as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'admin' },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError) {
      return { error: orgError.message };
    }

    await supabase
      .from('profiles')
      .update({ organization_id: org.id, role: 'admin' })
      .eq('id', authData.user.id);

    await supabase
      .from('integration_settings')
      .insert({ organization_id: org.id });
  }

  redirect('/dashboard');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const email = formData.get('email') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;
  const phone = formData.get('phone') as string;

  const adminClient = getSupabaseAdmin();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (authError) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      await supabase
        .from('profiles')
        .update({
          organization_id: user.organization_id,
          role,
          full_name: fullName,
          phone,
          is_active: true,
        })
        .eq('id', existingProfile.id);

      revalidatePath('/team');
      return { success: true };
    }
    return { error: authError.message };
  }

  if (authData.user) {
    await supabase
      .from('profiles')
      .update({
        organization_id: user.organization_id,
        role,
        full_name: fullName,
        phone,
      })
      .eq('id', authData.user.id);
  }

  revalidatePath('/team');
  return { success: true };
}
