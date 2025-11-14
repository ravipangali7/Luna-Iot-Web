export interface VoiceModel {
  id: number;
  voice_display_name: string;
  voice_internal_name: string;
  is_premium: boolean;
}

export interface PhoneNumber {
  id: number;
  phone_number: string;
}

export interface Campaign {
  id: number;
  name: string;
  services: 'PHONE' | 'SMS' | 'SMS & PHONE';
  status: string;
  message: string;
  sms_message: string;
  description?: string;
  schedule: string;
  audio_file?: string | null;
  bulk_file?: string | null;
  category?: string;
  user_phone: number[];
  progress_percent: number;
  updated_at: string;
  credit_limit: number;
  voice: number | null;
  draft: boolean;
  failover_target: any[];
  length_factor: string;
  main_audit?: string;
  campaign_action_count?: number;
}

export interface CampaignFormData {
  name: string;
  services: 'PHONE' | 'SMS' | 'SMS & PHONE';
  user_phone: number[];
  message: string;
  sms_message: string;
  description?: string;
  schedule: string;
  voice: number | null;
}

export interface Contact {
  id: number;
  number: string;
  status: string;
  updated_at: string;
  call_duration: string;
  playback: string;
  credit_consumed: number;
  credit_consumed_SMS: number;
  carrier?: string;
  other_variables?: Record<string, any>;
}

export interface ContactFormData {
  number: string;
  other_variables?: Record<string, any>;
}

export interface CampaignFilters {
  status?: string;
  serviceType?: string;
}

export interface CampaignListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Campaign[];
}

export interface ContactListResponse {
  count: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: Contact[];
  total_credits_consumed: number;
  carrier_summary: Record<string, number>;
}

