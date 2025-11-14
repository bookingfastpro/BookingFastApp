# Test du Mode Maintenance

## 🧪 Guide de test rapide

Ce guide vous permet de tester le système de détection de maintenance.

## Test 1 : Simulation avec DevTools (Recommandé)

### Étapes

1. **Ouvrir l'application dans le navigateur**
   ```
   https://votre-domaine.com
   ```

2. **Ouvrir DevTools**
   - Windows/Linux : `F12` ou `Ctrl + Shift + I`
   - Mac : `Cmd + Option + I`

3. **Aller dans l'onglet Network**

4. **Activer le mode Offline**
   - Cliquer sur le menu déroulant "Online"
   - Sélectionner "Offline"

5. **Observer le comportement**
   - Attendre ~20 secondes (2 échecs consécutifs)
   - Le modal "Maintenance en cours" devrait apparaître
   - Compteur de temps commence à 0s et augmente

6. **Tester la reconnexion**
   - Remettre "Online" dans DevTools
   - Attendre max 10 secondes
   - Le modal devrait disparaître automatiquement

### Résultat attendu

```
✅ Modal apparaît après ~20 secondes offline
✅ Compteur de temps fonctionne
✅ Animation de reconnexion visible
✅ Modal disparaît automatiquement après reconnexion
```

## Test 2 : Simulation avec Slow 3G

### Étapes

1. **DevTools → Network**

2. **Sélectionner "Slow 3G"** dans le throttling

3. **Observer**
   - ❌ Le modal **NE DEVRAIT PAS** apparaître
   - Pourquoi ? La connexion est lente mais fonctionne
   - Protection contre les faux positifs

### Résultat attendu

```
✅ Pas de modal (connexion lente mais active)
✅ Application continue de fonctionner
```

## Test 3 : Console Logs

### Vérifier les logs

Dans la console DevTools, vous devriez voir :

**Connexion normale :**
```javascript
// Rien de spécial (connexion OK)
```

**Perte de connexion :**
```javascript
❌ Database check failed: Error
❌ Database connection lost (confirmed after 2 failures)
```

**Reconnexion :**
```javascript
✅ Database connection restored
```

## Test 4 : Test manuel du hook

### Dans la console DevTools

```javascript
// Forcer une vérification
// Note: Cette fonction n'est pas exposée par défaut
// Vous devrez ajouter temporairement un console.log dans le hook
```

## Test 5 : Test avec arrêt de Supabase (Développement local)

### Si vous utilisez Supabase local

```bash
# Terminal 1 : Arrêter Supabase
cd supabase
docker-compose down

# Attendre 20 secondes
# Le modal devrait apparaître

# Terminal 1 : Redémarrer Supabase
docker-compose up -d

# Attendre max 10 secondes
# Le modal devrait disparaître
```

## 🎯 Scénarios de test

### Scénario 1 : Déploiement rapide (30 secondes)

```
Temps    Action                    Résultat
----------------------------------------------
0:00     Deployment commence       App normale
0:05     Database down             App normale (1er échec)
0:15     Database still down       Modal apparaît (2e échec)
0:30     Database back up          Modal disparaît
```

### Scénario 2 : Maintenance longue (5 minutes)

```
Temps    Action                    Résultat
----------------------------------------------
0:00     Maintenance commence      App normale
0:20     Database down             Modal apparaît
1:00     Still down                Compteur: 40s
2:00     Still down                Compteur: 1m 40s
5:00     Maintenance terminée      Modal disparaît
```

### Scénario 3 : Problème réseau temporaire

```
Temps    Action                    Résultat
----------------------------------------------
0:00     Network glitch            1er échec
0:08     Network restored          Compteur reset
0:10     Next check                Succès, pas de modal
```

## 📊 Checklist de validation

Après vos tests, vérifiez :

- [ ] Modal apparaît après 2 échecs consécutifs (~20s)
- [ ] Compteur de temps fonctionne correctement
- [ ] Animation de reconnexion visible et fluide
- [ ] Modal disparaît automatiquement après reconnexion
- [ ] Pas de faux positifs (connexion lente)
- [ ] Logs corrects dans la console
- [ ] Message clair et rassurant pour l'utilisateur
- [ ] État "Reconnexion en cours" visible pendant les checks

## 🔍 Débogage

### Le modal ne s'affiche pas

1. **Vérifier la console** : Y a-t-il des erreurs ?
2. **Vérifier les échecs** : Au moins 2 échecs consécutifs ?
3. **Vérifier le timeout** : 5 secondes suffisent ?

### Le modal s'affiche trop vite

1. **Augmenter le seuil** : Passer de 2 à 3 échecs
2. **Augmenter l'intervalle** : Passer de 10s à 15s

### Le modal ne disparaît pas

1. **Vérifier la reconnexion** : La DB est-elle vraiment up ?
2. **Vérifier les logs** : Y a-t-il un message "restored" ?
3. **Forcer un refresh** : Parfois nécessaire après un long downtime

## 🚀 Test de production

### Avant de déployer en production

```bash
# 1. Build
npm run build

# 2. Test local du build
npm run preview

# 3. Tester avec DevTools offline
# 4. Vérifier les logs
# 5. Valider le comportement

# 6. Déployer
./docker-build.sh
```

## 💡 Astuces

1. **Testez régulièrement** : Après chaque déploiement majeur
2. **Documentez les incidents** : Notez les comportements inhabituels
3. **Ajustez les seuils** : Selon votre infrastructure
4. **Communiquez** : Prévenez les utilisateurs des maintenances planifiées

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez `MAINTENANCE_MODE.md` pour la documentation complète
2. Consultez les logs de la console DevTools
3. Testez avec les scénarios ci-dessus
4. Vérifiez la configuration dans `useDatabaseStatus.ts`
