# Système de Détection de Maintenance

## 🎯 Objectif

Détecter automatiquement les pertes de connexion à la base de données et afficher un message de maintenance aux utilisateurs.

## 🔍 Comment ça fonctionne

### 1. Détection de connexion

Le système vérifie la connexion à la base de données :
- **Première vérification** : 1 seconde après le chargement
- **Vérifications périodiques** : Toutes les 10 secondes
- **Timeout** : 5 secondes max par requête

### 2. Protection contre les faux positifs

Pour éviter d'afficher le message à cause d'un problème réseau temporaire :
- Nécessite **2 échecs consécutifs** pour marquer comme déconnecté
- Compteur de failures réinitialisé dès qu'une connexion réussit

### 3. Interface utilisateur

**Modal de maintenance affiché quand :**
- Connexion à la base de données perdue
- Déploiement en cours
- Maintenance planifiée

**Le modal affiche :**
- ⏱️ Compteur de temps (combien de temps déconnecté)
- 🔄 Animation de reconnexion
- 📊 Barre de progression indéterminée
- 💬 Message rassurant pour l'utilisateur

### 4. Reconnexion automatique

Dès que la connexion est rétablie :
- Le compteur de failures est remis à 0
- Le modal disparaît automatiquement
- L'utilisateur peut continuer à utiliser l'application

## 🎨 États du modal

### État 1 : Maintenance en cours
```
⚠️ Une mise à jour de maintenance est en cours
Déconnecté depuis: 1m 23s
```

### État 2 : Reconnexion
```
🔄 Tentative de reconnexion à la base de données...
Déconnecté depuis: 45s
```

### État 3 : Connexion rétablie
```
✅ Modal disparaît automatiquement
```

## 🚀 Cas d'usage

### Scénario 1 : Déploiement Docker

1. Vous déployez une nouvelle version
2. La base de données est temporairement indisponible (redémarrage)
3. Les utilisateurs voient : "Maintenance en cours"
4. Après 30-60 secondes, connexion rétablie
5. Modal disparaît automatiquement

### Scénario 2 : Maintenance Supabase

1. Supabase effectue une maintenance
2. Connexion perdue détectée après 2 échecs (20 secondes)
3. Modal affiché aux utilisateurs
4. Maintenance terminée → reconnexion
5. Modal disparaît

### Scénario 3 : Problème réseau temporaire

1. Utilisateur perd brièvement le réseau
2. Premier échec détecté
3. **Pas de modal** (besoin de 2 échecs)
4. Connexion revient avant le 2ème check
5. Compteur de failures réinitialisé → pas de modal

## ⚙️ Configuration

### Modifier l'intervalle de vérification

Dans `src/hooks/useDatabaseStatus.ts` :

```typescript
// Vérification toutes les 10 secondes (par défaut)
const interval = setInterval(() => {
  checkDatabaseConnection();
}, 10000); // Changez cette valeur
```

### Modifier le seuil de déconnexion

```typescript
// Nécessite 2 échecs consécutifs (par défaut)
if (newFailureCount >= 2) {
  setIsConnected(false);
}
```

### Modifier le timeout de requête

```typescript
// Timeout de 5 secondes (par défaut)
setTimeout(() => reject(new Error('Timeout')), 5000);
```

## 🧪 Tests

### Test manuel : Simuler une perte de connexion

**Option 1 : DevTools**
```
1. Ouvrir DevTools (F12)
2. Onglet Network
3. Activer "Offline"
4. Attendre 20 secondes
5. Modal devrait apparaître
6. Désactiver "Offline"
7. Modal devrait disparaître en <10s
```

**Option 2 : Arrêter Supabase (local)**
```bash
# Si vous utilisez Supabase local
docker-compose down
# Attendre 20 secondes → modal apparaît
docker-compose up -d
# Modal disparaît en <10s
```

### Test automatisé

```typescript
// Dans votre console navigateur
const dbStatus = useDatabaseStatus();

// Forcer une vérification
dbStatus.checkConnection();

// Observer l'état
console.log('Connected:', dbStatus.isConnected);
console.log('Last check:', dbStatus.lastCheck);
```

## 📊 Logs de débogage

Le système affiche des logs dans la console :

```
✅ Database connection restored
❌ Database connection lost (confirmed after 2 failures)
🌐 Browser back online, checking database...
🔌 Browser offline
```

## 🔧 Désactiver le système

Si vous voulez désactiver la détection :

Dans `src/App.tsx` :
```typescript
// Commenter ces lignes
// const { isConnected, isChecking } = useDatabaseStatus();
// <MaintenanceModal isOpen={!isConnected} isReconnecting={isChecking} />
```

## ⚡ Performance

Impact minimal sur les performances :
- Requête légère (select id limit 1)
- Seulement toutes les 10 secondes
- Timeout de 5 secondes maximum
- Pas d'impact sur l'UI (asynchrone)

## 🎯 Bonnes pratiques

1. **Ne pas afficher le modal trop rapidement** : 2 échecs consécutifs évitent les faux positifs
2. **Message rassurant** : Expliquer que c'est temporaire et automatique
3. **Compteur visible** : Montre que le système fonctionne
4. **Reconnexion automatique** : Pas d'action requise de l'utilisateur
5. **Logs clairs** : Facilite le débogage

## 🚨 Dépannage

### Le modal ne s'affiche pas lors d'une vraie déconnexion

- Vérifiez que `useDatabaseStatus()` est bien appelé dans App.tsx
- Ouvrez la console et vérifiez les logs
- Le modal nécessite 2 échecs (20 secondes)

### Le modal s'affiche trop souvent

- Augmentez le seuil de déconnexion (de 2 à 3 échecs)
- Augmentez le timeout des requêtes (de 5s à 10s)

### Le modal ne disparaît pas après reconnexion

- Vérifiez que les vérifications périodiques fonctionnent
- Ouvrez la console et vérifiez les logs
- Forcez une vérification manuellement

## ✅ Checklist de validation

- [ ] Modal s'affiche après perte de connexion
- [ ] Modal montre le compteur de temps
- [ ] Animation de reconnexion fonctionne
- [ ] Modal disparaît automatiquement après reconnexion
- [ ] Pas de faux positifs sur connexion lente
- [ ] Logs clairs dans la console
- [ ] Fonctionne en mode offline
- [ ] Fonctionne lors d'un redémarrage de Supabase
