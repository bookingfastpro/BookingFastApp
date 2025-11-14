# Système de Versionnement Automatique

Ce document explique comment le système de versionnement automatique fonctionne pour notifier les utilisateurs lors de nouveaux déploiements.

## 🎯 Objectif

À chaque déploiement Docker, les utilisateurs connectés doivent voir une notification "Nouvelle version disponible" pour recharger l'application et vider le cache.

## ⚙️ Comment ça fonctionne

### 1. Build Docker (Dockerfile)

Le `Dockerfile` génère automatiquement un timestamp UNIX unique à chaque build :

```bash
BUILD_TIME=$(date +%s)
export VITE_APP_VERSION=$BUILD_TIME
```

Ce timestamp est :
- Unique à chaque build (secondes depuis epoch)
- Intégré dans tous les fichiers JS/CSS via Vite
- Écrit dans `/dist/version.txt`

### 2. Script de build (docker-build.sh)

Le script `docker-build.sh` force un build complet :

```bash
./docker-build.sh
```

Options importantes :
- `--no-cache` : Force la reconstruction complète
- Génère un timestamp unique
- Crée deux tags : `latest` et `$BUILD_VERSION`

### 3. Détection côté client

L'application vérifie automatiquement :

**Au démarrage :**
- Après 2 secondes, vérifie `/version.txt`
- Compare avec la version actuelle

**Périodiquement :**
- Toutes les 60 secondes
- Vérifie `/version.txt` avec cache-busting (`?t=timestamp`)

**Configuration nginx :**
```nginx
location = /version.txt {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    add_header Content-Type "text/plain";
}
```

### 4. Notification utilisateur

Quand une nouvelle version est détectée :
1. Modal "Nouvelle version disponible" s'affiche
2. Bouton "Recharger maintenant"
3. Au clic :
   - Vide tous les caches (Service Workers, Cache API, localStorage)
   - Recharge la page
   - Applique la nouvelle version

## 🚀 Déploiement

### Option 1 : Script automatique (recommandé)

```bash
./docker-build.sh
```

### Option 2 : Build manuel

```bash
docker build --no-cache -t bookingfast:latest .
```

### Option 3 : Via Coolify/CI-CD

Assurez-vous que votre pipeline :
- Ne réutilise PAS les anciennes images
- Force un rebuild complet
- N'utilise PAS de cache Docker persistant entre builds

**Exemple Coolify :**
1. Dans les paramètres du projet
2. Activez "Rebuild without cache" ou équivalent
3. Le système générera automatiquement un nouveau timestamp

## 🔍 Vérification

### Vérifier la version du build

```bash
# Dans le container
cat /usr/share/nginx/html/version.txt

# Depuis l'extérieur
curl https://votre-domaine.com/version.txt
```

### Logs de vérification

Ouvrez la console du navigateur :
```
✅ Version check started (immediate + every 60s)
🔍 Version check: {server: "1731609123", current: "1731608000", different: true}
🆕 New server version detected!
```

## 📋 Checklist de déploiement

- [ ] Build avec `./docker-build.sh` ou `--no-cache`
- [ ] Version unique générée (timestamp UNIX)
- [ ] `version.txt` créé dans `/dist`
- [ ] Container déployé avec nouvelle version
- [ ] Accessible via `/version.txt`
- [ ] Pas de cache nginx sur `/version.txt`

## ⚠️ Troubleshooting

### Les utilisateurs ne voient pas la notification

**Problème 1 : Cache Docker**
```bash
# Solution : Build sans cache
docker build --no-cache -t bookingfast:latest .
```

**Problème 2 : Même version**
```bash
# Vérifier que la version change
curl https://votre-domaine.com/version.txt
# Doit retourner un timestamp différent à chaque build
```

**Problème 3 : Cache nginx**
```bash
# Vérifier la config nginx
docker exec <container> cat /etc/nginx/conf.d/default.conf
# Doit contenir "no-cache" pour /version.txt
```

**Problème 4 : Service Worker bloque**
```javascript
// Dans la console du navigateur
await caches.keys()
await Promise.all(caches.keys().map(k => caches.delete(k)))
location.reload()
```

## 🔄 Flux complet

```
1. Nouveau code push
   ↓
2. Build Docker avec timestamp unique
   ↓
3. Container déployé avec nouvelle version
   ↓
4. Utilisateurs actifs : vérification auto après 2s
   ↓
5. Détection : version.txt ≠ version locale
   ↓
6. Modal "Nouvelle version" affiché
   ↓
7. Clic "Recharger" → Cache vidé → Reload
   ↓
8. Nouvelle version chargée ✅
```

## 📝 Notes importantes

1. **Timestamp UNIX** : Plus fiable que date formatée (pas de problèmes de timezone)
2. **Vérification immédiate** : Détecte les mises à jour même sans attendre 60s
3. **Cache-busting** : Tous les assets ont le timestamp dans leur nom
4. **Nginx optimisé** : Assets cachés 1 an, index.html jamais caché

## 🔧 Configuration avancée

### Modifier l'intervalle de vérification

Dans `src/utils/cacheBuster.ts` :
```typescript
private static readonly CHECK_INTERVAL = 60000; // 60s par défaut
```

### Désactiver la vérification auto

Dans `src/App.tsx` :
```typescript
// Commenter ces lignes
// useEffect(() => {
//   CacheBuster.startVersionCheck(() => {
//     setShowUpdateModal(true);
//   });
// }, []);
```

## ✅ Validation finale

Après déploiement, testez :

1. Ouvrez l'application
2. Déployez une nouvelle version
3. Attendez 2 secondes (ou max 60s)
4. La modal doit apparaître automatiquement
5. Cliquez "Recharger maintenant"
6. Vérifiez que la nouvelle version est chargée

**Console attendue :**
```
✅ Version check started (immediate + every 60s)
🔍 Version check: {server: "1731609999", current: "1731609123", different: true}
🆕 New server version detected!
🚨 New version detected on startup!
```
