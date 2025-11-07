# 🔐 Variables d'Environnement Supabase Edge Functions

## 📋 Comment configurer les variables

1. Allez dans votre **Dashboard Supabase** : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Edge Functions**
4. Dans la section **Environment Variables**, ajoutez ces variables :

---

## 🔑 Variables OBLIGATOIRES pour Stripe

### STRIPE_SECRET_KEY
```
sk_test_51ABC123...
```
**Description :** Votre clé secrète Stripe (commence par `sk_test_` pour les tests ou `sk_live_` pour la production)

**Où la trouver :**
1. Dashboard Stripe > Développeurs > Clés API
2. Copiez la "Clé secrète" (cliquez sur "Révéler" si masquée)

### STRIPE_WEBHOOK_SECRET
```
whsec_ABC123...
```
**Description :** Clé secrète du webhook Stripe (commence par `whsec_`)

**Où la trouver :**
1. Dashboard Stripe > Développeurs > Webhooks
2. Cliquez sur votre webhook
3. Section "Clé de signature" > Cliquez sur "Révéler"

---

## 📧 Variables OPTIONNELLES pour Brevo (emails)

### BREVO_API_KEY
```
xkeysib-ABC123...
```
**Description :** Clé API Brevo pour l'envoi d'emails automatiques

**Où la trouver :**
1. Dashboard Brevo > Compte > Clés API SMTP & API
2. Créez une nouvelle clé API

---

## 🗄️ Variables AUTOMATIQUES (déjà configurées)

Ces variables sont automatiquement disponibles dans Supabase :

- `SUPABASE_URL` - URL de votre projet
- `SUPABASE_ANON_KEY` - Clé publique anonyme
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role
- `SUPABASE_DB_URL` - URL de la base de données

---

## ✅ Configuration minimale pour les paiements

Pour que les paiements fonctionnent, vous devez configurer **AU MINIMUM** :

```env
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_cle_webhook
```

---

## 🧪 Valeurs de test Stripe

Pour tester, utilisez ces clés de test Stripe :

### Clés de test (commencent par `sk_test_` et `pk_test_`)
- Utilisez vos vraies clés de test depuis votre Dashboard Stripe
- Ne jamais utiliser de clés de production (`sk_live_`, `pk_live_`) pour les tests

### Cartes de test
- **Succès :** `4242 4242 4242 4242`
- **Échec :** `4000 0000 0000 0002`
- **3D Secure :** `4000 0025 0000 3155`

---

## 🔧 Instructions de configuration

### 1. Aller dans Supabase
```
https://supabase.com/dashboard/project/[VOTRE-PROJECT-ID]/settings/edge-functions
```

### 2. Ajouter les variables une par une
Cliquez sur **"Add new variable"** pour chaque variable :

| Nom | Valeur | Obligatoire |
|-----|--------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | ✅ OUI |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ OUI |
| `BREVO_API_KEY` | `xkeysib_...` | ❌ Optionnel |

### 3. Sauvegarder
Cliquez sur **"Save"** après avoir ajouté chaque variable.

---

## 🚨 Sécurité IMPORTANTE

- ❌ **JAMAIS** mettre ces clés dans votre code source
- ❌ **JAMAIS** commiter ces clés dans Git
- ✅ **TOUJOURS** utiliser les variables d'environnement Supabase
- ✅ **TOUJOURS** utiliser les clés de test en développement

---

## 🔍 Vérification

Une fois configuré, testez :

1. **Créez une réservation** dans votre app
2. **Générez un lien de paiement**
3. **Cliquez sur "Payer"**
4. **Utilisez la carte de test** `4242 4242 4242 4242`
5. **Vérifiez** que le statut passe à "Payé"

---

## 🆘 Dépannage

### Erreur "Stripe not configured"
- Vérifiez que `STRIPE_SECRET_KEY` est bien configuré
- Vérifiez que la clé commence par `sk_test_` ou `sk_live_`

### Erreur "Webhook secret invalid"
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien configuré
- Vérifiez que la clé commence par `whsec_`

### Erreur "Failed to create session"
- Vérifiez vos clés Stripe dans le Dashboard Stripe
- Assurez-vous d'utiliser les bonnes clés (test vs production)

---

## 📞 Support

Si les paiements ne fonctionnent toujours pas après configuration :

1. **Vérifiez les logs** Supabase : Edge Functions > stripe-checkout > Logs
2. **Vérifiez les logs** Stripe : Dashboard > Développeurs > Logs
3. **Testez vos clés** directement dans le Dashboard Stripe

---

## 🎯 Résumé

**Configuration minimale requise :**
1. ✅ Compte Stripe créé
2. ✅ `STRIPE_SECRET_KEY` configuré dans Supabase
3. ✅ `STRIPE_WEBHOOK_SECRET` configuré dans Supabase
4. ✅ Webhook créé dans Stripe pointant vers votre Edge Function

**Temps de configuration estimé :** 10-15 minutes
