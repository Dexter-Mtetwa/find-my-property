-- Add 6 sample properties with real Pexels images
-- Run this after creating your first user account

INSERT INTO properties (
  seller_id,
  title,
  description,
  price,
  location,
  rooms,
  bathrooms,
  square_meters,
  property_type,
  amenities,
  status
) VALUES
(
  (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Modern Luxury Villa',
  'Stunning modern villa with floor-to-ceiling windows and contemporary design. Features an open-plan living area, gourmet kitchen, and beautifully landscaped garden.',
  750000,
  '123 Elm Street, Anytown',
  3,
  2,
  1800,
  'house',
  '["Pool", "Garden", "Fireplace", "WiFi", "Parking", "Air Conditioning"]'::jsonb,
  'available'
),
(
  (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Contemporary Family Home',
  'Beautiful family home with spacious living areas and modern amenities. Perfect for families looking for comfort and style in a quiet neighborhood.',
  950000,
  '456 Oak Avenue, Anytown',
  4,
  3,
  2500,
  'house',
  '["Garden", "Fireplace", "WiFi", "Parking", "Gym"]'::jsonb,
  'available'
),
(
  (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Elegant Urban Residence',
  'Sophisticated urban living with premium finishes and smart home features. Located in the heart of the city with easy access to all amenities.',
  550000,
  '789 Pine Lane, Anytown',
  2,
  2,
  1200,
  'apartment',
  '["WiFi", "Parking", "Balcony", "Air Conditioning", "Gym"]'::jsonb,
  'available'
),
(
  (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Charming 3-Bedroom House',
  'Charming 3-bedroom house with a pool and garden, perfect for family living. Features a spacious backyard and modern interior design.',
  1250000,
  '321 Maple Drive, Cityville',
  3,
  2,
  2000,
  'house',
  '["Pool", "Garden", "Fireplace", "WiFi", "Parking"]'::jsonb,
  'available'
),
(
  (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Downtown Loft',
  'Industrial-chic loft in the heart of downtown with exposed brick and high ceilings. Perfect for professionals and young couples.',
  425000,
  '654 Main Street, Metropolis',
  1,
  1,
  850,
  'studio',
  '["WiFi", "Air Conditioning", "Balcony"]'::jsonb,
  'available'
),
(
  (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Cozy Garden Apartment',
  'Charming ground-floor apartment with private garden access. Bright, airy spaces with modern finishes throughout.',
  680000,
  '987 Garden Way, Suburbia',
  2,
  2,
  1400,
  'apartment',
  '["Garden", "WiFi", "Parking", "Air Conditioning", "Balcony"]'::jsonb,
  'available'
);

-- Add images for each property
INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
  'placeholder',
  true,
  1
FROM properties p
WHERE p.title = 'Modern Luxury Villa'
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
  'placeholder',
  true,
  1
FROM properties p
WHERE p.title = 'Contemporary Family Home'
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
  'placeholder',
  true,
  1
FROM properties p
WHERE p.title = 'Elegant Urban Residence'
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg',
  'placeholder',
  true,
  1
FROM properties p
WHERE p.title = 'Charming 3-Bedroom House'
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg',
  'placeholder',
  true,
  1
FROM properties p
WHERE p.title = 'Downtown Loft'
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg',
  'placeholder',
  true,
  1
FROM properties p
WHERE p.title = 'Cozy Garden Apartment'
ORDER BY p.created_at DESC
LIMIT 1;

-- Add multiple images for first property to test carousel
INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
  'placeholder',
  false,
  2
FROM properties p
WHERE p.title = 'Modern Luxury Villa'
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index)
SELECT
  p.id,
  'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg',
  'placeholder',
  false,
  3
FROM properties p
WHERE p.title = 'Modern Luxury Villa'
ORDER BY p.created_at DESC
LIMIT 1;
