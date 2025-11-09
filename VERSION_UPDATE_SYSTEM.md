# Système de mise à jour automatique de version

## Comment ça fonctionne

L'application dispose d'un système de détection automatique de nouvelle version qui force les utilisateurs à recharger l'application après un nouveau déploiement.

## Composants

### 1. Génération de version (Build)

- **vite.config.ts** : Plugin personnalisé qui crée un fichier `version.txt` avec un timestamp unique lors du build
- **Dockerfile** : Génère automatiquement un timestamp unique pour chaque build Docker
- La version est injectée dans le code via `__APP_VERSION__`

### 2. Détection initiale (Au chargement)

**main.tsx**
```typescript
initCacheBuster().then((hasNewVersion) => {
  if (hasNewVersion) {
    // Nettoie le cache et recharge automatiquement
  }
});
```

- Compare la version stockée en localStorage avec la version actuelle
- Si différente : nettoie le cache automatiquement et recharge
- Transparent pour l'utilisateur au premier chargement

### 3. Détection en temps réel (Application en cours d'exécution)

**App.tsx**
```typescript
CacheBuster.startVersionCheck(() => {
  setShowUpdateModal(true);
});
```

- Vérifie toutes les 60 secondes si une nouvelle version est disponible
- Requête HTTP vers `/version.txt` avec cache désactivé
- Si nouvelle version détectée : affiche la modale de mise à jour

### 4. Modale de mise à jour

**UpdateModal.tsx**

- Modale OBLIGATOIRE (pas de bouton fermer)
- Affichage centré avec overlay noir
- Bouton unique : "Recharger maintenant"
- Nettoyage complet du cache avant rechargement

## Workflow complet

### Scénario 1 : Premier chargement après déploiement

1. Utilisateur charge l'application
2. `initCacheBuster()` détecte une version différente
3. Cache automatiquement nettoyé
4. Page rechargée automatiquement
5. Version mise à jour en localStorage

### Scénario 2 : Application déjà ouverte pendant un nouveau déploiement

1. Application tourne, version vérifiée toutes les 60s
2. Nouveau déploiement effectué avec nouvelle version
3. Vérification détecte la nouvelle version sur le serveur
4. Modale obligatoire affichée
5. Utilisateur clique sur "Recharger maintenant"
6. Cache nettoyé et page rechargée
7. Version mise à jour

## Actions lors du rechargement

```typescript
static async forceReload(): Promise<void> {
  // 1. Nettoyer tous les caches navigateur
  await this.clearAllCaches();

  // 2. Mettre à jour la version en localStorage
  localStorage.setItem(this.STORAGE_KEY, this.VERSION);

  // 3. Recharger la page
  window.location.reload();
}
```

### Nettoyage du cache inclut :

- Cache API du navigateur (`caches.delete()`)
- Service Workers désinscrits (`registration.unregister()`)
- localStorage nettoyé pour la version

## PWA et applications mobiles

Le système fonctionne également pour :

- Applications PWA installées
- Applications dans le navigateur mobile
- Applications dans Safari iOS
- Applications dans Chrome Android

## Configuration

### Intervalle de vérification

Par défaut : 60 secondes (60000ms)

Modifiable dans `cacheBuster.ts` :
```typescript
private static readonly CHECK_INTERVAL = 60000; // en millisecondes
```

### Désactiver les vérifications

Pour désactiver temporairement :
```typescript
CacheBuster.stopVersionCheck();
```

## Logs de débogage

Console browser :
- ✅ Version actuelle chargée
- 🔄 Nouvelle version détectée
- 🗑️ Suppression des caches
- 🆕 Nouvelle version serveur disponible

## Build et déploiement

### Build local
```bash
npm run build
# Génère automatiquement version.txt avec timestamp
```

### Build Docker
```bash
docker build -t bookingfast .
# Le Dockerfile génère automatiquement la version
```

### Coolify / Production
Le système s'active automatiquement à chaque déploiement car :
1. Chaque build génère un nouveau timestamp
2. Le fichier `version.txt` est inclus dans le build
3. Les utilisateurs reçoivent la modale dès la détection

## Tests

Pour tester localement :

1. Build l'application : `npm run build`
2. Note la version dans `dist/version.txt`
3. Lance l'application
4. Modifie manuellement `dist/version.txt`
5. Attends 60 secondes ou force la vérification
6. La modale devrait apparaître

## Compatibilité

- ✅ Chrome / Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile iOS Safari
- ✅ Mobile Chrome Android
- ✅ PWA installées
- ✅ Mode développement (désactivé)
- ✅ Mode production

## Notes importantes

1. **Pas de bypass possible** : La modale n'a pas de bouton fermer
2. **Cache complet nettoyé** : Garantit l'utilisation de la nouvelle version
3. **Tolérance aux erreurs** : Si le fichier version.txt n'est pas accessible, l'app continue de fonctionner
4. **Production uniquement** : En dev, le système est moins strict pour faciliter le développement
