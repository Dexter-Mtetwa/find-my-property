export type PropertyStatus = 'available' | 'requested' | 'rented' | 'removed';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type PropertyType = 'apartment' | 'house' | 'studio' | 'room';
export type ListingType = 'rent' | 'buy';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: Gender;
  location?: string;
  avatar_url?: string;
  is_seller: boolean;
  seller_verified: boolean;
  expo_push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  listing_type: ListingType;
  location: string;
  latitude?: number;
  longitude?: number;
  rooms: number;
  bathrooms: number;
  square_meters?: number;
  floor?: number;
  total_floors?: number;
  amenities: string[];
  property_type: PropertyType;
  available_from?: string;
  minimum_stay_months: number;
  status: PropertyStatus;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
  seller?: Profile;
  is_liked?: boolean;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export interface PropertyRequest {
  id: string;
  buyer_id: string;
  property_id: string;
  seller_id: string;
  status: RequestStatus;
  message?: string;
  buyer_phone?: string;
  buyer_email?: string;
  preferred_move_date?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  property?: Property;
  buyer?: Profile;
  seller?: Profile;
}

export interface Like {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}
