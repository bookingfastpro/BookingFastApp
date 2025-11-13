-- ⚠️ EXÉCUTEZ CE SCRIPT MANUELLEMENT DANS SUPABASE SQL EDITOR ⚠️

-- 1. Grant permissions sur toutes les tables POS
GRANT ALL ON pos_categories TO authenticated;
GRANT ALL ON pos_products TO authenticated;
GRANT ALL ON pos_transactions TO authenticated;
GRANT ALL ON pos_transaction_items TO authenticated;
GRANT ALL ON pos_settings TO authenticated;

-- 2. Activer RLS sur toutes les tables
ALTER TABLE pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_settings ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can manage their categories" ON pos_categories;
DROP POLICY IF EXISTS "Users can manage their products" ON pos_products;
DROP POLICY IF EXISTS "Users can manage their transactions" ON pos_transactions;
DROP POLICY IF EXISTS "Users can view transaction items" ON pos_transaction_items;
DROP POLICY IF EXISTS "Users can insert transaction items" ON pos_transaction_items;
DROP POLICY IF EXISTS "Users can manage transaction items" ON pos_transaction_items;
DROP POLICY IF EXISTS "Users can manage their settings" ON pos_settings;

-- 4. Créer les nouvelles policies pour pos_categories
CREATE POLICY "Users can manage their categories"
  ON pos_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Créer les nouvelles policies pour pos_products
CREATE POLICY "Users can manage their products"
  ON pos_products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Créer les nouvelles policies pour pos_transactions
CREATE POLICY "Users can manage their transactions"
  ON pos_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Créer les nouvelles policies pour pos_transaction_items
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

-- 8. Créer les nouvelles policies pour pos_settings
CREATE POLICY "Users can manage their settings"
  ON pos_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ TERMINÉ - Les permissions sont maintenant configurées correctement
