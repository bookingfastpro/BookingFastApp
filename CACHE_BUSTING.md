# Système de Cache Busting Automatique

Ce projet intègre un système de cache busting automatique qui vide tous les caches à chaque nouveau déploiement.

## Comment ça fonctionne

### 1. Build avec version unique
Chaque build génère un timestamp unique (`VITE_APP_VERSION`) qui est intégré dans :
- Les noms des fichiers JS/CSS générés
- Une variable globale accessible dans l'application
- Un fichier `version.txt` dans le build final

### 2. Détection côté client
Au démarrage de l'application :
- Le système compare la version actuelle avec la version stockée en localStorage
- Si la version a changé, tous les caches sont vidés automatiquement
- La nouvelle version est enregistrée

### 3. Nettoyage des caches
Le système vide :
- Cache API (tous les caches nommés)
- Service Workers (désenregistrement)
- Les anciennes références en localStorage

## Utilisation

### Build Docker avec cache busting
```bash
./docker-build.sh
```

Ce script génère automatiquement un timestamp unique et le passe au build Docker.

### Build Docker manuel
```bash
docker build \
  --build-arg BUILD_TIMESTAMP=$(date +%Y%m%d%H%M%S) \
  --build-arg VITE_APP_VERSION=$(date +%Y%m%d%H%M%S) \
  -t bookingfast:latest \
  .
```

### Build local (dev)
```bash
npm run build
```

Un timestamp sera généré automatiquement si `VITE_APP_VERSION` n'est pas défini.

## Vérification

### Voir la version actuelle
Ouvrez la console du navigateur et tapez :
```javascript
localStorage.getItem('app_version')
```

### Forcer un vidage de cache
Dans la console du navigateur :
```javascript
import('./utils/cacheBuster.js').then(m => m.CacheBuster.forceReload())
```

### Voir le fichier version
Accédez à : `https://votre-domaine.com/version.txt`

## Configuration

### Variables d'environnement
- `VITE_APP_VERSION` : Version de l'application (timestamp par défaut)
- `BUILD_TIMESTAMP` : Timestamp du build (utilisé pour générer `VITE_APP_VERSION`)

### Fichiers impliqués
- `Dockerfile` : Génération et injection de la version
- `vite.config.ts` : Configuration du cache busting dans les noms de fichiers
- `src/utils/cacheBuster.ts` : Logique de détection et nettoyage
- `src/main.tsx` : Initialisation au démarrage
- `nginx.conf` : Headers de cache pour nginx

## Avantages

1. **Automatique** : Aucune intervention manuelle nécessaire
2. **Fiable** : Garantit que les utilisateurs obtiennent toujours la dernière version
3. **Transparent** : Fonctionne sans intervention de l'utilisateur
4. **Tracable** : Chaque version est identifiable via son timestamp

## Logs

Le système affiche des logs dans la console :
- `✓ Version up to date` : Aucun changement détecté
- `🔄 New version detected` : Nouvelle version détectée, nettoyage en cours
- `✅ Cache cleared` : Nettoyage terminé avec succès
- `🗑️ Deleting cache` : Suppression d'un cache spécifique
