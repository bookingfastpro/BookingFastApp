# 🚨 URGENT : Clé API Stripe Expirée

## ❌ Problème
Votre clé Stripe `sk_live_***rFxdVe` est **EXPIRÉE** et ne fonctionne plus.

## ✅ Solution en 3 étapes

### 1️⃣ Obtenir une nouvelle clé Stripe

1. Allez sur **[Stripe Dashboard](https://dashboard.stripe.com/)**
2. Connectez-vous à votre compte
3. Allez dans **Développeurs** > **Clés API**
4. Dans la section **Clés secrètes** :
   - Cliquez sur **"Créer une clé secrète"**
   - Donnez-lui un nom : `BookingFast Production`
   - Copiez la nouvelle clé (elle commence par `sk_live_...`)

⚠️ **IMPORTANT** : Copiez la clé immédiatement, elle ne sera plus visible après !

---

### 2️⃣ Mettre à jour l'Edge Function

**Option A : Via la base de données (RECOMMANDÉ)**

Exécutez cette requête SQL dans votre Supabase :

```sql
-- Mettre à jour la clé Stripe dans platform_settings
UPDATE platform_settings
SET 
  stripe_secret_key = 'VOTRE_NOUVELLE_CLE_sk_live_...',
  updated_at = now()
WHERE id = 1;

-- Vérifier que c'est bien enregistré
SELECT 
  CASE 
    WHEN stripe_secret_key IS NOT NULL THEN '✅ Clé configurée'
    ELSE '❌ Clé manquante'
  END as status,
  updated_at
FROM platform_settings
WHERE id = 1;
```

**Option B : Modifier directement le code (TEMPORAIRE)**

Si vous n'avez pas accès à la base de données, modifiez temporairement :

```typescript
// Dans supabase/functions/cancel-subscription/index.ts
const PLATFORM_STRIPE_SECRET_KEY = 'VOTRE_NOUVELLE_CLE_sk_live_...';
```

---

### 3️⃣ Redéployer l'Edge Function

Si vous avez modifié le code :

```bash
# Redéployer la fonction
supabase functions deploy cancel-subscription
```

Si vous avez utilisé la base de données, **aucun redéploiement nécessaire** ! ✅

---

## 🧪 Tester

1. Retournez dans votre application
2. Cliquez sur **"Résilier l'abonnement"**
3. Vérifiez les logs :
   - ✅ Devrait voir : `Abonnement programmé pour annulation`
   - ❌ Ne devrait PLUS voir : `Expired API Key`

---

## 🔒 Sécurité

### ⚠️ IMPORTANT : Ne JAMAIS commiter les clés dans Git !

Après avoir testé, **supprimez la clé hardcodée** du code et utilisez uniquement la base de données.

### Pourquoi la base de données ?

- ✅ Pas besoin de redéployer pour changer la clé
- ✅ Protégé par RLS (Row Level Security)
- ✅ Accessible uniquement par le service role
- ✅ Pas de risque de commit accidentel dans Git

---

## 📋 Checklist

- [ ] Nouvelle clé Stripe créée
- [ ] Clé copiée (commence par `sk_live_...`)
- [ ] Clé mise à jour dans `platform_settings` OU dans le code
- [ ] Edge Function redéployée (si modification code)
- [ ] Test de résiliation réussi
- [ ] Clé hardcodée supprimée du code (si utilisée temporairement)

---

## 🆘 Si ça ne marche toujours pas

Vérifiez dans les logs Supabase Edge Functions :

```bash
# Voir les logs en temps réel
supabase functions logs cancel-subscription --follow
```

Cherchez :
- ✅ `Abonnement programmé pour annulation`
- ❌ `Expired API Key` (ne devrait plus apparaître)
- ❌ `Invalid API Key` (vérifiez que la clé est correcte)

---

## 💡 Astuce

Pour éviter ce problème à l'avenir :

1. **Utilisez toujours la base de données** pour stocker les clés
2. **Configurez des alertes** dans Stripe pour les clés qui expirent
3. **Documentez** où sont stockées vos clés API

---

**Temps estimé : 5 minutes** ⚡
