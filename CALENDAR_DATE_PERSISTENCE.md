# Persistance de la date du calendrier

## Problème résolu

Lorsqu'un utilisateur supprimait une réservation sur une date différente de la date actuelle, le calendrier se rechargeait et retournait automatiquement à la date d'aujourd'hui. Cela obligeait l'utilisateur à naviguer à nouveau vers la date où il travaillait.

## Solution implémentée

Le calendrier sauvegarde maintenant automatiquement la date sélectionnée dans `sessionStorage` et la restaure au chargement de la page.

## Fonctionnement technique

### Sauvegarde de la date

Chaque fois que l'utilisateur sélectionne une date, elle est automatiquement sauvegardée :

```typescript
useEffect(() => {
  const dateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
  sessionStorage.setItem('calendar_selected_date', dateString);
}, [selectedDate]);
```

### Restauration de la date

Au chargement du composant, la date sauvegardée est restaurée :

```typescript
const getInitialDate = () => {
  const savedDate = sessionStorage.getItem('calendar_selected_date');
  if (savedDate) {
    const date = new Date(savedDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return today;
};

const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
```

## Comportement utilisateur

### Avant la correction

1. Utilisateur navigue au 15 décembre 2025
2. Utilisateur supprime une réservation
3. Page se recharge
4. **Problème** : Calendrier retourne au jour actuel (ex: 9 novembre 2025)
5. Utilisateur doit naviguer à nouveau au 15 décembre

### Après la correction

1. Utilisateur navigue au 15 décembre 2025
2. Utilisateur supprime une réservation
3. Page se recharge
4. **Solution** : Calendrier reste sur le 15 décembre 2025
5. Utilisateur peut continuer à travailler sur cette date

## Cas d'usage

Cette fonctionnalité est utile dans plusieurs scénarios :

1. **Suppression de réservations**
   - L'utilisateur supprime plusieurs réservations sur une même date future
   - Il reste sur la même date entre chaque suppression

2. **Modifications multiples**
   - L'utilisateur modifie plusieurs réservations sur une date spécifique
   - Il n'a pas besoin de naviguer à nouveau vers cette date

3. **Gestion de dates futures**
   - Planification de réservations dans le futur
   - Gestion de réservations sur plusieurs jours consécutifs

4. **Navigation multi-mois**
   - L'utilisateur travaille sur une date 3 mois dans le futur
   - Après une action, il reste sur ce mois

## Durée de vie de la sauvegarde

La date est sauvegardée dans **sessionStorage** :
- ✅ Persiste lors des rechargements de page
- ✅ Persiste lors des suppressions/modifications de réservations
- ❌ **Nettoyée automatiquement** lors du changement de page (navigation vers Dashboard, Clients, etc.)
- ❌ **Ne persiste PAS** après fermeture de l'onglet/navigateur
- ❌ **Ne persiste PAS** dans un nouvel onglet

### Pourquoi sessionStorage ?

- **localStorage** : Persisterait entre les sessions → risque de confusion si l'utilisateur revient plusieurs jours après
- **sessionStorage** : Persiste uniquement pendant la session active → comportement intuitif

## Implémentation

### Fichier modifié

- `src/components/Calendar/CalendarGrid.tsx`

### Fonctions ajoutées

1. `getInitialDate()` - Récupère la date sauvegardée ou retourne aujourd'hui
2. `getInitialMonth()` - Récupère le mois de la date sauvegardée pour l'affichage
3. `useEffect` (sauvegarde) - Sauvegarde automatique lors du changement de date
4. `useEffect` (nettoyage) - Nettoie la date sauvegardée lors de la sortie du composant

### Clé de stockage

```
calendar_selected_date
```

Format : `YYYY-MM-DD` (ex: `2025-12-15`)

## Test

### Test manuel - Persistance lors du rechargement

1. Ouvrir le calendrier
2. Naviguer vers une date future (ex: dans 2 mois)
3. Noter la date sélectionnée
4. Supprimer une réservation (si disponible) ou recharger la page (F5)
5. Vérifier que le calendrier affiche toujours la date sélectionnée

### Test manuel - Nettoyage lors du changement de page

1. Ouvrir le calendrier
2. Naviguer vers une date future (ex: dans 2 mois)
3. Cliquer sur "Dashboard" ou une autre page
4. Revenir sur le calendrier
5. Vérifier que le calendrier affiche la date d'aujourd'hui (pas la date précédente)

### Console de débogage

La console affiche les messages suivants :

```
📅 Restauration date sauvegardée: 2025-12-15
💾 Sauvegarde de la date sélectionnée: 2025-12-15
🧹 Nettoyage de la date sauvegardée lors de la sortie du calendrier
```

### Inspection manuelle

Dans les DevTools → Application → Session Storage :
```
calendar_selected_date: "2025-12-15"
```

## Compatibilité

- ✅ Chrome / Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (tous navigateurs)
- ✅ PWA installées

## Notes importantes

1. **Pas d'impact sur les performances** : La lecture/écriture de sessionStorage est instantanée
2. **Pas de conflit** : Chaque onglet a son propre sessionStorage
3. **Nettoyage automatique** : sessionStorage est automatiquement vidé à la fermeture de l'onglet
4. **Fallback sécurisé** : Si la date sauvegardée est invalide, on retourne à aujourd'hui

## Évolutions possibles

### Option 1 : Sauvegarder également le filtre de membre

```typescript
sessionStorage.setItem('calendar_selected_team_member', selectedTeamMember);
```

### Option 2 : Sauvegarder dans localStorage avec expiration

```typescript
const savedData = {
  date: dateString,
  timestamp: Date.now()
};
localStorage.setItem('calendar_state', JSON.stringify(savedData));

// Au chargement : vérifier si < 24h
```

### Option 3 : Sauvegarder dans l'URL

```typescript
// /calendar?date=2025-12-15
const searchParams = new URLSearchParams(window.location.search);
const dateParam = searchParams.get('date');
```

## Support

En cas de problème :
1. Vérifier la console pour les logs de debug
2. Vérifier sessionStorage dans les DevTools
3. Vider sessionStorage : `sessionStorage.clear()`
4. Recharger la page
