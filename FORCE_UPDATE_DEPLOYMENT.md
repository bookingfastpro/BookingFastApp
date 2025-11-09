# Guide de déploiement avec mise à jour forcée

## Vue d'ensemble

Lors de chaque déploiement Docker, l'application force automatiquement tous les utilisateurs à recharger pour obtenir la dernière version.

## Ce qui se passe automatiquement

### 1. Build Docker

```bash
docker build -t bookingfast .
```

**Actions automatiques :**
- Génération d'un timestamp unique (ex: `1762731079478`)
- Injection dans le code JavaScript (`__APP_VERSION__`)
- Création du fichier `dist/version.txt` avec ce timestamp
- Inclusion dans l'image Docker finale

### 2. Déploiement

Lorsque le nouveau conteneur démarre :
- Le fichier `version.txt` est servi par nginx
- Accessible via `https://votredomaine.com/version.txt`

### 3. Détection par les clients

#### Utilisateurs avec l'app fermée
1. Ouvrent l'application
2. Détection automatique de la nouvelle version
3. Cache nettoyé automatiquement
4. Page rechargée
5. **Application à jour** ✅

#### Utilisateurs avec l'app ouverte
1. Vérification toutes les 60 secondes
2. Détection de la nouvelle version
3. **Modale obligatoire affichée**
4. Bouton "Recharger maintenant"
5. Clic → cache nettoyé → page rechargée
6. **Application à jour** ✅

## Commandes de déploiement

### Via Coolify (Recommandé)

```bash
# Coolify gère automatiquement tout le processus
git push origin main
# → Build automatique
# → Déploiement automatique
# → Nouvelle version détectée par les clients
```

### Via Docker manuel

```bash
# 1. Build avec timestamp automatique
docker build -t bookingfast:latest .

# 2. Vérifier la version
docker run --rm bookingfast:latest cat /usr/share/nginx/html/version.txt

# 3. Déployer
docker stop bookingfast-container || true
docker rm bookingfast-container || true
docker run -d \
  --name bookingfast-container \
  -p 80:80 \
  bookingfast:latest

# 4. Vérifier que la version est accessible
curl http://localhost/version.txt
```

### Via docker-compose

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      args:
        BUILD_TIMESTAMP: ${BUILD_TIMESTAMP}
    ports:
      - "80:80"
```

```bash
# Build et déploiement
export BUILD_TIMESTAMP=$(date +%Y%m%d%H%M%S)
docker-compose up -d --build
```

## Vérification du déploiement

### 1. Vérifier la version déployée

```bash
curl https://votredomaine.com/version.txt
```

Sortie attendue : Un timestamp (ex: `1762731079478`)

### 2. Vérifier dans les logs Docker

```bash
docker logs bookingfast-container 2>&1 | grep -i version
```

Sortie attendue :
```
Building with APP_VERSION: 1762731079478
✅ Version file created: 1762731079478
Deployed version: 1762731079478
```

### 3. Vérifier dans le navigateur

1. Ouvrir la console DevTools (F12)
2. Vérifier les logs :
```
✓ Version up to date: 1762731079478
✓ Version check started (every 60s)
Server version: 1762731079478 Current version: 1762731079478
```

## Processus de mise à jour des utilisateurs

### Timeline

```
T+0s    → Déploiement nouveau container
T+0s    → Nouvelle version.txt disponible (ex: 1762731079478)
T+60s   → Premier check des clients actifs
T+60s   → Modale affichée pour clients avec ancienne version
T+120s  → Deuxième check
T+180s  → Troisième check
...
```

### Estimation du délai

- **Utilisateurs actifs** : 0-60 secondes (selon le timing du check)
- **Utilisateurs inactifs** : Rechargement automatique au prochain retour
- **Nouveaux utilisateurs** : Version correcte immédiatement

## Scénarios de test

### Test 1 : Nouveau déploiement

```bash
# 1. Noter la version actuelle
curl https://votredomaine.com/version.txt
# Résultat : 1762731000000

# 2. Déployer nouvelle version
docker build -t bookingfast:latest .
docker-compose up -d --force-recreate

# 3. Vérifier nouvelle version
curl https://votredomaine.com/version.txt
# Résultat : 1762731079478 (différent)

# 4. Ouvrir l'application dans le navigateur
# → La modale devrait apparaître dans les 60 secondes
```

### Test 2 : Utilisateur avec cache

```bash
# 1. Ouvrir l'application et l'utiliser normalement
# 2. Déployer nouvelle version
# 3. Attendre max 60 secondes
# 4. Vérifier que la modale apparaît
# 5. Cliquer sur "Recharger maintenant"
# 6. Vérifier dans la console : nouvelle version chargée
```

### Test 3 : PWA installée

```bash
# 1. Installer l'app en PWA (Add to Home Screen)
# 2. Utiliser l'app PWA
# 3. Déployer nouvelle version
# 4. La modale devrait apparaître dans les 60s
# 5. Le rechargement fonctionne aussi en PWA
```

## Résolution de problèmes

### Problème : La modale n'apparaît pas

**Vérifications :**

1. Le fichier version.txt est-il accessible ?
```bash
curl https://votredomaine.com/version.txt
```

2. La version est-elle différente ?
```bash
# Console navigateur
localStorage.getItem('app_version')
# vs
fetch('/version.txt').then(r => r.text()).then(console.log)
```

3. Le vérificateur est-il actif ?
```bash
# Console navigateur → devrait afficher toutes les 60s :
# "Server version: X Current version: Y"
```

### Problème : Erreur 404 sur version.txt

**Causes possibles :**
- Build échoué avant création du fichier
- Nginx ne sert pas les fichiers .txt

**Solution :**
```bash
# Vérifier dans le container
docker exec bookingfast-container ls -la /usr/share/nginx/html/version.txt
docker exec bookingfast-container cat /usr/share/nginx/html/version.txt
```

### Problème : Version.txt vide

**Solution :**
Vérifier que le plugin vite s'exécute :
```bash
npm run build 2>&1 | grep "Version file"
# Devrait afficher : ✅ Version file created: XXXXXXXXXX
```

## Mode développement

En développement local (`npm run dev`), le système est moins agressif :
- Pas de modale obligatoire
- Logs de debug activés
- Vérifications désactivées par défaut

## Variables d'environnement

Aucune variable nécessaire pour le système de version.
Tout est automatique via timestamps.

## Compatibilité

| Environnement | Support | Notes |
|---------------|---------|-------|
| Chrome Desktop | ✅ | Full |
| Firefox Desktop | ✅ | Full |
| Safari Desktop | ✅ | Full |
| Chrome Mobile | ✅ | Full |
| Safari iOS | ✅ | Full + PWA |
| Edge | ✅ | Full |
| PWA installée | ✅ | Toutes plateformes |

## Checklist de déploiement

- [ ] Build réussi avec `✅ Version file created: XXXXX`
- [ ] Container démarré avec succès
- [ ] `version.txt` accessible via HTTP
- [ ] Version différente de la précédente
- [ ] Test manuel : modale apparaît dans les 60s
- [ ] Test PWA : fonctionne en mode installé
- [ ] Logs navigateur : pas d'erreurs

## Rollback

En cas de problème avec une version :

```bash
# 1. Identifier la version précédente
docker images bookingfast

# 2. Redéployer l'ancienne version
docker run -d --name bookingfast-container bookingfast:TAG_PRECEDENT

# 3. Les clients rechargeront automatiquement avec l'ancienne version
```

## Support

Pour toute question sur le système de mise à jour :
1. Consulter `VERSION_UPDATE_SYSTEM.md`
2. Vérifier les logs Docker
3. Vérifier la console navigateur
