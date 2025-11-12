# Configuration OneSignal - Guide Complet

Ce guide vous explique comment configurer OneSignal pour envoyer des notifications push dans l'application BookingFast.

## Table des matières

1. [Créer un compte OneSignal](#1-créer-un-compte-onesignal)
2. [Configurer votre application](#2-configurer-votre-application)
3. [Obtenir vos clés API](#3-obtenir-vos-clés-api)
4. [Configurer les variables d'environnement](#4-configurer-les-variables-denvironnement)
5. [Configurer Supabase Edge Functions](#5-configurer-supabase-edge-functions)
6. [Tester les notifications](#6-tester-les-notifications)
7. [Dépannage](#7-dépannage)

---

## 1. Créer un compte OneSignal

1. Allez sur [https://onesignal.com](https://onesignal.com)
2. Cliquez sur **"Sign Up"** en haut à droite
3. Créez un compte gratuit (plan Free disponible jusqu'à 10,000 abonnés)
4. Confirmez votre adresse email

---

## 2. Configurer votre application

### 2.1 Créer une nouvelle application

1. Connectez-vous à votre tableau de bord OneSignal
2. Cliquez sur **"New App/Website"**
3. Donnez un nom à votre application (ex: "BookingFast")
4. Cliquez sur **"Create App"**

### 2.2 Configurer la plateforme Web Push

1. Sélectionnez **"Web Push"** comme plateforme
2. Choisissez **"Typical Setup"**
3. Remplissez les informations:
   - **Site Name**: Le nom de votre site (ex: "BookingFast")
   - **Site URL**: L'URL de votre site en production (ex: https://votre-domaine.com)
   - **Auto Resubscribe**: Activé (recommandé)
   - **Default Notification Icon URL**: URL de votre icône de notification (192x192 pixels minimum)

4. Cliquez sur **"Save"**

### 2.3 Configurer pour iOS/Android (optionnel pour PWA)

Si vous souhaitez supporter les applications mobiles iOS et Android:

1. Retournez à la configuration de l'app
2. Ajoutez les plateformes **iOS** et **Android**
3. Suivez les instructions spécifiques pour chaque plateforme

---

## 3. Obtenir vos clés API

### 3.1 Obtenir l'App ID

1. Dans le tableau de bord OneSignal, allez dans **Settings** → **Keys & IDs**
2. Copiez **OneSignal App ID**
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3.2 Obtenir la REST API Key

1. Dans la même page (**Keys & IDs**)
2. Copiez **REST API Key**
   - Format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important**: Ne partagez jamais ces clés publiquement!

---

## 4. Configurer les variables d'environnement

### 4.1 Configuration locale (.env)

Ouvrez le fichier `.env` à la racine du projet et ajoutez:

```env
# OneSignal Configuration
VITE_ONESIGNAL_APP_ID=votre_app_id_ici
VITE_ONESIGNAL_REST_API_KEY=votre_rest_api_key_ici
```

Remplacez `votre_app_id_ici` et `votre_rest_api_key_ici` par vos vraies clés.

### 4.2 Configuration de production

Pour le déploiement en production (Netlify, Vercel, etc.):

1. Allez dans les paramètres de votre plateforme de déploiement
2. Ajoutez les variables d'environnement:
   - `VITE_ONESIGNAL_APP_ID`
   - `VITE_ONESIGNAL_REST_API_KEY`
3. Redéployez l'application

---

## 5. Configurer Supabase Edge Functions

### 5.1 Ajouter les secrets Supabase

Les Edge Functions ont besoin d'accéder aux clés OneSignal de manière sécurisée.

#### Via Supabase Dashboard

1. Allez sur [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Edge Functions**
4. Cliquez sur **Manage secrets**
5. Ajoutez les secrets suivants:
   - **Name**: `ONESIGNAL_APP_ID`, **Value**: votre App ID OneSignal
   - **Name**: `ONESIGNAL_REST_API_KEY`, **Value**: votre REST API Key OneSignal
6. Cliquez sur **Save**

#### Via CLI Supabase (alternative)

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref

# Ajouter les secrets
supabase secrets set ONESIGNAL_APP_ID=votre_app_id_ici
supabase secrets set ONESIGNAL_REST_API_KEY=votre_rest_api_key_ici
```

### 5.2 Déployer l'Edge Function

L'Edge Function `send-onesignal-notification` a déjà été créée. Si vous avez besoin de la redéployer:

```bash
# Déployer la fonction
supabase functions deploy send-onesignal-notification
```

---

## 6. Tester les notifications

### 6.1 Test depuis l'application

1. Connectez-vous à l'application
2. Allez dans **Admin** → **Paramètres**
3. Cherchez la section **"Notifications Push"**
4. Cliquez sur **"Activer les notifications"** si ce n'est pas déjà fait
5. Cliquez sur **"Envoyer une notification de test"**
6. Vous devriez recevoir une notification push

### 6.2 Test depuis le Dashboard OneSignal

1. Allez dans votre tableau de bord OneSignal
2. Cliquez sur **"Messages"** → **"New Push"**
3. Configurez votre notification de test
4. Sélectionnez **"Test Message"**
5. Cliquez sur **"Send Test"**

### 6.3 Vérifier dans les logs

Pour voir les logs de l'Edge Function:

```bash
# Afficher les logs en temps réel
supabase functions logs send-onesignal-notification --follow
```

---

## 7. Dépannage

### Problème: Les notifications ne sont pas reçues

**Solutions possibles**:

1. **Vérifier les permissions du navigateur**
   - Chrome: `chrome://settings/content/notifications`
   - Firefox: `about:preferences#privacy` → Permissions → Notifications
   - Safari: Préférences → Sites web → Notifications

2. **Vérifier que l'utilisateur est inscrit**
   - Ouvrez la console du navigateur (F12)
   - Tapez: `await OneSignal.User.PushSubscription.id`
   - Devrait retourner un ID, sinon l'utilisateur n'est pas inscrit

3. **Vérifier les clés API**
   - Les clés OneSignal sont-elles correctes dans `.env`?
   - Les secrets Supabase sont-ils configurés?

4. **Vérifier la base de données**
   ```sql
   -- Vérifier si l'utilisateur a un player ID
   SELECT id, email, onesignal_player_id
   FROM profiles
   WHERE id = 'user_id_ici';

   -- Vérifier les notifications
   SELECT * FROM notifications
   WHERE user_id = 'user_id_ici'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Problème: Erreur "Missing OneSignal configuration"

**Solution**: Vérifiez que les variables d'environnement sont bien configurées:

```bash
# Vérifier les variables locales
cat .env | grep ONESIGNAL

# Vérifier les secrets Supabase
supabase secrets list
```

### Problème: Notifications reçues mais pas stockées

**Solution**: Vérifier les triggers Supabase:

```sql
-- Vérifier que le trigger existe
SELECT * FROM pg_trigger
WHERE tgname = 'trigger_send_onesignal_notification';

-- Vérifier les logs d'erreur
SELECT * FROM notifications
WHERE onesignal_error IS NOT NULL
ORDER BY created_at DESC;
```

### Problème: OneSignal Player ID non enregistré

**Solution**: Forcer la réinscription:

```javascript
// Dans la console du navigateur
await OneSignal.logout();
await OneSignal.login('user_id_ici');
```

---

## Configuration avancée

### Personnaliser les notifications

Vous pouvez personnaliser les notifications dans le fichier `send-onesignal-notification/index.ts`:

```typescript
const oneSignalPayload = {
  app_id: oneSignalAppId,
  include_player_ids: [profile.onesignal_player_id],
  headings: { en: title },
  contents: { en: message },
  data: notificationData,

  // Personnalisation avancée
  web_push_topic: 'booking_notifications',
  priority: 10,
  ttl: 86400, // 24 heures

  // Icône et image
  chrome_web_icon: 'https://votre-domaine.com/icon-192x192.png',
  chrome_web_image: 'https://votre-domaine.com/notification-image.png',

  // Boutons d'action
  web_buttons: [
    {
      id: 'view-booking',
      text: 'Voir la réservation',
      url: 'https://votre-domaine.com/calendar'
    }
  ]
};
```

### Segmentation des utilisateurs

Utilisez les tags OneSignal pour segmenter vos utilisateurs:

```typescript
// Dans oneSignalService.ts
await oneSignalService.setTags({
  user_role: 'admin',
  subscription_tier: 'pro',
  language: 'fr'
});
```

---

## Ressources utiles

- [Documentation OneSignal](https://documentation.onesignal.com/)
- [OneSignal Web Push Guide](https://documentation.onesignal.com/docs/web-push-quickstart)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Support OneSignal](https://onesignal.com/support)

---

## Limites du plan gratuit

Le plan gratuit OneSignal inclut:
- ✅ 10,000 abonnés
- ✅ Notifications illimitées
- ✅ Segmentation basique
- ✅ Analytics de base
- ✅ Support par email

Pour plus d'abonnés ou de fonctionnalités avancées, consultez les [plans OneSignal](https://onesignal.com/pricing).

---

## Support

Si vous rencontrez des problèmes:

1. Consultez la section [Dépannage](#7-dépannage) ci-dessus
2. Vérifiez les logs de l'application et de Supabase
3. Contactez le support OneSignal si le problème persiste
4. Ouvrez une issue sur le repository GitHub du projet

---

**Dernière mise à jour**: Novembre 2025
