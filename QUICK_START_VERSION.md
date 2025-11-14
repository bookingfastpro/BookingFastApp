# Guide Rapide - Système de Versionnement Automatique

## 🎯 Résumé

Chaque déploiement Docker génère maintenant une version unique. Les utilisateurs voient automatiquement une notification pour recharger l'application.

## 🚀 Déploiement

### Méthode 1 : Script automatique (recommandé)
```bash
./docker-build.sh
```

### Méthode 2 : Docker manuel
```bash
docker build --no-cache -t bookingfast:latest .
```

### Méthode 3 : Via Coolify
✅ Fonctionne automatiquement - activez "Rebuild without cache"

## ✨ Ce qui se passe

1. **Build** : Timestamp unique généré (ex: `1763118492939`)
2. **Fichier version.txt** : Créé dans `/dist` et accessible via `/version.txt`
3. **Assets versionnés** : Tous les JS/CSS contiennent le timestamp
4. **Détection client** :
   - Après 2 secondes au démarrage
   - Toutes les 60 secondes ensuite
5. **Notification** : Modal "Nouvelle version disponible"
6. **Action** : Bouton "Recharger maintenant" vide le cache

## 🔍 Vérification

```bash
# Tester le système
./test-version-system.sh

# Vérifier la version déployée
curl https://votre-domaine.com/version.txt

# Logs console (F12)
✅ Version check started (immediate + every 60s)
🔍 Version check: {...}
🆕 New server version detected!
```

## 📚 Documentation complète

Voir `AUTO_VERSION_DEPLOYMENT.md` pour tous les détails.

## ⚠️ Important

- Chaque build Docker doit être sans cache (`--no-cache`)
- Le fichier `version.txt` est servi sans cache par nginx
- La notification apparaît automatiquement aux utilisateurs
- Le système fonctionne même si l'utilisateur garde l'onglet ouvert pendant des jours
