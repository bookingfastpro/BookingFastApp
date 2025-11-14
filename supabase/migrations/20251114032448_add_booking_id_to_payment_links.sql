/*
  # Add booking_id column to payment_links table

  1. Changes
    - Add `booking_id` column to `payment_links` table
    - Type: UUID (references bookings table)
    - Nullable: true (for backwards compatibility)
    - Add foreign key constraint to bookings table

  2. Purpose
    - Link payment links to specific bookings
    - Allows tracking which booking a payment link belongs to
*/

-- Add booking_id column to payment_links table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE payment_links ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
    
    -- Add index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_payment_links_booking_id ON payment_links(booking_id);
    
    COMMENT ON COLUMN payment_links.booking_id IS 'Reference to the booking associated with this payment link';
  END IF;
END $$;
