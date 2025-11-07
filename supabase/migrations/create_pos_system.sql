/*
  # Système POS - Point de Vente

  1. Nouvelles Tables
    - `pos_categories` - Catégories de produits
    - `pos_products` - Produits disponibles
    - `pos_transactions` - Transactions de vente
    - `pos_transaction_items` - Articles dans les transactions
    - `pos_settings` - Configuration POS par utilisateur

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour accès utilisateur
*/

-- Table des catégories
CREATE TABLE IF NOT EXISTS pos_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  icon text DEFAULT 'Package',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pos_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their categories"
  ON pos_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des produits
CREATE TABLE IF NOT EXISTS pos_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES pos_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  cost numeric(10,2) DEFAULT 0,
  stock integer DEFAULT 999,
  track_stock boolean DEFAULT false,
  duration_minutes integer,
  color text NOT NULL DEFAULT 'blue',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their products"
  ON pos_products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_number text NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 20,
  tax_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  payment_status text DEFAULT 'completed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their transactions"
  ON pos_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table des articles de transaction
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES pos_transactions(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES pos_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transaction items"
  ON pos_transaction_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pos_transactions
      WHERE pos_transactions.id = pos_transaction_items.transaction_id
      AND pos_transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transaction items"
  ON pos_transaction_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pos_transactions
      WHERE pos_transactions.id = pos_transaction_items.transaction_id
      AND pos_transactions.user_id = auth.uid()
    )
  );

-- Table des paramètres POS
CREATE TABLE IF NOT EXISTS pos_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tax_rate numeric(5,2) DEFAULT 20,
  currency text DEFAULT 'EUR',
  receipt_header text,
  receipt_footer text,
  auto_print boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pos_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their settings"
  ON pos_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour générer un numéro de transaction
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS text AS $$
DECLARE
  v_date text;
  v_count integer;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1
  INTO v_count
  FROM pos_transactions
  WHERE transaction_number LIKE v_date || '%';
  
  RETURN v_date || '-' || lpad(v_count::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pos_products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id
    AND track_stock = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_sale
  AFTER INSERT ON pos_transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_pos_products_user_id ON pos_products(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_category_id ON pos_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_user_id ON pos_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON pos_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);
