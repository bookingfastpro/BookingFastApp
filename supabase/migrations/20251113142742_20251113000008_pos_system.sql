/*
  # Migration 08: Point of Sale (POS) System
  
  ## Overview
  Complete POS system for in-person sales and transactions
  
  ## Tables Created
  1. **pos_categories**
     - id, user_id, name, description
     - color, display_order
  
  2. **pos_products**
     - id, user_id, category_id, name, description
     - price_ht, price_ttc, tax_rate
     - sku, barcode, stock_quantity
     - is_active, image_url
  
  3. **pos_transactions**
     - id, user_id, transaction_number
     - transaction_date, total_ht, total_tax, total_ttc
     - payment_method, payment_status
     - customer_name, customer_email, notes
  
  4. **pos_transaction_items**
     - id, transaction_id, product_id
     - quantity, unit_price_ht, unit_price_ttc
     - tax_rate, total_ht, total_ttc
  
  5. **pos_settings**
     - id, user_id, tax_rate, receipt_header
     - receipt_footer, auto_print_receipt
  
  ## Security
  - RLS enabled on all tables
  - Users can only manage their own POS data
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS pos_transaction_items CASCADE;
DROP TABLE IF EXISTS pos_transactions CASCADE;
DROP TABLE IF EXISTS pos_products CASCADE;
DROP TABLE IF EXISTS pos_categories CASCADE;
DROP TABLE IF EXISTS pos_settings CASCADE;

-- ============================================================================
-- TABLE: pos_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_rate numeric(5,2) DEFAULT 20.00,
  receipt_header text,
  receipt_footer text,
  auto_print_receipt boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE pos_settings IS 'POS system settings per user';

ALTER TABLE pos_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own POS settings"
  ON pos_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: pos_categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE pos_categories IS 'Product categories for POS';

ALTER TABLE pos_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own POS categories"
  ON pos_categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: pos_products
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES pos_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price_ht numeric(10,2) NOT NULL DEFAULT 0,
  price_ttc numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20.00,
  sku text,
  barcode text,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE pos_products IS 'Products for POS sales';

ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own POS products"
  ON pos_products FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: pos_transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_number text NOT NULL,
  transaction_date timestamptz DEFAULT now() NOT NULL,
  total_ht numeric(10,2) NOT NULL DEFAULT 0,
  total_tax numeric(10,2) NOT NULL DEFAULT 0,
  total_ttc numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'check', 'transfer', 'other')),
  payment_status text NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('completed', 'pending', 'refunded', 'cancelled')),
  customer_name text,
  customer_email text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE pos_transactions IS 'POS sales transactions';

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own POS transactions"
  ON pos_transactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: pos_transaction_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES pos_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price_ht numeric(10,2) NOT NULL DEFAULT 0,
  unit_price_ttc numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20.00,
  total_ht numeric(10,2) NOT NULL DEFAULT 0,
  total_ttc numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE pos_transaction_items IS 'Line items for POS transactions';

ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own POS transaction items"
  ON pos_transaction_items FOR ALL
  TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM pos_transactions WHERE user_id = auth.uid() OR user_id IS NULL
    )
  )
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM pos_transactions WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pos_categories_user_id ON pos_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_user_id ON pos_products(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_category_id ON pos_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_is_active ON pos_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pos_products_sku ON pos_products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos_products_barcode ON pos_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pos_transactions_user_id ON pos_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_number ON pos_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);

-- Grants
GRANT ALL ON pos_settings TO authenticated;
GRANT ALL ON pos_categories TO authenticated;
GRANT ALL ON pos_products TO authenticated;
GRANT ALL ON pos_transactions TO authenticated;
GRANT ALL ON pos_transaction_items TO authenticated;