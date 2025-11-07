# BookingFast

Système de gestion de réservations avec support multi-utilisateurs, plugins, et paiements Stripe.

## Architecture Stripe

### Deux comptes Stripe distincts

1. **Stripe Plateforme** (pour les abonnements)
   - Utilisé quand les utilisateurs s'abonnent à la plateforme
   - Clés configurées dans les variables d'environnement Supabase
   - Variables: `PLATFORM_STRIPE_SECRET_KEY`, `PLATFORM_STRIPE_WEBHOOK_SECRET`
   - Clé publique frontend: `VITE_PLATFORM_STRIPE_PUBLIC_KEY`

2. **Stripe Utilisateur** (pour leurs clients)
   - Utilisé quand les clients des utilisateurs paient des réservations
   - Clés configurées dans `business_settings` de chaque utilisateur
   - Champs: `stripe_enabled`, `stripe_secret_key`, `stripe_public_key`

### Flux de paiement

#### Abonnement Plateforme
```typescript
// Frontend: SubscriptionStatus.tsx
metadata: {
  payment_type: 'platform_subscription',
  plugin_slug: 'nom-du-plugin'
}

// Backend: stripe-checkout Edge Function
// Utilise PLATFORM_STRIPE_SECRET_KEY
```

#### Paiement Réservation
```typescript
// Frontend: Composant de réservation
metadata: {
  payment_type: 'user_booking',
  user_id: 'id-du-proprietaire'
}

// Backend: stripe-checkout Edge Function
// Récupère stripe_secret_key depuis business_settings
```

## Configuration

### Variables d'environnement (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
VITE_SUPABASE_SERVICE_ROLE_KEY=votre-cle-service

# Stripe Plateforme (pour abonnements)
VITE_PLATFORM_STRIPE_PUBLIC_KEY=pk_live_...
```

### Secrets Supabase (pour Edge Functions)

```bash
# Stripe Plateforme
supabase secrets set PLATFORM_STRIPE_SECRET_KEY=sk_live_...
supabase secrets set PLATFORM_STRIPE_WEBHOOK_SECRET=whsec_...
```

### Configuration Utilisateur (dans l'interface)

Les utilisateurs configurent leur propre Stripe dans **Paramètres > Paiements** :
- Activer Stripe
- Clé publique Stripe
- Clé secrète Stripe
- Secret webhook Stripe

## Déploiement

### Edge Functions

```bash
# Déployer stripe-checkout
supabase functions deploy stripe-checkout

# Déployer handle-subscription-payment
supabase functions deploy handle-subscription-payment

# Déployer public-booking-data
supabase functions deploy public-booking-data
```

### Webhooks Stripe

#### Webhook Plateforme
- URL: `https://votre-projet.supabase.co/functions/v1/stripe-webhook-platform`
- Événements: `checkout.session.completed`, `customer.subscription.updated`

#### Webhook Utilisateur
- URL: `https://votre-projet.supabase.co/functions/v1/stripe-webhook-user`
- Événements: `payment_intent.succeeded`, `charge.succeeded`

## Développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Lancer Supabase localement
supabase start

# Tester les Edge Functions localement
supabase functions serve stripe-checkout
```

## Support

Pour toute question, contactez le support technique.
