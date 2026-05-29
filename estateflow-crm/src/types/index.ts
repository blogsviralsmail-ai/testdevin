export type UserRole = 'admin' | 'sales_manager' | 'sales_agent' | 'field_executive' | 'social_media_manager';

export type LeadSource = '36_acre' | 'magicbricks' | 'housing' | 'facebook' | 'instagram' | 'website' | 'referral' | 'manual' | 'other';

export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'rental';

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'site_visit_scheduled' | 'negotiation' | 'won' | 'lost' | 'not_responding';

export type LeadTemperature = 'cold' | 'warm' | 'hot';

export type PropertyAvailability = 'available' | 'hold' | 'sold' | 'rented';

export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'fully_furnished';

export type FollowUpType = 'whatsapp' | 'sms' | 'email' | 'call';

export type FollowUpStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';

export type SocialPostType = 'instagram_reel' | 'instagram_post' | 'facebook_post' | 'linkedin_post' | 'story';

export type SocialPostStatus = 'idea' | 'draft' | 'scheduled' | 'published';

export type CallOutcome = 'connected' | 'no_answer' | 'busy' | 'voicemail' | 'failed' | 'pending';

export type ActivityType = 'call' | 'message' | 'note' | 'follow_up' | 'property_share' | 'status_change' | 'assignment' | 'site_visit';

export type NotificationType = 'new_lead' | 'missed_call' | 'follow_up_due' | 'site_visit' | 'property_shared' | 'attendance_issue' | 'social_post_due';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  property_type: PropertyType | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  assigned_agent_id: string | null;
  notes: string | null;
  next_follow_up: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent?: Profile;
}

export interface Property {
  id: string;
  organization_id: string;
  title: string;
  location: string;
  address: string | null;
  property_type: PropertyType;
  price: number;
  size: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  furnishing: FurnishingStatus | null;
  availability: PropertyAvailability;
  description: string | null;
  amenities: string[];
  owner_name: string | null;
  owner_contact: string | null;
  tags: string[];
  units_available: number | null;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  name: string;
  url: string;
  file_type: string | null;
  created_at: string;
}

export interface CallLog {
  id: string;
  organization_id: string;
  lead_id: string;
  agent_id: string;
  call_sid: string | null;
  conference_sid: string | null;
  status: string;
  duration: number | null;
  recording_url: string | null;
  outcome: CallOutcome;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  lead?: Lead;
  agent?: Profile;
}

export interface Activity {
  id: string;
  organization_id: string;
  lead_id: string | null;
  user_id: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}

export interface FollowUp {
  id: string;
  organization_id: string;
  lead_id: string;
  agent_id: string;
  type: FollowUpType;
  status: FollowUpStatus;
  message: string | null;
  template_id: string | null;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  agent?: Profile;
}

export interface Attendance {
  id: string;
  organization_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  status: AttendanceStatus;
  selfie_url: string | null;
  notes: string | null;
  created_at: string;
  user?: Profile;
}

export interface SocialPost {
  id: string;
  organization_id: string;
  post_type: SocialPostType;
  caption: string | null;
  media_urls: string[];
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LeadPropertyShare {
  id: string;
  organization_id: string;
  lead_id: string;
  property_id: string;
  shared_by: string;
  share_link: string | null;
  channel: 'whatsapp' | 'sms' | 'email' | 'link';
  created_at: string;
  property?: Property;
}

export interface IntegrationSettings {
  id: string;
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  whatsapp_sender_number: string | null;
  resend_api_key: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  webhook_secret: string | null;
  openai_api_key: string | null;
  lead_assignment_mode: 'round_robin' | 'manual' | 'least_busy';
  created_at: string;
  updated_at: string;
}

export interface FollowUpTemplate {
  id: string;
  organization_id: string;
  name: string;
  message: string;
  type: FollowUpType;
  is_default: boolean;
  created_at: string;
}

export interface DashboardStats {
  newLeadsToday: number;
  callsMadeToday: number;
  followUpsDueToday: number;
  hotLeads: number;
  siteVisitsScheduled: number;
  availableInventory: number;
  teamCheckedIn: number;
  totalTeamMembers: number;
}
