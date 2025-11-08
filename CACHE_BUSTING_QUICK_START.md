# Cache Busting - Guide Rapide

## Ce qui a été ajouté

Un système automatique qui vide tous les caches (navigateur, service workers, localStorage) à chaque nouveau déploiement.

## Comment ça marche

1. **À chaque build**, un timestamp unique est généré et intégré dans tous les noms de fichiers
2. **Au démarrage de l'app**, le système détecte si la version a changé
3. **Si nouvelle version**, tous les caches sont automatiquement vidés
4. **L'utilisateur** obtient toujours la dernière version sans action manuelle

## Utilisation

### Build local
```bash
npm run build
```

### Build avec script
```bash
./build.sh
```

### Build Docker
```bash
./docker-build.sh
```

### Déploiement Coolify
```bash
./coolify-deploy.sh
```

## Test

```bash
./test-cache-busting.sh
```

## Fichiers modifiés

- ✅ `Dockerfile` - Génération de version unique
- ✅ `vite.config.ts` - Injection de version dans les fichiers
- ✅ `nginx.conf` - Headers de cache
- ✅ `src/main.tsx` - Initialisation du cache buster
- ✅ `src/utils/cacheBuster.ts` - Logique de détection et nettoyage
- ✅ `build.sh` - Génération de timestamp
- ✅ `coolify-deploy.sh` - Génération de timestamp
- ✅ `docker-build.sh` - Script Docker avec cache busting

## Vérification

Après déploiement, ouvrez la console du navigateur :
- Vous verrez : `✓ Version up to date: [timestamp]` ou
- `🔄 New version detected: [timestamp]` suivi de `✅ Cache cleared`

## Documentation complète

Voir `CACHE_BUSTING.md` pour plus de détails.
