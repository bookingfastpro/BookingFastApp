/*
  # Plugin Système POS

  1. Nouveau Plugin
    - `pos` - Système de point de vente complet
    
  2. Fonctionnalités
    - Gestion des produits et catégories
    - Panier et transactions
    - Gestion du stock
    - Rapports de ventes
    - Prix: 29.99€/mois
*/

INSERT INTO plugins (name, slug, description, icon, category, base_price, features, is_featured) VALUES
(
  'Système POS',
  'pos',
  'Point de vente complet avec gestion des produits, transactions et rapports de ventes',
  'ShoppingCart',
  'sales',
  29.99,
  '[
    {"id": "product_management", "name": "Gestion des produits", "description": "Créez et gérez vos produits et catégories", "included": true},
    {"id": "cart_system", "name": "Système de panier", "description": "Panier intelligent avec calcul automatique", "included": true},
    {"id": "transaction_history", "name": "Historique des ventes", "description": "Consultez toutes vos transactions", "included": true},
    {"id": "stock_management", "name": "Gestion du stock", "description": "Suivez vos stocks en temps réel", "included": false, "price": 10.00},
    {"id": "sales_reports", "name": "Rapports de ventes", "description": "Statistiques et analyses détaillées", "included": false, "price": 15.00},
    {"id": "receipt_printing", "name": "Impression de tickets", "description": "Imprimez des tickets de caisse", "included": false, "price": 5.00}
  ]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  base_price = EXCLUDED.base_price,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();
