# 🚀 Redéploiement de l'Edge Function

## Problème Identifié
L'Edge Function `stripe-checkout` utilise probablement **l'ancienne version** du code qui ne contient pas la logique de récupération depuis la base de données.

## Solution : Redéployer l'Edge Function

### Étape 1 : Vérifier le code actuel déployé

1. **Allez dans Supabase Dashboard**
2. **Edge Functions** → **stripe-checkout**
3. **Cliquez sur "View Code"** ou "Edit"
4. **Vérifiez si vous voyez** :
   - `console.log('🔍 Méthode 3: Récupération depuis la base de données...')`
   - `await supabaseClient.from('platform_settings').select(...)`

### Étape 2 : Redéployer l'Edge Function

**Option A : Via Supabase CLI (Recommandé)**

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet
supabase link --project-ref VOTRE_PROJECT_REF

# Déployer l'Edge Function
supabase functions deploy stripe-checkout
```

**Option B : Via Supabase Dashboard**

1. **Edge Functions** → **stripe-checkout**
2. **Cliquez sur "Deploy"** ou **"Redeploy"**
3. **Copiez-collez le contenu** du fichier `supabase/functions/stripe-checkout/index.ts`
4. **Cliquez sur "Deploy"**

### Étape 3 : Vérifier le déploiement

1. **Attendez 30 secondes** que le déploiement se termine
2. **Testez en cliquant sur "S'abonner"**
3. **Consultez les logs** pour voir les nouveaux messages :
   - `🔍 Méthode 1: Recherche dans les variables d'environnement...`
   - `🔍 Méthode 2: Recherche automatique...`
   - `🔍 Méthode 3: Récupération depuis la base de données...`

### Étape 4 : Si le problème persiste

**Vérifiez que la table platform_settings existe et contient les clés :**

```sql
-- Vérifier la table
SELECT * FROM platform_settings WHERE id = 1;

-- Si vide, insérer les clés
UPDATE platform_settings
SET 
  stripe_secret_key = 'sk_test_VOTRE_CLE_SECRETE',
  stripe_public_key = 'pk_test_VOTRE_CLE_PUBLIQUE',
  updated_at = now()
WHERE id = 1;
```

## 🎯 Checklist

- [ ] Edge Function redéployée
- [ ] Nouveau code visible dans le dashboard
- [ ] Table platform_settings existe
- [ ] Clés Stripe insérées dans la table
- [ ] Test de l'abonnement effectué
- [ ] Logs consultés pour vérifier l'exécution

---

**Une fois redéployée, testez à nouveau et envoyez-moi les logs !**
