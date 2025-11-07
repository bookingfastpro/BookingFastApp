# 🔐 Configuration des Secrets Stripe - Solution Alternative

## ❌ Problème Identifié

Les secrets Supabase Edge Functions ne sont **pas accessibles** via `Deno.env.get()` dans certaines configurations.

## ✅ Solution : Utiliser la Base de Données

Au lieu de stocker les clés dans les secrets Supabase, nous les stockons dans une table `platform_settings`.

---

## 📋 Étapes de Configuration

### 1️⃣ Créer la table (déjà fait)

La migration `create_platform_settings.sql` a créé la table.

### 2️⃣ Ajouter vos clés Stripe dans la base de données

**Option A : Via Supabase Dashboard (Recommandé)**

1. Allez dans **Database > Tables > platform_settings**
2. Cliquez sur **Insert row**
3. Remplissez :
   - `id` : `1` (obligatoire)
   - `stripe_secret_key` : Votre clé `sk_test_...` ou `sk_live_...`
   - `stripe_public_key` : Votre clé `pk_test_...` ou `pk_live_...`
   - `stripe_webhook_secret` : Votre clé `whsec_...`
4. Cliquez sur **Save**

**Option B : Via SQL**

```sql
UPDATE platform_settings
SET 
  stripe_secret_key = 'sk_test_VOTRE_CLE_SECRETE',
  stripe_public_key = 'pk_test_VOTRE_CLE_PUBLIQUE',
  stripe_webhook_secret = 'whsec_VOTRE_WEBHOOK_SECRET',
  updated_at = now()
WHERE id = 1;
```

---

## 🔍 Vérification

### Vérifier que les clés sont bien enregistrées

```sql
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
  CASE 
    WHEN stripe_webhook_secret IS NOT NULL THEN '✅ Configurée'
    ELSE '❌ Manquante'
  END as webhook_status,
  created_at,
  updated_at
FROM platform_settings
WHERE id = 1;
```

---

## 🚀 Comment ça fonctionne maintenant

### Ordre de récupération des clés (Fallback Chain)

L'Edge Function essaie **4 méthodes** dans cet ordre :

1. **`PLATFORM_STRIPE_SECRET_KEY`** (secrets Supabase)
2. **`STRIPE_SECRET_KEY`** (secrets Supabase alternatif)
3. **Variables système** (recherche automatique)
4. **Base de données** `platform_settings` ✅ **SOLUTION FINALE**

### Avantages de cette approche

✅ **Fonctionne toujours** - Pas de dépendance aux secrets Supabase  
✅ **Facile à mettre à jour** - Modification directe dans la base  
✅ **Sécurisé** - RLS activé, seul le service role peut accéder  
✅ **Debuggable** - Logs détaillés à chaque étape  

---

## 🔒 Sécurité

### La table est protégée par RLS

```sql
-- Seul le service role peut lire/écrire
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
```

### Les clés ne sont JAMAIS exposées

- ❌ Pas dans le code frontend
- ❌ Pas dans les logs publics
- ✅ Uniquement accessibles par l'Edge Function (service role)

---

## 🧪 Test

Après avoir ajouté vos clés :

1. **Allez dans votre app** → Réglages → Abonnement
2. **Cliquez sur "S'abonner"**
3. **Vérifiez les logs** dans Supabase Edge Functions
4. **Vous devriez voir** :
   ```
   ✅ Clé Stripe récupérée depuis la base de données
   ✅ Stripe initialisé avec succès
   ✅ Session checkout créée
   ```

---

## 🆘 Dépannage

### Erreur "Configuration Stripe plateforme manquante"

**Vérifiez que la clé est bien dans la base :**

```sql
SELECT stripe_secret_key FROM platform_settings WHERE id = 1;
```

**Si NULL :**
- Ajoutez votre clé via le Dashboard ou SQL (voir étape 2)

### Erreur "Invalid API Key"

**Vérifiez que la clé commence par :**
- `sk_test_` (mode test)
- `sk_live_` (mode production)

**Vérifiez qu'il n'y a pas d'espaces :**
```sql
UPDATE platform_settings
SET stripe_secret_key = TRIM(stripe_secret_key)
WHERE id = 1;
```

---

## 📞 Support

Si ça ne fonctionne toujours pas :

1. **Vérifiez les logs** Edge Function : `stripe-checkout` → Logs
2. **Cherchez** : `🔍 Variables disponibles:` pour voir ce qui est détecté
3. **Vérifiez** : `✅ Clé Stripe récupérée depuis la base de données`

---

## ✅ Checklist

- [ ] Table `platform_settings` créée
- [ ] Clé `stripe_secret_key` ajoutée
- [ ] Clé `stripe_public_key` ajoutée (optionnel)
- [ ] Clé `stripe_webhook_secret` ajoutée (optionnel)
- [ ] Test de paiement réussi

**Temps de configuration : 5 minutes** ⚡
