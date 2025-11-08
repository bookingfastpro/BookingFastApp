# Cache Busting - Déploiement Docker

## Stratégie Automatique de Vidage de Cache

Le projet est configuré pour **vider automatiquement le cache** à chaque redéploiement Docker. Voici comment ça fonctionne :

---

## 🎯 Mécanismes de Cache Busting

### 1. **Dockerfile - ARG CACHEBUST**
```dockerfile
ARG CACHEBUST=1
```
- Ajout d'un argument `CACHEBUST` qui change à chaque build
- Passez un timestamp pour forcer un nouveau build : `--build-arg CACHEBUST=$(date +%s)`

### 2. **Nginx - Headers No-Cache**
```nginx
# Pas de cache pour JS et CSS
location ~* \.(js|css)$ {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```
- Force le navigateur à télécharger les nouveaux fichiers JS/CSS
- Pas de cache sur `index.html`

### 3. **Service Worker - Version Dynamique**
```javascript
const CACHE_VERSION = `v${Date.now()}`;
```
- Chaque déploiement crée une nouvelle version de cache
- Suppression automatique des anciens caches

### 4. **HTML - Force Update**
```javascript
// Force la mise à jour du Service Worker
await registration.update();
// Vide les anciens caches
await caches.delete(oldCacheName);
```

---

## 📦 Déploiement avec Coolify

### Option 1 : Build Args Automatique
Dans Coolify, ajoutez dans **Build Args** :
```bash
CACHEBUST=${CI_COMMIT_SHA:-$(date +%s)}
```

### Option 2 : Script de Déploiement
```bash
#!/bin/bash
docker build \
  --build-arg CACHEBUST=$(date +%s) \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  -t bookingfast:latest .
```

---

## 🔄 Vérification du Cache

### Côté Navigateur
1. Ouvrir DevTools (F12)
2. Onglet **Console**
3. Vérifier les logs :
   - `🔄 Service Worker mis à jour`
   - `🗑️ Suppression ancien cache: bookingfast-v1234567890`

### Côté Serveur
```bash
# Vérifier les headers nginx
curl -I https://votre-domaine.com/assets/index-ABC123.js
```

Devrait retourner :
```
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
```

---

## ⚠️ Important

### Pour les Utilisateurs Existants
Après un déploiement, les utilisateurs doivent :
1. **Sur navigateur mobile** : Rafraîchir la page (tirer vers le bas)
2. **Sur PWA** : Fermer complètement l'app et la rouvrir

### Cache Persistant
Si le cache persiste malgré tout :
```javascript
// Dans la console navigateur
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

---

## 🧪 Test du Cache Busting

### 1. Avant Déploiement
```bash
# Noter la version actuelle
curl https://votre-domaine.com/ | grep "assets/index-"
# Exemple: assets/index-ABC123.js
```

### 2. Après Déploiement
```bash
# Vérifier nouvelle version
curl https://votre-domaine.com/ | grep "assets/index-"
# Exemple: assets/index-XYZ789.js (différent)
```

### 3. Service Worker
```javascript
// Console navigateur
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Active SW:', regs[0]?.active?.scriptURL);
});
```

---

## 📝 Notes Techniques

### Vite Build Hash
Vite génère automatiquement des hashes uniques pour chaque build :
- `index-ABC123.js` → `index-XYZ789.js`
- Change à chaque modification du code

### Service Worker Lifecycle
1. **Install** : Nouveau SW téléchargé
2. **Activate** : Suppression des anciens caches
3. **Claim** : Prise de contrôle immédiate

### Nginx Cache
- **JS/CSS** : No-cache (toujours fetch réseau)
- **Images** : Cache 7 jours
- **HTML** : No-cache

---

## 🚀 Commandes Utiles

### Forcer un rebuild complet
```bash
docker build --no-cache \
  --build-arg CACHEBUST=$(date +%s) \
  -t bookingfast:latest .
```

### Vider le cache Docker local
```bash
docker system prune -a
docker builder prune -a
```

### Tester localement
```bash
npm run build
npm run preview
# Ouvrir http://localhost:4173
```

---

## ✅ Checklist Déploiement

- [ ] Variable `CACHEBUST=$(date +%s)` configurée
- [ ] Headers nginx no-cache vérifiés
- [ ] Service Worker version dynamique activée
- [ ] Build Vite avec nouveaux hashes
- [ ] Test sur navigateur mobile
- [ ] Test sur PWA installée
- [ ] Logs console vérifiés
- [ ] Cache ancien supprimé

---

## 🆘 Dépannage

### Cache ne se vide pas
1. Vérifier les headers nginx : `curl -I https://votre-domaine.com/assets/index-*.js`
2. Forcer refresh : Ctrl+Shift+R (desktop) ou tirer vers le bas (mobile)
3. Vider manuellement : DevTools → Application → Clear storage

### Service Worker bloqué
```javascript
// Désinscrire tous les SW
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

### PWA pas à jour
1. Fermer complètement l'app
2. Supprimer l'app du téléphone
3. Réinstaller depuis le navigateur
