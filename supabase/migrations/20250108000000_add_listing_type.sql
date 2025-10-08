-- Add listing_type column to properties table
ALTER TABLE properties 
ADD COLUMN listing_type VARCHAR(10) DEFAULT 'rent' CHECK (listing_type IN ('rent', 'buy'));

-- Update existing properties based on price
-- Properties under $5000 are considered rent, $5000+ are considered buy
UPDATE properties 
SET listing_type = CASE 
  WHEN price < 5000 THEN 'rent'
  ELSE 'buy'
END;

-- Make listing_type NOT NULL after setting default values
ALTER TABLE properties 
ALTER COLUMN listing_type SET NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
