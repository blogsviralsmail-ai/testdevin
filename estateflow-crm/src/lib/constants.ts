import type { LeadSource, LeadStatus, LeadTemperature, PropertyType, PropertyAvailability, FurnishingStatus, SocialPostType, SocialPostStatus, FollowUpType, UserRole, CallOutcome, AttendanceStatus } from '@/types';

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: '36_acre', label: '36 Acre' },
  { value: 'magicbricks', label: 'MagicBricks' },
  { value: 'housing', label: 'Housing.com' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
];

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-indigo-500' },
  { value: 'interested', label: 'Interested', color: 'bg-purple-500' },
  { value: 'site_visit_scheduled', label: 'Site Visit', color: 'bg-amber-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { value: 'won', label: 'Won', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
  { value: 'not_responding', label: 'Not Responding', color: 'bg-gray-500' },
];

export const LEAD_TEMPERATURES: { value: LeadTemperature; label: string; color: string }[] = [
  { value: 'cold', label: 'Cold', color: 'bg-blue-400' },
  { value: 'warm', label: 'Warm', color: 'bg-yellow-500' },
  { value: 'hot', label: 'Hot', color: 'bg-red-500' },
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'rental', label: 'Rental' },
];

export const PROPERTY_AVAILABILITY: { value: PropertyAvailability; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'hold', label: 'Hold', color: 'bg-yellow-500' },
  { value: 'sold', label: 'Sold', color: 'bg-red-500' },
  { value: 'rented', label: 'Rented', color: 'bg-blue-500' },
];

export const FURNISHING_STATUSES: { value: FurnishingStatus; label: string }[] = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'fully_furnished', label: 'Fully Furnished' },
];

export const SOCIAL_POST_TYPES: { value: SocialPostType; label: string }[] = [
  { value: 'instagram_reel', label: 'Instagram Reel' },
  { value: 'instagram_post', label: 'Instagram Post' },
  { value: 'facebook_post', label: 'Facebook Post' },
  { value: 'linkedin_post', label: 'LinkedIn Post' },
  { value: 'story', label: 'Story' },
];

export const SOCIAL_POST_STATUSES: { value: SocialPostStatus; label: string; color: string }[] = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-500' },
  { value: 'draft', label: 'Draft', color: 'bg-yellow-500' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'published', label: 'Published', color: 'bg-green-500' },
];

export const FOLLOW_UP_TYPES: { value: FollowUpType; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
];

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin / Business Owner' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'sales_agent', label: 'Sales Agent' },
  { value: 'field_executive', label: 'Field Executive' },
  { value: 'social_media_manager', label: 'Social Media Manager' },
];

export const CALL_OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: 'connected', label: 'Connected' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'bg-green-500' },
  { value: 'late', label: 'Late', color: 'bg-yellow-500' },
  { value: 'absent', label: 'Absent', color: 'bg-red-500' },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-500' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-blue-500' },
];

export const DEFAULT_FOLLOW_UP_TEMPLATES = [
  {
    name: 'Check Property Details',
    message: 'Hi {{leadName}}, just checking if you had a chance to review the property details I shared.',
    type: 'whatsapp' as FollowUpType,
  },
  {
    name: 'Quick Call',
    message: 'Hi {{leadName}}, are you available for a quick call today to discuss properties in {{preferredLocation}}?',
    type: 'whatsapp' as FollowUpType,
  },
  {
    name: 'New Options',
    message: 'Hi {{leadName}}, we have a few new options matching your budget. Should I share them?',
    type: 'whatsapp' as FollowUpType,
  },
];

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getStatusColor(status: LeadStatus): string {
  return LEAD_STATUSES.find(s => s.value === status)?.color ?? 'bg-gray-500';
}

export function getTempColor(temp: LeadTemperature): string {
  return LEAD_TEMPERATURES.find(t => t.value === temp)?.color ?? 'bg-gray-500';
}

export function getLabel<T extends string>(items: { value: T; label: string }[], value: T): string {
  return items.find(i => i.value === value)?.label ?? value;
}
