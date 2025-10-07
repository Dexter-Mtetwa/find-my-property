-- Sample data for RentHub rental marketplace

-- Note: Replace USER_ID with actual user IDs from your auth.users table
-- This is just example data structure

-- Sample properties with realistic data
INSERT INTO properties (
  seller_id,
  title,
  description,
  price,
  location,
  rooms,
  bathrooms,
  square_meters,
  floor,
  total_floors,
  amenities,
  property_type,
  available_from,
  status
) VALUES
-- Property 1: Modern Studio
(
  'YOUR_USER_ID_HERE',
  'Modern Studio in Downtown',
  'Beautifully renovated studio apartment in the heart of downtown. Features hardwood floors, stainless steel appliances, and floor-to-ceiling windows with city views. Perfect for young professionals.',
  1200,
  'Downtown, Manhattan',
  1,
  1,
  45,
  5,
  12,
  '["WiFi", "Air Conditioning", "Heating", "Furnished", "Washer", "Dishwasher", "Elevator", "Gym"]'::jsonb,
  'studio',
  CURRENT_DATE,
  'available'
),
-- Property 2: Spacious 2BR
(
  'YOUR_USER_ID_HERE',
  'Spacious 2BR with Balcony',
  'Stunning 2-bedroom apartment featuring a large balcony with amazing views. Recently updated kitchen and bathroom. Walking distance to metro station and shopping centers.',
  2100,
  'Brooklyn Heights',
  2,
  1,
  85,
  3,
  8,
  '["WiFi", "Air Conditioning", "Heating", "Balcony", "Parking", "Pet Friendly", "Elevator"]'::jsonb,
  'apartment',
  CURRENT_DATE + INTERVAL '15 days',
  'available'
),
-- Property 3: Luxury Penthouse
(
  'YOUR_USER_ID_HERE',
  'Luxury Penthouse with Terrace',
  'Exclusive penthouse apartment with private rooftop terrace. Features premium finishes, smart home technology, and panoramic city views. Includes 2 parking spaces.',
  4500,
  'Upper East Side',
  3,
  2,
  150,
  15,
  15,
  '["WiFi", "Air Conditioning", "Heating", "Terrace", "Parking", "Gym", "Doorman", "Storage", "Smart Home"]'::jsonb,
  'apartment',
  CURRENT_DATE + INTERVAL '30 days',
  'available'
),
-- Property 4: Cozy 1BR
(
  'YOUR_USER_ID_HERE',
  'Cozy 1BR Near Park',
  'Charming one-bedroom apartment located near Central Park. Quiet neighborhood with easy access to public transportation. Perfect for singles or couples.',
  1650,
  'Upper West Side',
  1,
  1,
  60,
  2,
  6,
  '["WiFi", "Air Conditioning", "Heating", "Laundry", "Pet Friendly"]'::jsonb,
  'apartment',
  CURRENT_DATE,
  'available'
),
-- Property 5: Student-Friendly Room
(
  'YOUR_USER_ID_HERE',
  'Affordable Room in Shared House',
  'Private room in a friendly shared house. Includes access to shared kitchen, living room, and backyard. Close to university campus and public transport. Utilities included.',
  750,
  'Queens, Astoria',
  1,
  1,
  20,
  1,
  3,
  '["WiFi", "Furnished", "Shared Kitchen", "Backyard", "Laundry"]'::jsonb,
  'room',
  CURRENT_DATE + INTERVAL '7 days',
  'available'
),
-- Property 6: Family House
(
  'YOUR_USER_ID_HERE',
  'Beautiful Family House with Garden',
  'Spacious family home featuring 4 bedrooms, 2.5 bathrooms, and a large backyard. Perfect for families. Recently renovated kitchen and new HVAC system. Quiet residential area with excellent schools nearby.',
  3200,
  'Queens, Forest Hills',
  4,
  2,
  180,
  NULL,
  2,
  '["WiFi", "Air Conditioning", "Heating", "Garden", "Parking", "Pet Friendly", "Washer", "Dishwasher"]'::jsonb,
  'house',
  CURRENT_DATE + INTERVAL '45 days',
  'available'
);

-- Note: To add images, you would need to:
-- 1. Upload images to Supabase Storage
-- 2. Insert records into property_images table with the storage URLs
-- Example:
-- INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
-- VALUES
-- ('property-uuid-here', 'https://your-supabase-storage-url/image1.jpg', 'properties/image1.jpg', true, 0);
