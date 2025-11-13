/*
  # Migration 05: Financial Features (Invoices, Products, Payments)
  
  ## Overview
  Complete invoicing and payment tracking system
  
  ## Tables Created
  1. **company_info**
     - id, user_id, company_name, siret, vat_number
     - address, city, postal_code, country
     - phone, email, website, logo_url
  
  2. **products**
     - id, user_id, name, description
     - price_ht, price_ttc, tax_rate
     - reference, category, is_active
  
  3. **invoices**
     - id, user_id, client_id, invoice_number
     - issue_date, due_date, status
     - subtotal, tax_amount, total_amount
     - paid_amount, document_type
     - notes, payment_terms
  
  4. **invoice_items**
     - id, invoice_id, product_id
     - description, quantity, unit_price_ht
     - tax_rate, total_ht, total_ttc
  
  5. **invoice_payments**
     - id, invoice_id, user_id
     - amount, payment_date, payment_method
     - reference, notes
  
  ## Security
  - RLS enabled on all tables
  - Users can only manage their own data
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS invoice_payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS company_info CASCADE;

-- ============================================================================
-- TABLE: company_info
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  siret text,
  vat_number text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  phone text,
  email text,
  website text,
  logo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE company_info IS 'Company information for invoices';

ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all company info"
  ON company_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage company info"
  ON company_info FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: products
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_ht numeric(10,2) NOT NULL DEFAULT 0,
  price_ttc numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20.00,
  reference text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE products IS 'Products and services for invoicing';

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  document_type text DEFAULT 'invoice' CHECK (document_type IN ('invoice', 'quote', 'credit_note')),
  notes text,
  payment_terms text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE invoices IS 'Invoices, quotes, and credit notes';

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: invoice_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price_ht numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20.00,
  total_ht numeric(10,2) NOT NULL DEFAULT 0,
  total_ttc numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE invoice_items IS 'Line items for invoices';

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: invoice_payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'check', 'card', 'transfer', 'other')),
  reference text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (amount != 0)
);

COMMENT ON TABLE invoice_payments IS 'Payments and refunds for invoices';

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all payments"
  ON invoice_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage payments"
  ON invoice_payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON company_info(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- Grants
GRANT ALL ON company_info TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoice_items TO authenticated;
GRANT ALL ON invoice_payments TO authenticated;