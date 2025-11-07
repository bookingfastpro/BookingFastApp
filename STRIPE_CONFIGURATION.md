# 🔧 Guide de Configuration Stripe pour BookingFast

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer Stripe pour accepter les paiements dans votre application BookingFast.

---

## 🎯 Étape 1 : Créer un compte Stripe

### 1.1 Inscription
1. Allez sur [https://stripe.com](https://stripe.com)
2. Cliquez sur **"Commencer maintenant"**
3. Créez votre compte avec votre email professionnel
4. Vérifiez votre email

### 1.2 Activation du compte
1. Complétez les informations de votre entreprise
2. Ajoutez vos informations bancaires
3. Vérifiez votre identité si demandé

---

## 🔑 Étape 2 : Récupérer les clés API

### 2.1 Accéder aux clés API
1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Dans le menu de gauche, cliquez sur **"Développeurs"**
3. Cliquez sur **"Clés API"**

### 2.2 Récupérer les clés
Vous verrez deux types de clés :

#### 🧪 **Clés de test** (pour développement)
- **Clé publique de test** : `pk_test_...`
- **Clé secrète de test** : `sk_test_...`

#### 🚀 **Clés de production** (pour site en ligne)
- **Clé publique** : `pk_live_...`
- **Clé secrète** : `sk_live_...`

⚠️ **Important :** Commencez toujours par les clés de test !

---

## 🔗 Étape 3 : Configurer le Webhook

### 3.1 Créer le webhook
1. Dans le Dashboard Stripe, allez dans **"Développeurs"** > **"Webhooks"**
2. Cliquez sur **"Ajouter un point de terminaison"**

### 3.2 URL du webhook
Utilisez cette URL (remplacez par votre domaine) :
```
https://bookingfast.pro/functions/v1/stripe-webhook
```

### 3.3 Événements à écouter
Sélectionnez ces événements :
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `invoice.payment_succeeded`

### 3.4 Récupérer la clé secrète du webhook
1. Une fois créé, cliquez sur votre webhook
2. Dans la section **"Clé de signature"**, cliquez sur **"Révéler"**
3. Copiez la clé qui commence par `whsec_...`

---

## ⚙️ Étape 4 : Configurer dans BookingFast

### 4.1 Accéder aux paramètres
1. Connectez-vous à votre application BookingFast
2. Allez dans **"Réglages"** (icône engrenage)
3. Cliquez sur l'onglet **"Configuration Stripe"**

### 4.2 Saisir les clés
1. **Activez Stripe** en cochant la case
2. Saisissez vos clés :
   - **Clé publique** : `pk_test_...` (ou `pk_live_...` en production)
   - **Clé secrète** : `sk_test_...` (ou `sk_live_...` en production)
   - **Webhook secret** : `whsec_...`

### 4.3 Tester la configuration
1. Cliquez sur **"Tester la connexion"**
2. Vous devriez voir : ✅ "Clés Stripe valides ! Configuration OK"

---

## 🧪 Étape 5 : Tester les paiements

### 5.1 Créer une réservation test
1. Allez dans **"Planning"**
2. Créez une nouvelle réservation
3. Générez un lien de paiement

### 5.2 Cartes de test Stripe
Utilisez ces numéros de carte pour tester :

#### ✅ **Paiement réussi**
- **Numéro** : `4242 4242 4242 4242`
- **Expiration** : N'importe quelle date future (ex: 12/25)
- **CVC** : N'importe quel code 3 chiffres (ex: 123)

#### ❌ **Paiement échoué**
- **Numéro** : `4000 0000 0000 0002`

#### 🔐 **3D Secure**
- **Numéro** : `4000 0025 0000 3155`

### 5.3 Vérifier le résultat
1. Effectuez le paiement test
2. Vérifiez que le statut passe à "Payé" dans BookingFast
3. Vérifiez dans Stripe Dashboard que le paiement apparaît

---

## 🚀 Étape 6 : Passer en production

### 6.1 Activer le compte
1. Dans Stripe Dashboard, cliquez sur **"Activer le compte"**
2. Complétez toutes les informations demandées
3. Attendez la validation (généralement quelques heures)

### 6.2 Utiliser les clés de production
1. Remplacez les clés de test par les clés de production
2. Mettez à jour le webhook avec l'URL de production
3. Testez avec de vrais paiements (petits montants)

---

## 🔍 Dépannage

### ❌ "Clés Stripe invalides"
- Vérifiez que vous utilisez les bonnes clés (test vs production)
- Assurez-vous qu'il n'y a pas d'espaces avant/après les clés
- Vérifiez que les clés commencent par `pk_` et `sk_`

### ❌ "Webhook non configuré"
- Vérifiez l'URL du webhook
- Assurez-vous que les événements sont sélectionnés
- Testez le webhook depuis Stripe Dashboard

### ❌ "Erreur lors de la création de session"
- Vérifiez que Stripe est activé dans les paramètres
- Vérifiez que toutes les clés sont saisies
- Consultez les logs Supabase Edge Functions

### ❌ "Paiement non mis à jour"
- Vérifiez que le webhook fonctionne
- Vérifiez les logs du webhook dans Stripe
- Assurez-vous que les métadonnées sont correctes

---

## 📞 Support

### Logs à vérifier
1. **Stripe Dashboard** > **Développeurs** > **Logs**
2. **Supabase Dashboard** > **Edge Functions** > **stripe-checkout** > **Logs**
3. **Console navigateur** (F12) pour les erreurs frontend

### Informations à fournir en cas de problème
- Type d'erreur (création session, webhook, mise à jour statut)
- Clés utilisées (test ou production)
- Logs d'erreur complets
- URL de votre application

---

## ✅ Checklist finale

- [ ] Compte Stripe créé et vérifié
- [ ] Clés API récupérées (publique + secrète)
- [ ] Webhook configuré avec la bonne URL
- [ ] Événements webhook sélectionnés
- [ ] Clé secrète webhook récupérée
- [ ] Configuration saisie dans BookingFast
- [ ] Test de connexion réussi
- [ ] Paiement test effectué avec succès
- [ ] Statut mis à jour automatiquement

---

## 🎉 Félicitations !

Une fois cette configuration terminée, vos clients pourront :
- 💳 Payer leurs acomptes en ligne
- 🔒 Bénéficier de paiements sécurisés
- 📧 Recevoir des confirmations automatiques
- ⚡ Voir leurs réservations confirmées instantanément

**Temps de configuration estimé :** 15-30 minutes
