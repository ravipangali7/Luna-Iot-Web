export interface PhoneBook {
  id: number;
  user?: number | null;
  user_name?: string | null;
  user_phone?: string | null;
  institute?: number | null;
  institute_name?: string | null;
  name: string;
  numbers?: PhoneBookNumber[];
  numbers_count?: number;
  owner_type: 'user' | 'institute';
  owner_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhoneBookNumber {
  id: number;
  phonebook: number;
  phonebook_name?: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface PhoneBookCreate {
  name: string;
  user?: number | null;
  institute?: number | null;
}

export interface PhoneBookUpdate {
  name: string;
}

export interface PhoneBookNumberCreate {
  phonebook: number;
  name: string;
  phone: string;
}

export interface PhoneBookNumberUpdate {
  name?: string;
  phone?: string;
}

export interface BulkCreateNumbersRequest {
  numbers: Array<{
    name: string;
    phone: string;
  }>;
}

export interface BulkCreateNumbersResponse {
  created: PhoneBookNumber[];
  errors: Array<{
    index: number;
    data: any;
    errors: any;
  }>;
  created_count: number;
  error_count: number;
}
