# OneSignal - Guide de Débogage

## Problème: "SDK already initialized"

### Cause
OneSignal ne peut être initialisé qu'une seule fois par page. Si vous voyez cette erreur, c'est que `OneSignal.init()` est appelé plusieurs fois.

### Solution implémentée

Le service OneSignal utilise maintenant un système de singleton avec protection contre la double initialisation:

1. **Flag `initializing`**: Empêche plusieurs initialisations simultanées
2. **Promise partagée**: Si une initialisation est en cours, les autres appels attendent la même promise
3. **Gestion d'erreur gracieuse**: Si OneSignal est déjà initialisé, on capture l'erreur et on continue

### Vérification

Ouvrez la console du navigateur (F12) et vous devriez voir:

```
✅ Logs normaux:
[DEBUG] Initializing OneSignal...
[DEBUG] OneSignal initialized successfully
[DEBUG] OneSignal initialized and user registered: <user_id>

❌ Logs d'erreur (ne devraient plus apparaître):
Failed to initialize OneSignal: Error: SDK already initialized
```

## Ordre d'initialisation

```
1. Page chargée
2. useNotifications hook monte
3. Si user connecté → OneSignal.init() (une seule fois)
4. User enregistré avec son ID
5. Player ID sauvegardé dans user_onesignal table
```

## Commandes de débogage

### Dans la console du navigateur

```javascript
// Vérifier si OneSignal est initialisé
OneSignal.User.PushSubscription.id

// Vérifier l'état de la permission
await OneSignal.Notifications.permission

// Vérifier les tags de l'utilisateur
OneSignal.User.getTags()

// Forcer un logout/login
await OneSignal.logout()
await OneSignal.login('user_id')
```

### Vérifier dans la base de données

```sql
-- Vérifier les Player IDs enregistrés
SELECT user_id, player_id, subscription_status, created_at
FROM user_onesignal
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier les notifications envoyées
SELECT
  id,
  user_id,
  title,
  onesignal_sent,
  onesignal_notification_id,
  onesignal_error,
  created_at
FROM notifications
WHERE onesignal_sent IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

## Problèmes courants

### 1. "OneSignal App ID not configured"

**Cause**: Les variables d'environnement ne sont pas configurées.

**Solution**:
```bash
# Frontend (.env)
VITE_ONESIGNAL_APP_ID=votre_app_id

# Backend (supabase/.env)
ONESIGNAL_APP_ID=votre_app_id
ONESIGNAL_REST_API_KEY=votre_rest_api_key
```

### 2. Les notifications ne sont pas reçues

**Checklist**:
- [ ] Permissions du navigateur activées
- [ ] Player ID enregistré dans `user_onesignal`
- [ ] Variables d'environnement configurées
- [ ] Conteneurs Supabase redémarrés
- [ ] Edge Function déployée

**Test manuel**:
```bash
# Tester l'Edge Function directement
curl -X POST http://localhost:54321/functions/v1/send-onesignal-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid",
    "type": "booking_created",
    "title": "Test",
    "message": "Test message"
  }'
```

### 3. Player ID null

**Cause**: L'utilisateur n'a pas accepté les permissions ou OneSignal n'est pas initialisé.

**Solution**:
1. Vérifier dans la console: `await OneSignal.User.PushSubscription.id`
2. Si null, demander les permissions: `await OneSignal.Notifications.requestPermission()`
3. Vérifier que l'App ID est correct

### 4. Multiple initialisations

**Cause**: Le hook `useNotifications` est utilisé par plusieurs composants qui montent en même temps.

**Solution** (déjà implémentée):
- Le service OneSignal utilise un système de singleton
- Une seule initialisation globale même si appelée plusieurs fois
- Les appels suivants attendent la première initialisation

## Logs détaillés

### Activer les logs OneSignal

Dans la console du navigateur:

```javascript
// Activer tous les logs OneSignal
localStorage.setItem('loglevel:OneSignalSDK', 'trace');

// Recharger la page
location.reload();
```

### Désactiver les logs

```javascript
localStorage.removeItem('loglevel:OneSignalSDK');
location.reload();
```

## Test de bout en bout

1. **Connectez-vous** à l'application
2. **Ouvrez la console** (F12)
3. **Vérifiez l'initialisation**:
   ```
   ✓ [DEBUG] Initializing OneSignal...
   ✓ [DEBUG] OneSignal initialized successfully
   ✓ [DEBUG] OneSignal initialized and user registered
   ```
4. **Cliquez sur la cloche** de notifications
5. **Cliquez "Activer les notifications"**
6. **Acceptez la permission** du navigateur
7. **Vérifiez le Player ID**:
   ```javascript
   await OneSignal.User.PushSubscription.id
   // Devrait retourner: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
8. **Créez une réservation** (ou déclenchez une notification)
9. **Vérifiez que la notification arrive**

## Architecture simplifiée

```
┌─────────────────────────────────────┐
│  Page Load                          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  useNotifications Hook              │
│  (une seule instance globale)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  oneSignalService.initialize()      │
│  - Check si déjà initialisé         │
│  - Si en cours, attendre            │
│  - Sinon, initialiser               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  OneSignal.init() [SDK]             │
│  (appelé une seule fois)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  oneSignalService.registerUser()    │
│  - Enregistre dans user_onesignal  │
└─────────────────────────────────────┘
```

## Support

Si le problème persiste:

1. Copiez les logs de la console
2. Vérifiez `SELECT * FROM user_onesignal`
3. Vérifiez les logs Docker: `docker logs supabase_edge_functions`
4. Consultez la documentation OneSignal: https://documentation.onesignal.com/

---

**Note**: Le système de singleton garantit qu'il n'y aura plus d'erreur "SDK already initialized".
