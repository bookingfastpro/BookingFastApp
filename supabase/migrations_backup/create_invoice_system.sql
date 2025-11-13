/*
  # Système de Facturation

  1. Nouvelles Tables
    - `products` - Catalogue de produits
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `price_ht` (decimal)
      - `price_ttc` (decimal)
      - `tva_rate` (decimal)
      - `unit` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invoices` - Factures
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key)
      - `invoice_number` (text, unique)
      - `invoice_date` (date)
      - `due_date` (date)
      - `status` (text) - draft, sent, paid, cancelled
      - `subtotal_ht` (decimal)
      - `total_tva` (decimal)
      - `total_ttc` (decimal)
      - `notes` (text)
      - `payment_conditions` (text)
      - `sent_at` (timestamptz)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invoice_items` - Lignes de facture
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key, nullable)
      - `description` (text)
      - `quantity` (decimal)
      - `unit_price_ht` (decimal)
      - `tva_rate` (decimal)
      - `discount_percent` (decimal)
      - `total_ht` (decimal)
      - `total_tva` (decimal)
      - `total_ttc` (decimal)
      - `created_at` (timestamptz)

    - `company_info` - Informations entreprise
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, unique)
      - `company_name` (text)
      - `legal_form` (text)
      - `siret` (text)
      - `tva_number` (text)
      - `address` (text)
      - `postal_code` (text)
      - `city` (text)
      - `country` (text)
      - `phone` (text)
      - `email` (text)
      - `website` (text)
      - `logo_url` (text)
      - `bank_name` (text)
      - `iban` (text)
      - `bic` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour les utilisateurs authentifiés
*/

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price_ht decimal(10,2) NOT NULL DEFAULT 0,
  price_ttc decimal(10,2) NOT NULL DEFAULT 0,
  tva_rate decimal(5,2) NOT NULL DEFAULT 20,
  unit text DEFAULT 'unité',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  subtotal_ht decimal(10,2) NOT NULL DEFAULT 0,
  total_tva decimal(10,2) NOT NULL DEFAULT 0,
  total_ttc decimal(10,2) NOT NULL DEFAULT 0,
  notes text,
  payment_conditions text DEFAULT 'Paiement à réception de facture',
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des lignes de facture
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  unit_price_ht decimal(10,2) NOT NULL DEFAULT 0,
  tva_rate decimal(5,2) NOT NULL DEFAULT 20,
  discount_percent decimal(5,2) DEFAULT 0,
  total_ht decimal(10,2) NOT NULL DEFAULT 0,
  total_tva decimal(10,2) NOT NULL DEFAULT 0,
  total_ttc decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invoice items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Table des informations entreprise
CREATE TABLE IF NOT EXISTS company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text NOT NULL,
  legal_form text,
  siret text,
  tva_number text,
  address text,
  postal_code text,
  city text,
  country text DEFAULT 'France',
  phone text,
  email text,
  website text,
  logo_url text,
  bank_name text,
  iban text,
  bic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company info"
  ON company_info
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour générer le prochain numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE user_id = p_user_id
  AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_number := 'F' || v_year || '-' || LPAD(v_count::text, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON company_info(user_id);
