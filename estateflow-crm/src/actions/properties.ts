'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import type { Property } from '@/types';

export async function getProperties(filters?: {
  type?: string;
  availability?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('properties')
    .select('*, images:property_images(id, url, caption, is_primary)')
    .order('created_at', { ascending: false });

  if (filters?.type) query = query.eq('property_type', filters.type);
  if (filters?.availability) query = query.eq('availability', filters.availability);
  if (filters?.location) query = query.ilike('location', `%${filters.location}%`);
  if (filters?.minPrice) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters?.search) {
    const sanitized = filters.search.replace(/[,().]/g, '');
    query = query.or(`title.ilike.%${sanitized}%,location.ilike.%${sanitized}%,address.ilike.%${sanitized}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getProperty(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*, images:property_images(*), documents:property_documents(*)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const amenitiesStr = formData.get('amenities') as string;
  const tagsStr = formData.get('tags') as string;

  const property = {
    organization_id: user.organization_id,
    title: formData.get('title') as string,
    location: formData.get('location') as string,
    address: (formData.get('address') as string) || null,
    property_type: formData.get('propertyType') as string,
    price: Number(formData.get('price')),
    size: (formData.get('size') as string) || null,
    bedrooms: formData.get('bedrooms') ? Number(formData.get('bedrooms')) : null,
    bathrooms: formData.get('bathrooms') ? Number(formData.get('bathrooms')) : null,
    floor: (formData.get('floor') as string) || null,
    furnishing: (formData.get('furnishing') as string) || null,
    availability: 'available',
    description: (formData.get('description') as string) || null,
    amenities: amenitiesStr ? amenitiesStr.split(',').map(s => s.trim()).filter(Boolean) : [],
    owner_name: (formData.get('ownerName') as string) || null,
    owner_contact: (formData.get('ownerContact') as string) || null,
    tags: tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : [],
    units_available: formData.get('unitsAvailable') ? Number(formData.get('unitsAvailable')) : 1,
  };

  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/properties');
  revalidatePath('/dashboard');
  return { success: true, propertyId: data.id };
}

export async function updateProperty(id: string, updates: Partial<Property>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath(`/properties/${id}`);
  revalidatePath('/properties');
  return { success: true };
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/properties');
  return { success: true };
}

export async function getRecommendedProperties(lead: {
  property_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_location?: string | null;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('properties')
    .select('*, images:property_images(id, url, is_primary)')
    .eq('availability', 'available')
    .order('created_at', { ascending: false })
    .limit(5);

  if (lead.property_type) query = query.eq('property_type', lead.property_type);
  if (lead.budget_min) query = query.gte('price', lead.budget_min);
  if (lead.budget_max) query = query.lte('price', lead.budget_max);
  if (lead.preferred_location) query = query.ilike('location', `%${lead.preferred_location}%`);

  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function addPropertyImage(propertyId: string, url: string, caption?: string, isPrimary?: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('property_images')
    .insert({ property_id: propertyId, url, caption: caption || null, is_primary: isPrimary || false });

  if (error) return { error: error.message };
  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}
