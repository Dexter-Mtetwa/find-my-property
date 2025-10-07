/*
  # Add Atomic Request Creation and Constraints

  1. Constraints
    - Add unique index to enforce single pending request per buyer
    - Ensures business rule: one active request at a time
  
  2. Functions
    - create_property_request_atomic: Atomically create request and lock property
    - Checks: buyer has no pending requests, property is available
    - Actions: create request, update property status to 'requested'
  
  3. Security
    - Function runs with SECURITY DEFINER for atomic transactions
    - Validates all conditions before making changes
*/

-- Add unique constraint for single pending request per buyer
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_pending_request 
ON requests (buyer_id) 
WHERE status = 'pending';

-- Create atomic request function
CREATE OR REPLACE FUNCTION create_property_request_atomic(
  p_buyer_id UUID,
  p_property_id UUID,
  p_seller_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_property_status property_status;
  v_pending_count INT;
BEGIN
  -- Check buyer has no pending requests
  SELECT COUNT(*) INTO v_pending_count
  FROM requests
  WHERE buyer_id = p_buyer_id AND status = 'pending';
  
  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'You already have a pending request. Cancel it first to request another property.';
  END IF;
  
  -- Check property is available (with row lock)
  SELECT status INTO v_property_status
  FROM properties
  WHERE id = p_property_id
  FOR UPDATE;
  
  IF v_property_status IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  IF v_property_status != 'available' THEN
    RAISE EXCEPTION 'Property is no longer available';
  END IF;
  
  -- Create request
  INSERT INTO requests (buyer_id, property_id, seller_id, message, status)
  VALUES (p_buyer_id, p_property_id, p_seller_id, p_message, 'pending')
  RETURNING id INTO v_request_id;
  
  -- Update property status to requested
  UPDATE properties
  SET status = 'requested'
  WHERE id = p_property_id;
  
  RETURN v_request_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_property_request_atomic TO authenticated;
