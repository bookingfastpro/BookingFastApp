# 🔗 Configuration du Webhook Stripe

## 📋 Étapes pour configurer le webhook Stripe

### 1. 🔑 Accéder au Dashboard Stripe

1. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Connectez-vous à votre compte Stripe
3. Assurez-vous d'être en mode **Test** pour les tests (ou **Live** pour la production)

### 2. 🎯 Créer le webhook

1. Dans le menu de gauche, cliquez sur **"Developers"**
2. Cliquez sur **"Webhooks"**
3. Cliquez sur **"Add endpoint"** (Ajouter un point de terminaison)

### 3. 📡 Configuration de l'endpoint

**URL du webhook :**
```
https://bookingfast.pro/functions/v1/stripe-webhook
```

**OU si vous utilisez Supabase self-hosting :**
```
https://api.votre-domaine.com/functions/v1/stripe-webhook
```

### 4. 🎪 Événements à écouter

Sélectionnez ces événements :

#### ✅ Événements requis :
- `checkout.session.completed` - Quand une session de paiement est terminée
- `payment_intent.succeeded` - Quand un paiement réussit
- `invoice.payment_succeeded` - Pour les abonnements (si utilisé)

#### 📝 Configuration recommandée :
1. Cliquez sur **"Select events"**
2. Recherchez et cochez :
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `invoice.payment_succeeded`
3. Cliquez sur **"Add events"**

### 5. 🔐 Récupérer la clé secrète du webhook

1. Une fois le webhook créé, cliquez dessus dans la liste
2. Dans la section **"Signing secret"**, cliquez sur **"Reveal"**
3. Copiez la clé qui commence par `whsec_...`

### 6. ⚙️ Configurer les variables d'environnement Supabase

1. Allez dans votre projet Supabase : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Edge Functions**
4. Ajoutez ces variables d'environnement :

```env
STRIPE_SECRET_KEY=sk_test_... (votre clé secrète Stripe)
STRIPE_WEBHOOK_SECRET=whsec_... (la clé du webhook copiée à l'étape 5)
```

### 7. 🧪 Tester le webhook

1. Dans le dashboard Stripe, allez dans votre webhook
2. Cliquez sur l'onglet **"Test"**
3. Sélectionnez `checkout.session.completed`
4. Cliquez sur **"Send test webhook"**
5. Vérifiez que le statut est **"Succeeded"** (200)

### 8. 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Créez une réservation** dans votre application
2. **Générez un lien de paiement**
3. **Effectuez un paiement test** avec la carte `4242 4242 4242 4242`
4. **Vérifiez** que le statut de la réservation passe à "Payé"

### 🚨 Cartes de test Stripe

Pour tester les paiements :

- **Succès :** `4242 4242 4242 4242`
- **Échec :** `4000 0000 0000 0002`
- **3D Secure :** `4000 0025 0000 3155`

**Date d'expiration :** N'importe quelle date future (ex: 12/25)
**CVC :** N'importe quel code à 3 chiffres (ex: 123)

### 🔧 Dépannage

#### ❌ Erreur 401 (Unauthorized)
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correctement configuré
- Assurez-vous que la clé commence par `whsec_`

#### ❌ Erreur 404 (Not Found)
- Vérifiez l'URL du webhook
- Assurez-vous que la fonction Edge est bien déployée

#### ❌ Le statut ne se met pas à jour
- Vérifiez les logs dans Supabase : **Edge Functions** > **stripe-webhook** > **Logs**
- Vérifiez que les métadonnées (email, date, time) correspondent exactement

### 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs Supabase
2. Consultez les logs du webhook dans Stripe
3. Vérifiez que toutes les variables d'environnement sont correctes

---

## 🎉 Une fois configuré

Votre workflow de paiement sera :
1. 💳 Client clique sur "Payer"
2. 🔄 Redirection vers Stripe Checkout
3. ✅ Paiement effectué
4. 📡 Webhook notifie votre application
5. 🎯 Statut mis à jour automatiquement
6. 🎊 Client voit "Payé" dans l'interface !
