/*
  # RentHub - Rental Marketplace Database Schema

  ## Overview
  Complete database schema for a rental marketplace connecting tenants with property owners.
  Includes profiles, properties, requests, likes, and rental history with comprehensive RLS policies.

  ## New Tables
  
  1. `profiles` - Extended user profiles
     - `id` (uuid, references auth.users)
     - `full_name` (text, required)
     - `phone` (text)
     - `email` (text)
     - `age` (integer, min 18)
     - `gender` (text, enum)
     - `location` (text)
     - `avatar_url` (text)
     - `is_seller` (boolean, default false)
     - `seller_verified` (boolean, default false)
     - `expo_push_token` (text)
     - Timestamps

  2. `properties` - Property listings
     - `id` (uuid, primary key)
     - `seller_id` (uuid, references profiles)
     - Property details (title, description, price, location)
     - Physical specs (rooms, bathrooms, square_meters, floor)
     - `amenities` (jsonb array)
     - `property_type` (enum: apartment, house, studio, room)
     - `status` (enum: available, requested, rented, removed)
     - Metrics (view_count, like_count)
     - Timestamps

  3. `property_images` - Property photos
     - `id` (uuid, primary key)
     - `property_id` (uuid, references properties)
     - `image_url` (text)
     - `storage_path` (text)
     - `is_primary` (boolean)
     - `order_index` (integer)

  4. `likes` - User saved properties
     - `id` (uuid, primary key)
     - `user_id` (uuid, references profiles)
     - `property_id` (uuid, references properties)
     - Unique constraint on (user_id, property_id)

  5. `requests` - Rental requests
     - `id` (uuid, primary key)
     - `buyer_id` (uuid, references profiles)
     - `property_id` (uuid, references properties)
     - `seller_id` (uuid, references profiles)
     - `status` (enum: pending, accepted, declined, cancelled)
     - `message` (text)
     - Contact info and preferences
     - Timestamps

  6. `property_views` - View tracking
     - `id` (uuid, primary key)
     - `property_id` (uuid, references properties)
     - `viewer_id` (uuid, references profiles)
     - `viewed_at` (timestamp)

  7. `rental_history` - Completed rentals
     - `id` (uuid, primary key)
     - Property, seller, and tenant references
     - Rental dates and terms
     - Notes

  ## Security
  - Enable RLS on all tables
  - Public read access for properties
  - Authenticated write access with ownership checks
  - Atomic request creation via RPC function
  - Prevention of multiple pending requests per buyer
  
  ## Important Notes
  1. Single active request constraint enforced at database level
  2. Property status automatically updated on request creation
  3. All timestamps use timestamptz for timezone awareness
  4. Comprehensive indexes for query performance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('available', 'requested', 'rented', 'removed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  email text,
  age integer CHECK (age >= 18),
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  location text,
  avatar_url text,
  is_seller boolean DEFAULT false,
  seller_verified boolean DEFAULT false,
  expo_push_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  currency text DEFAULT 'USD',
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  rooms integer NOT NULL CHECK (rooms > 0),
  bathrooms integer DEFAULT 1,
  square_meters integer,
  floor integer,
  total_floors integer,
  amenities jsonb DEFAULT '[]'::jsonb,
  property_type text CHECK (property_type IN ('apartment', 'house', 'studio', 'room')),
  available_from date,
  minimum_stay_months integer DEFAULT 1,
  status property_status DEFAULT 'available',
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Property images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status request_status DEFAULT 'pending',
  message text,
  buyer_phone text,
  buyer_email text,
  preferred_move_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Property views tracking
CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Rental history table
CREATE TABLE IF NOT EXISTS rental_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) NOT NULL,
  tenant_id uuid REFERENCES profiles(id) NOT NULL,
  request_id uuid REFERENCES requests(id),
  rental_start date NOT NULL,
  rental_end date,
  monthly_rent numeric(12,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_seller ON properties(seller_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_requests_buyer ON requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- RPC function for atomic request creation
CREATE OR REPLACE FUNCTION create_property_request(
  p_buyer_id uuid,
  p_property_id uuid,
  p_message text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_seller_id uuid;
  v_request_id uuid;
  v_property_status property_status;
BEGIN
  -- Lock the property row for update
  SELECT seller_id, status INTO v_seller_id, v_property_status
  FROM properties
  WHERE id = p_property_id
  FOR UPDATE;
  
  -- Check if property exists and is available
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  IF v_property_status != 'available' THEN
    RAISE EXCEPTION 'Property is not available for request';
  END IF;
  
  -- Check if buyer has any pending requests
  IF EXISTS(
    SELECT 1 FROM requests 
    WHERE buyer_id = p_buyer_id 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending request. Please resolve it first.';
  END IF;
  
  -- Check buyer is not the seller
  IF p_buyer_id = v_seller_id THEN
    RAISE EXCEPTION 'You cannot request your own property';
  END IF;
  
  -- Create the request
  INSERT INTO requests(buyer_id, property_id, seller_id, message)
  VALUES(p_buyer_id, p_property_id, v_seller_id, p_message)
  RETURNING id INTO v_request_id;
  
  -- Update property status
  UPDATE properties 
  SET status = 'requested',
      updated_at = now()
  WHERE id = p_property_id;
  
  -- Return success with request details
  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Request sent successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Properties policies  
CREATE POLICY "Anyone can view properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = seller_id);

-- Property images policies
CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage property images"
  ON property_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.seller_id = auth.uid()
    )
  );

-- Requests policies
CREATE POLICY "Users can view their requests"
  ON requests FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their requests"
  ON requests FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Likes policies
CREATE POLICY "Users can view any likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON likes FOR ALL
  USING (auth.uid() = user_id);

-- Property views policies
CREATE POLICY "Anyone can insert views"
  ON property_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view all views"
  ON property_views FOR SELECT
  USING (true);

-- Rental history policies
CREATE POLICY "Users can view their rental history"
  ON rental_history FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = tenant_id);

CREATE POLICY "Sellers can insert rental history"
  ON rental_history FOR INSERT
  WITH CHECK (auth.uid() = seller_id);