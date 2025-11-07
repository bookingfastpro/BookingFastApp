# 🔍 Debug Stripe Configuration

## Étape 1 : Vérifier les logs Edge Function

1. **Allez dans Supabase Dashboard**
2. **Edge Functions** → **stripe-checkout** → **Logs**
3. **Cherchez les lignes** :
   - `🔍 Variables disponibles:`
   - `⚠️ Tentative de récupération depuis la base de données`
   - `✅ Clé Stripe récupérée depuis...` OU `❌ AUCUNE clé Stripe...`

## Étape 2 : Vérifier la table platform_settings

**Exécutez cette requête SQL dans Supabase :**

```sql
-- Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'platform_settings'
) as table_exists;

-- Vérifier le contenu
SELECT 
  id,
  CASE 
    WHEN stripe_secret_key IS NOT NULL THEN '✅ Configurée'
    ELSE '❌ Manquante'
  END as secret_key_status,
  CASE 
    WHEN stripe_public_key IS NOT NULL THEN '✅ Configurée'
    ELSE '❌ Manquante'
  END as public_key_status,
  created_at,
  updated_at
FROM platform_settings
WHERE id = 1;
```

## Étape 3 : Ajouter les clés si manquantes

**Si la table existe mais est vide :**

```sql
UPDATE platform_settings
SET 
  stripe_secret_key = 'sk_test_VOTRE_CLE_SECRETE',
  stripe_public_key = 'pk_test_VOTRE_CLE_PUBLIQUE',
  updated_at = now()
WHERE id = 1;
```

## Étape 4 : Vérifier les permissions RLS

```sql
-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'platform_settings';

-- Vérifier les policies (devrait être vide = accessible par service_role uniquement)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'platform_settings';
```

## Étape 5 : Test manuel de la requête

**Testez si l'Edge Function peut lire la table :**

```sql
-- Simuler la requête de l'Edge Function
SELECT stripe_secret_key 
FROM platform_settings 
WHERE id = 1;
```

## 🎯 Résultats attendus

### ✅ Configuration correcte :
- Table `platform_settings` existe
- Ligne avec `id = 1` existe
- `stripe_secret_key` est remplie (commence par `sk_test_` ou `sk_live_`)
- RLS activé mais aucune policy (accessible par service_role)

### ❌ Si problème :
- Table n'existe pas → Exécuter la migration
- Ligne vide → Insérer les clés Stripe
- Clé invalide → Vérifier le format (doit commencer par `sk_`)
- Policies bloquantes → Supprimer les policies

## 📋 Checklist de vérification

- [ ] Table `platform_settings` existe
- [ ] Ligne avec `id = 1` existe
- [ ] `stripe_secret_key` remplie et valide
- [ ] RLS activé
- [ ] Aucune policy restrictive
- [ ] Edge Function redéployée
- [ ] Logs Edge Function consultés

---

**Envoyez-moi les résultats des requêtes SQL ci-dessus pour que je puisse vous aider !**
