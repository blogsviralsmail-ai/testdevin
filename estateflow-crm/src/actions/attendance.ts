'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { determineAttendanceStatus } from '@/services/attendance-service';

export async function checkIn(latitude: number | null, longitude: number | null) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .gte('check_in_time', today.toISOString())
    .is('check_out_time', null)
    .single();

  if (existing) return { error: 'Already checked in' };

  const status = determineAttendanceStatus(new Date());

  const { error } = await supabase.from('attendance').insert({
    organization_id: user.organization_id,
    user_id: user.id,
    check_in_time: new Date().toISOString(),
    check_in_latitude: latitude,
    check_in_longitude: longitude,
    status,
  });

  if (error) return { error: error.message };
  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  return { success: true, status };
}

export async function checkOut(latitude: number | null, longitude: number | null) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: record } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', user.id)
    .gte('check_in_time', today.toISOString())
    .is('check_out_time', null)
    .single();

  if (!record) return { error: 'No active check-in found' };

  const { error } = await supabase
    .from('attendance')
    .update({
      check_out_time: new Date().toISOString(),
      check_out_latitude: latitude,
      check_out_longitude: longitude,
    })
    .eq('id', record.id);

  if (error) return { error: error.message };
  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getAttendanceRecords(filters?: {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('attendance')
    .select('*, user:profiles!attendance_user_id_fkey(id, full_name, avatar_url, role)')
    .order('check_in_time', { ascending: false });

  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.dateFrom) query = query.gte('check_in_time', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('check_in_time', filters.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getTodayAttendance() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('attendance')
    .select('*, user:profiles!attendance_user_id_fkey(id, full_name, avatar_url, role)')
    .gte('check_in_time', today.toISOString())
    .order('check_in_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCurrentCheckIn() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .gte('check_in_time', today.toISOString())
    .is('check_out_time', null)
    .single();

  return data;
}
