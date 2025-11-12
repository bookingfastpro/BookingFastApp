# OneSignal - Problème Player ID non généré

## Symptôme

Après avoir accordé la permission de notifications:
- ✅ Permission acceptée
- ❌ Player ID reste `null`

## Causes possibles

### 1. Configuration OneSignal Dashboard incorrecte

Le problème le plus fréquent est une mauvaise configuration sur le dashboard OneSignal.

**Vérifiez sur https://dashboard.onesignal.com:**

1. **App Settings → Platforms → Web Push**
2. Vérifiez:
   - ✅ **Site URL**: Doit correspondre exactement à votre domaine
     - Exemple: `https://bookingfast.hevolife.fr`
     - PAS de slash à la fin
   - ✅ **Auto Resubscribe**: Activé
   - ✅ **My Site Is Not Fully HTTPS**: Désactivé (votre site est HTTPS)
   - ✅ **Site Name**: Configuré

3. **Typical Setup → Choose Integration**
   - Assurez-vous d'avoir choisi **"Typical Site"** et non "WordPress" ou autre

### 2. Service Worker bloqué

OneSignal a besoin d'installer un Service Worker.

**Vérification:**
1. Ouvrez DevTools (F12)
2. Onglet **Application** → **Service Workers**
3. Vous devriez voir un service worker pour OneSignal

**Si absent ou erreur:**
```javascript
// Dans la console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

**Solution:**
```javascript
// Désenregistrer tous les service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Recharger la page
location.reload();
```

### 3. Configuration HTTPS/HTTP mixte

OneSignal nécessite HTTPS sauf pour `localhost`.

**Vérification:**
```javascript
console.log('Protocol:', window.location.protocol);
// Doit être 'https:' ou 'http:' (si localhost)
```

### 4. Bloqueur de publicité ou Privacy Badger

Certains bloqueurs empêchent OneSignal de fonctionner.

**Test:**
1. Désactivez temporairement votre bloqueur de publicités
2. Rechargez la page
3. Réessayez

### 5. Configuration Safari/iOS

Safari nécessite une configuration spéciale.

**Sur Safari:**
1. Préférences → Sites web → Notifications
2. Autorisez votre site
3. Safari peut nécessiter un certificat Apple pour les Web Push

## Diagnostic complet

### Étape 1: Vérifier l'état OneSignal

Ouvrez la console et tapez:

```javascript
// Est-ce que OneSignal est chargé?
console.log('OneSignal loaded:', typeof OneSignal !== 'undefined');

// Vérifier la configuration interne
OneSignal.Debug.setLogLevel('trace');

// Vérifier l'App ID
console.log('App ID:', 'fc7cc56d-5928-4587-add0-c9f7aed71f43');

// État de la permission
OneSignal.Notifications.permission.then(p => console.log('Permission:', p));

// État du service worker
navigator.serviceWorker.getRegistrations().then(r => console.log('SW:', r));
```

### Étape 2: Vérifier la configuration Dashboard

1. Allez sur https://dashboard.onesignal.com
2. Sélectionnez votre app: **BookingFast** (ou le nom que vous avez choisi)
3. **Settings → Platforms → Web Push**
4. Cliquez sur **"Configure"**

**Configuration requise:**

```
Site Name: BookingFast
Site URL: https://bookingfast.hevolife.fr
Auto-Prompt: [À votre choix]
Permission Prompt Type: Native Browser Prompt
Default Notification Icon URL: [Optionnel]

Advanced Settings:
☑ Auto Resubscribe: Enabled
☐ My Site Is Not Fully HTTPS: Disabled
```

### Étape 3: Tester manuellement

```javascript
// 1. Vérifier la permission actuelle
const permission = await OneSignal.Notifications.permission;
console.log('Current permission:', permission);

// 2. Si false/default, demander la permission
if (!permission) {
  await OneSignal.Notifications.requestPermission();
}

// 3. Attendre 2-3 secondes pour que le Player ID se génère
await new Promise(resolve => setTimeout(resolve, 3000));

// 4. Vérifier le Player ID
const playerId = await OneSignal.User.PushSubscription.id;
console.log('Player ID:', playerId);

// 5. Si toujours null, vérifier les erreurs
console.log('OneSignal User object:', OneSignal.User);
```

### Étape 4: Vérifier les erreurs réseau

1. Ouvrez DevTools (F12)
2. Onglet **Network**
3. Filtrez par "onesignal"
4. Rechargez la page
5. Cherchez des erreurs (rouge) ou 400/500

**Erreurs courantes:**
- `403 Forbidden` → App ID incorrect ou domaine non autorisé
- `404 Not Found` → Service worker non trouvé
- `CORS error` → Problème de configuration domaine

## Solutions par ordre de priorité

### Solution 1: Vérifier et reconfigurer le Dashboard OneSignal

C'est la cause #1 des problèmes.

1. **Dashboard OneSignal → Settings → Platforms → Web Push**
2. Cliquez **"Delete Configuration"** (en bas)
3. Recréez la configuration:
   - Choisissez **"Typical Site"**
   - Entrez votre **Site URL**: `https://bookingfast.hevolife.fr`
   - Copiez le nouvel **App ID** si changé
   - Sauvegardez

4. Mettez à jour votre `.env`:
   ```env
   VITE_ONESIGNAL_APP_ID=votre_nouvel_app_id
   ```

5. Redémarrez le serveur de dev

### Solution 2: Nettoyer le cache et Service Workers

```javascript
// Dans la console
// 1. Désenregistrer tous les service workers
const registrations = await navigator.serviceWorker.getRegistrations();
for (let registration of registrations) {
  await registration.unregister();
  console.log('Unregistered:', registration);
}

// 2. Vider le cache
localStorage.clear();
sessionStorage.clear();
await caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// 3. Recharger
location.reload();
```

### Solution 3: Tester avec leur exemple officiel

1. Allez sur https://onesignal.com/webpush
2. Testez leur exemple avec votre App ID
3. Si ça marche là-bas mais pas chez vous → problème de code
4. Si ça ne marche pas non plus → problème de configuration OneSignal

### Solution 4: Mode Debug OneSignal

Activez les logs détaillés:

```javascript
// Dans la console AVANT l'initialisation
localStorage.setItem('loglevel:OneSignalSDK', 'trace');
location.reload();
```

Vous verrez tous les logs OneSignal dans la console.

## Checklist complète

- [ ] Site en HTTPS (ou localhost)
- [ ] App ID correct dans `.env`
- [ ] Dashboard OneSignal configuré pour le bon domaine
- [ ] "Auto Resubscribe" activé sur le dashboard
- [ ] Pas de bloqueur de publicités actif
- [ ] Service Worker OneSignal chargé (DevTools → Application)
- [ ] Permission du navigateur accordée
- [ ] Aucune erreur dans la console
- [ ] Aucune erreur dans Network tab

## Test final

Si tout est OK, cette séquence doit fonctionner:

```javascript
// 1. Initialiser (si pas déjà fait)
await OneSignal.init({
  appId: 'fc7cc56d-5928-4587-add0-c9f7aed71f43',
  allowLocalhostAsSecureOrigin: true
});

// 2. Demander permission
const granted = await OneSignal.Notifications.requestPermission();
console.log('Permission granted:', granted); // true

// 3. Attendre un peu
await new Promise(resolve => setTimeout(resolve, 2000));

// 4. Obtenir Player ID
const playerId = await OneSignal.User.PushSubscription.id;
console.log('Player ID:', playerId); // UUID

// Si playerId est null ici, le problème est la configuration OneSignal Dashboard
```

## Support OneSignal

Si rien ne fonctionne:

1. **OneSignal Status**: https://status.onesignal.com/
2. **Documentation**: https://documentation.onesignal.com/docs/web-push-quickstart
3. **Support**: help@onesignal.com
4. **Community**: https://github.com/OneSignal/OneSignal-Website-SDK/issues

---

**Note importante**: 90% des problèmes de Player ID viennent d'une mauvaise configuration du **Dashboard OneSignal**. Vérifiez d'abord là-bas avant de chercher ailleurs.
