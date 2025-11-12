# Test OneSignal - Guide Rapide

## Problème: Le bouton "Activer" ne fait rien

### Diagnostic rapide (dans la console du navigateur)

Ouvrez la console (F12) et tapez ces commandes une par une:

```javascript
// 1. Vérifier que OneSignal est chargé
typeof OneSignal
// Devrait retourner: "object"

// 2. Vérifier l'App ID
import.meta.env.VITE_ONESIGNAL_APP_ID
// Devrait retourner: "fc7cc56d-5928-4587-add0-c9f7aed71f43"

// 3. Tester l'initialisation manuellement
await OneSignal.init({
  appId: 'fc7cc56d-5928-4587-add0-c9f7aed71f43',
  allowLocalhostAsSecureOrigin: true
})

// 4. Demander la permission manuellement
await OneSignal.Notifications.requestPermission()
// Une popup du navigateur devrait apparaître

// 5. Vérifier le Player ID
await OneSignal.User.PushSubscription.id
// Devrait retourner un UUID si ça marche
```

## Page de test dédiée

Une page de test a été créée: `/test-onesignal.html`

### Comment l'utiliser:

1. **Ouvrez votre navigateur** à l'adresse:
   ```
   https://bookingfast.hevolife.fr/test-onesignal.html
   ```

2. **Cliquez sur les boutons dans l'ordre**:
   - "1. Initialiser OneSignal"
   - "2. Demander Permission" → Une popup du navigateur devrait apparaître
   - "3. Obtenir Player ID" → Votre Player ID s'affichera

3. **Regardez les logs** en bas de la page

## Problèmes courants

### 1. Popup du navigateur bloquée

**Symptôme**: Rien ne se passe quand on clique sur "Activer"

**Cause**: Le navigateur bloque les popups

**Solution**:
1. Vérifiez l'icône de popup bloquée dans la barre d'adresse
2. Autorisez les popups pour ce site
3. Réessayez

### 2. HTTPS requis

**Symptôme**: Erreur "Service workers not supported"

**Cause**: OneSignal nécessite HTTPS (sauf localhost)

**Solution**:
- ✅ Production: Utilisez votre domaine HTTPS
- ✅ Local: Utilisez `localhost` ou `127.0.0.1`
- ❌ Ne fonctionne PAS avec `192.168.x.x` ou adresses IP locales

### 3. Service Worker bloqué

**Symptôme**: Erreur lors de l'initialisation

**Solution**:
1. Ouvrez DevTools (F12) → Application → Service Workers
2. Cliquez sur "Unregister" pour tous les workers
3. Rechargez la page
4. Réessayez

### 4. App ID invalide

**Symptôme**: Erreur "Invalid App ID"

**Vérification**:
```javascript
// Dans la console
console.log(import.meta.env.VITE_ONESIGNAL_APP_ID)
```

Si undefined ou incorrect:
1. Vérifiez `.env` à la racine du projet
2. Relancez le serveur de dev: `npm run dev`

## Vérifier l'état actuel

### Dans la console du navigateur:

```javascript
// État de OneSignal
console.log('OneSignal loaded:', typeof OneSignal !== 'undefined')

// Permission actuelle
console.log('Permission:', await OneSignal.Notifications.permission)

// Player ID
console.log('Player ID:', await OneSignal.User.PushSubscription.id)

// Tags de l'utilisateur
console.log('Tags:', OneSignal.User.getTags())
```

### Dans la base de données:

```sql
-- Vérifier si le Player ID est enregistré
SELECT * FROM user_onesignal WHERE user_id = 'votre-user-id';
```

## Logs attendus (console)

Quand tout fonctionne bien, vous devriez voir:

```
✅ [DEBUG] OneSignalService constructor
✅ [DEBUG] App ID configured: true
✅ [DEBUG] Initializing OneSignal...
✅ [DEBUG] OneSignal initialized successfully
✅ [DEBUG] OneSignal initialized and user registered: <user_id>
✅ [DEBUG] handleRequestPermission called
✅ [DEBUG] OneSignal initialized: true
✅ [DEBUG] Requesting notification permission...
✅ [DEBUG] Notification permission granted
✅ [DEBUG] Player ID saved to database: <player_id>
```

## Test manuel complet

### Étape par étape:

1. **Connectez-vous** à l'application
2. **Ouvrez la console** (F12)
3. **Attendez** que OneSignal soit initialisé (regardez les logs)
4. **Cliquez** sur la cloche de notifications
5. **Cliquez** sur "Activer les notifications push"
6. **Une popup du navigateur devrait apparaître**
7. **Cliquez** sur "Autoriser"
8. **Vérifiez** que vous voyez un message de succès

### Si la popup n'apparaît pas:

```javascript
// Testez manuellement dans la console
await OneSignal.Notifications.requestPermission()
```

Si ça fonctionne dans la console mais pas via le bouton, c'est un problème JavaScript côté React.

### Si la popup apparaît mais ne se passe rien après:

1. Vérifiez la console pour les erreurs
2. Vérifiez que le Player ID est généré:
   ```javascript
   await OneSignal.User.PushSubscription.id
   ```
3. Vérifiez dans la base de données:
   ```sql
   SELECT * FROM user_onesignal ORDER BY created_at DESC LIMIT 5;
   ```

## Debugging avancé

### Activer les logs OneSignal:

```javascript
localStorage.setItem('loglevel:OneSignalSDK', 'trace')
location.reload()
```

### Désactiver les logs:

```javascript
localStorage.removeItem('loglevel:OneSignalSDK')
location.reload()
```

### Réinitialiser complètement OneSignal:

```javascript
// 1. Déconnecter l'utilisateur
await OneSignal.logout()

// 2. Désinscrire le service worker
const registrations = await navigator.serviceWorker.getRegistrations()
for (let registration of registrations) {
  registration.unregister()
}

// 3. Vider le cache
localStorage.clear()
sessionStorage.clear()

// 4. Recharger
location.reload()
```

## Support OneSignal

Si rien ne fonctionne:

1. Vérifiez le [OneSignal Status](https://status.onesignal.com/)
2. Consultez la [documentation officielle](https://documentation.onesignal.com/)
3. Testez avec leur [exemple live](https://onesignal.com/webpush)

## Configuration OneSignal (dashboard)

Vérifiez dans votre dashboard OneSignal:

1. **App Settings → Platforms → Web Push**
2. Vérifiez que:
   - Site URL est correct: `https://bookingfast.hevolife.fr`
   - Auto Resubscribe est activé
   - Default Notification Icon est configuré
   - Prompt Settings est "Native Browser Prompt"

---

**TIP**: Utilisez d'abord `/test-onesignal.html` pour isoler le problème. Si ça marche là-bas mais pas dans l'app, c'est un problème React/code. Si ça ne marche nulle part, c'est un problème de configuration OneSignal.
