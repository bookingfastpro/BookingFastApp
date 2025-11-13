/*
  # Correction des permissions POS

  1. Permissions
    - Grant SELECT, INSERT, UPDATE, DELETE sur toutes les tables POS
    - Vérification et correction des policies RLS
*/

-- Grant permissions sur pos_categories
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_categories TO authenticated;

-- Grant permissions sur pos_products
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_products TO authenticated;

-- Grant permissions sur pos_transactions
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_transactions TO authenticated;

-- Grant permissions sur pos_transaction_items
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_transaction_items TO authenticated;

-- Grant permissions sur pos_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_settings TO authenticated;

-- Vérifier que RLS est activé
ALTER TABLE pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_settings ENABLE ROW LEVEL SECURITY;

-- Recréer les policies pour pos_categories
DROP POLICY IF EXISTS "Users can manage their categories" ON pos_categories;
CREATE POLICY "Users can manage their categories"
  ON pos_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recréer les policies pour pos_products
DROP POLICY IF EXISTS "Users can manage their products" ON pos_products;
CREATE POLICY "Users can manage their products"
  ON pos_products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recréer les policies pour pos_transactions
DROP POLICY IF EXISTS "Users can manage their transactions" ON pos_transactions;
CREATE POLICY "Users can manage their transactions"
  ON pos_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recréer les policies pour pos_transaction_items
DROP POLICY IF EXISTS "Users can view transaction items" ON pos_transaction_items;
DROP POLICY IF EXISTS "Users can insert transaction items" ON pos_transaction_items;

CREATE POLICY "Users can manage transaction items"
  ON pos_transaction_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pos_transactions
      WHERE pos_transactions.id = pos_transaction_items.transaction_id
      AND pos_transactions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pos_transactions
      WHERE pos_transactions.id = pos_transaction_items.transaction_id
      AND pos_transactions.user_id = auth.uid()
    )
  );

-- Recréer les policies pour pos_settings
DROP POLICY IF EXISTS "Users can manage their settings" ON pos_settings;
CREATE POLICY "Users can manage their settings"
  ON pos_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
