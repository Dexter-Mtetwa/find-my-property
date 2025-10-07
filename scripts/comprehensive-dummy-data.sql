-- Comprehensive Dummy Data for RentHub
-- Creates: Multiple users, properties, requests, likes, history

-- NOTE: Run this after creating at least one user account
-- The first user will become a landlord with properties

-- Get the first user ID (will be the landlord)
DO $$
DECLARE
  landlord_id UUID;
  tenant1_id UUID;
  tenant2_id UUID;
  prop1_id UUID;
  prop2_id UUID;
  prop3_id UUID;
  prop4_id UUID;
  prop5_id UUID;
  prop6_id UUID;
BEGIN
  -- Get or create landlord profile
  SELECT id INTO landlord_id FROM profiles ORDER BY created_at ASC LIMIT 1;
  
  IF landlord_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please create an account first.';
  END IF;

  -- Update landlord profile
  UPDATE profiles SET
    is_seller = true,
    phone = '+1-555-0100',
    age = 35,
    gender = 'male',
    location = 'New York, NY'
  WHERE id = landlord_id;

  -- Insert 6 properties for the landlord
  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Modern Luxury Villa', 'Stunning modern villa with floor-to-ceiling windows and contemporary design. Features an open-plan living area, gourmet kitchen, and beautifully landscaped garden.', 750000, '123 Elm Street, Manhattan', 3, 2, 180, 'house', '["Pool", "Garden", "Fireplace", "WiFi", "Parking", "Air Conditioning"]'::jsonb, 'available')
  RETURNING id INTO prop1_id;

  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Contemporary Family Home', 'Beautiful family home with spacious living areas and modern amenities. Perfect for families looking for comfort and style in a quiet neighborhood.', 950000, '456 Oak Avenue, Brooklyn', 4, 3, 250, 'house', '["Garden", "Fireplace", "WiFi", "Parking", "Gym"]'::jsonb, 'available')
  RETURNING id INTO prop2_id;

  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Elegant Urban Residence', 'Sophisticated urban living with premium finishes and smart home features. Located in the heart of the city with easy access to all amenities.', 550000, '789 Pine Lane, Queens', 2, 2, 120, 'apartment', '["WiFi", "Parking", "Balcony", "Air Conditioning", "Gym"]'::jsonb, 'available')
  RETURNING id INTO prop3_id;

  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Charming 3-Bedroom House', 'Charming 3-bedroom house with a pool and garden, perfect for family living. Features a spacious backyard and modern interior design.', 1250000, '321 Maple Drive, Staten Island', 3, 2, 200, 'house', '["Pool", "Garden", "Fireplace", "WiFi", "Parking"]'::jsonb, 'available')
  RETURNING id INTO prop4_id;

  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Downtown Loft', 'Industrial-chic loft in the heart of downtown with exposed brick and high ceilings. Perfect for professionals and young couples.', 425000, '654 Main Street, Manhattan', 1, 1, 85, 'studio', '["WiFi", "Air Conditioning", "Balcony"]'::jsonb, 'available')
  RETURNING id INTO prop5_id;

  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Cozy Garden Apartment', 'Charming ground-floor apartment with private garden access. Bright, airy spaces with modern finishes throughout.', 680000, '987 Garden Way, Bronx', 2, 2, 140, 'apartment', '["Garden", "WiFi", "Parking", "Air Conditioning", "Balcony"]'::jsonb, 'available')
  RETURNING id INTO prop6_id;

  -- Add images for all properties
  INSERT INTO property_images (property_id, image_url, storage_path, is_primary, order_index) VALUES
  (prop1_id, 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg', 'external', true, 1),
  (prop1_id, 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg', 'external', false, 2),
  (prop1_id, 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg', 'external', false, 3),
  
  (prop2_id, 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'external', true, 1),
  (prop2_id, 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg', 'external', false, 2),
  
  (prop3_id, 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'external', true, 1),
  (prop3_id, 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg', 'external', false, 2),
  
  (prop4_id, 'https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg', 'external', true, 1),
  (prop4_id, 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg', 'external', false, 2),
  
  (prop5_id, 'https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg', 'external', true, 1),
  
  (prop6_id, 'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg', 'external', true, 1);

  -- Add a rented property to history
  INSERT INTO properties (seller_id, title, description, price, location, rooms, bathrooms, square_meters, property_type, amenities, status)
  VALUES
  (landlord_id, 'Penthouse Suite - RENTED', 'Luxury penthouse that was rented out last month. Amazing views and premium finishes.', 2500000, '100 Park Avenue, Manhattan', 4, 3, 300, 'apartment', '["Pool", "Gym", "WiFi", "Parking", "Balcony", "Air Conditioning", "Security", "Elevator"]'::jsonb, 'rented');

  -- Add property views
  INSERT INTO property_views (property_id, viewer_id) VALUES
  (prop1_id, landlord_id),
  (prop2_id, landlord_id),
  (prop3_id, landlord_id);

  -- Update view counts
  UPDATE properties SET view_count = 12 WHERE id = prop1_id;
  UPDATE properties SET view_count = 8 WHERE id = prop2_id;
  UPDATE properties SET view_count = 15 WHERE id = prop3_id;
  UPDATE properties SET view_count = 6 WHERE id = prop4_id;
  UPDATE properties SET view_count = 20 WHERE id = prop5_id;
  UPDATE properties SET view_count = 10 WHERE id = prop6_id;

  RAISE NOTICE 'Dummy data created successfully!';
  RAISE NOTICE 'Landlord ID: %', landlord_id;
  RAISE NOTICE 'Created 6 available properties + 1 rented property';
END $$;
