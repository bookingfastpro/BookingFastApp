# 🧪 Guide de Test - Synchronisation Temps Réel

## Test Rapide (5 minutes)

### Prérequis
- 2 appareils (ordinateur + téléphone, ou 2 navigateurs différents)
- 1 compte utilisateur BookingFast

### Étapes de Test

#### 1️⃣ Configuration Initiale

**Appareil A (Principal):**
```
1. Ouvrir BookingFast
2. Se connecter avec votre compte
3. Naviguer vers Calendrier
4. Ouvrir la Console (F12 > Console)
```

**Appareil B (Secondaire):**
```
1. Ouvrir BookingFast (même compte)
2. Se connecter
3. Naviguer vers Calendrier
4. Ouvrir la Console (F12 > Console)
```

**✅ Vérification Console :**
```
📡 Realtime subscription status: SUBSCRIBED
```

---

#### 2️⃣ Test Création de Réservation

**Sur Appareil A :**
```
1. Sélectionner une date dans le calendrier
2. Cliquer sur un créneau horaire
3. Remplir le formulaire de réservation
4. Cliquer sur "Créer la réservation"
```

**Sur Appareil B :**
```
✅ Observer : La réservation apparaît automatiquement
⏱️ Temps attendu : < 1 seconde
🔍 Console : "🔄 Realtime event received: INSERT"
```

**Résultat Attendu :**
- ✅ La réservation apparaît sur l'appareil B
- ✅ Au bon créneau horaire
- ✅ Avec toutes les informations correctes
- ✅ Sans rechargement de page

---

#### 3️⃣ Test Modification de Réservation

**Sur Appareil A :**
```
1. Cliquer sur la réservation créée
2. Modifier l'heure ou les informations
3. Cliquer sur "Enregistrer"
```

**Sur Appareil B :**
```
✅ Observer : La réservation se met à jour automatiquement
⏱️ Temps attendu : < 1 seconde
🔍 Console : "🔄 Realtime event received: UPDATE"
```

**Résultat Attendu :**
- ✅ La réservation est mise à jour sur l'appareil B
- ✅ Les modifications sont visibles (changement d'heure, etc.)
- ✅ Pas de duplication
- ✅ Pas de rechargement de page

---

#### 4️⃣ Test Suppression de Réservation

**Sur Appareil A :**
```
1. Cliquer sur la réservation
2. Cliquer sur "Supprimer"
3. Confirmer la suppression
```

**Sur Appareil B :**
```
✅ Observer : La réservation disparaît automatiquement
⏱️ Temps attendu : < 1 seconde
🔍 Console : "🔄 Realtime event received: DELETE"
```

**Résultat Attendu :**
- ✅ La réservation disparaît de l'appareil B
- ✅ Pas de rechargement de page
- ✅ Le calendrier reste stable

---

#### 5️⃣ Test Indisponibilités

**Sur Appareil A :**
```
1. Cliquer sur "Ajouter une indisponibilité"
2. Sélectionner date et horaires
3. Cliquer sur "Enregistrer"
```

**Sur Appareil B :**
```
✅ Observer : L'indisponibilité apparaît automatiquement
⏱️ Temps attendu : < 1 seconde
🔍 Console : "🔄 Realtime unavailability event: INSERT"
```

---

#### 6️⃣ Test Persistance de la Date Sélectionnée

**Sur Appareil A :**
```
1. Sélectionner une date spécifique (ex: 15 du mois)
2. Créer une réservation
3. ✅ Vérifier : La date reste sélectionnée sur le 15
4. Créer une autre réservation
5. ✅ Vérifier : La date reste toujours sur le 15
```

**Résultat Attendu :**
- ✅ La date ne revient pas à "aujourd'hui"
- ✅ Vous pouvez créer plusieurs réservations de suite
- ✅ La date change uniquement quand vous en sélectionnez une autre

---

## 🐛 Problèmes Courants

### Problème : Rien ne se synchronise

**Diagnostic :**
```javascript
// Dans la Console
1. Vérifier : "📡 Realtime subscription status: SUBSCRIBED"
2. Si absent, vérifier les erreurs réseau
3. Vérifier la connexion Internet
```

**Solution :**
```
1. Rafraîchir la page (F5)
2. Vérifier que vous êtes connecté
3. Vérifier que Supabase est accessible
```

---

### Problème : Duplications de données

**Diagnostic :**
```javascript
// Vous voyez 2 fois la même réservation
```

**Solution :**
```
1. Rafraîchir la page (F5)
2. Si le problème persiste, vérifier la console pour erreurs
3. Le système a une protection anti-duplication normalement
```

---

### Problème : Latence élevée (> 3 secondes)

**Diagnostic :**
```javascript
// La synchronisation prend plus de 3 secondes
```

**Causes possibles :**
```
1. Connexion Internet lente
2. Charge serveur élevée
3. Problème réseau
```

**Solution :**
```
1. Vérifier votre connexion Internet
2. Réessayer dans quelques minutes
3. Contacter le support si persistant
```

---

## ✅ Checklist de Validation

### Fonctionnement Attendu

- [ ] La console affiche "📡 Realtime subscription status: SUBSCRIBED"
- [ ] Création de réservation : synchronisée en < 1 seconde
- [ ] Modification de réservation : synchronisée en < 1 seconde
- [ ] Suppression de réservation : synchronisée en < 1 seconde
- [ ] Indisponibilités : synchronisées en < 1 seconde
- [ ] Pas de duplications de données
- [ ] Pas de rechargement de page nécessaire
- [ ] La date sélectionnée reste fixe après modifications
- [ ] Fonctionne sur 2+ appareils simultanément

### Test Équipe (Optionnel)

Si vous avez plusieurs comptes :

- [ ] Le propriétaire crée une réservation
- [ ] Le membre la voit instantanément
- [ ] Le membre avec visibilité restreinte voit seulement ses assignations
- [ ] Chaque membre voit ses propres données

---

## 📸 Captures d'Écran pour Debug

### Console Normale
```
✅ Version file created: 1762741678934
📡 Realtime subscription status: SUBSCRIBED
🔄 Realtime event received: INSERT {...}
```

### Console avec Erreur
```
❌ Erreur setup realtime: Error: ...
📡 Realtime subscription status: CHANNEL_ERROR
```

---

## 🎥 Vidéo de Test

**Enregistrement recommandé :**
```
1. Écran partagé (appareil A + appareil B)
2. Créer une réservation sur A
3. Observer l'apparition sur B
4. Durée : 10-15 secondes max
```

---

## 📞 Support

Si les tests échouent :

1. **Vérifier la Console** : Rechercher les erreurs
2. **Vérifier le Réseau** : Onglet Network > WS dans DevTools
3. **Consulter** : `REALTIME_SYNC.md` pour plus de détails
4. **Logs** : Partager les logs de la console pour diagnostic

---

**Temps estimé pour tous les tests : 5-10 minutes**
