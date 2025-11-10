# 🔄 Synchronisation en Temps Réel Multi-Appareils

## Vue d'Ensemble

BookingFast utilise **Supabase Realtime** pour synchroniser instantanément les réservations et indisponibilités entre tous les appareils connectés.

### ✨ Fonctionnalités

- ✅ **Synchronisation instantanée** : Les modifications apparaissent en temps réel sur tous les appareils
- ✅ **Support multi-utilisateurs** : Parfait pour les équipes qui travaillent ensemble
- ✅ **Gestion des membres restreints** : Respecte les permissions de visibilité
- ✅ **Protection contre les duplications** : Évite l'affichage multiple de la même donnée
- ✅ **Désinscription automatique** : Nettoie les connexions lors de la déconnexion

## 🏗️ Architecture

### Tables Synchronisées

1. **`bookings`** - Réservations
   - Événements : INSERT, UPDATE, DELETE
   - Channel : `bookings:${userId}`

2. **`unavailabilities`** - Indisponibilités
   - Événements : INSERT, UPDATE, DELETE
   - Channel : `unavailabilities:${userId}`

### Flux de Données

```
Appareil A                    Supabase                    Appareil B
    |                            |                            |
    |-- INSERT booking --------->|                            |
    |                            |-- Realtime Event --------->|
    |                            |                            |-- Ajoute à l'UI
    |<------- Confirmation ------|                            |
    |                            |                            |
```

## 🔧 Implémentation Technique

### Hook `useBookings`

**Fonctionnalités :**
- Écoute les événements INSERT, UPDATE, DELETE
- Récupère les données complètes avec le service lié
- Filtre selon les permissions (membres restreints)
- Évite les duplications avec `prev.some(b => b.id === newBooking.id)`

**Code :**
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`bookings:${targetUserId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: `user_id=eq.${targetUserId}`
    }, async (payload) => {
      // Gestion des événements INSERT, UPDATE, DELETE
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);
```

### Hook `useUnavailabilities`

**Fonctionnalités :**
- Identique à `useBookings` mais pour les indisponibilités
- Synchronisation en temps réel
- Gestion des permissions

## 🎯 Cas d'Usage

### Scénario 1 : Création de Réservation
1. **Appareil A** : Utilisateur crée une réservation
2. **Base de données** : Réservation insérée
3. **Supabase Realtime** : Événement `INSERT` diffusé
4. **Appareil B** : Réservation apparaît instantanément dans le calendrier

### Scénario 2 : Modification de Réservation
1. **Appareil A** : Utilisateur modifie une réservation (changement d'heure)
2. **Base de données** : Réservation mise à jour
3. **Supabase Realtime** : Événement `UPDATE` diffusé
4. **Appareil B** : Réservation se déplace automatiquement dans le calendrier

### Scénario 3 : Suppression de Réservation
1. **Appareil A** : Utilisateur supprime une réservation
2. **Base de données** : Réservation supprimée
3. **Supabase Realtime** : Événement `DELETE` diffusé
4. **Appareil B** : Réservation disparaît instantanément du calendrier

## 🔒 Sécurité

### Row Level Security (RLS)
Les RLS existantes continuent de protéger les données :
- Chaque utilisateur ne peut voir que ses propres réservations
- Les membres d'équipe voient les réservations de leur propriétaire
- Les membres restreints ne voient que leurs propres assignations

### Filtrage des Événements
```typescript
// Filtre au niveau de la subscription
filter: `user_id=eq.${targetUserId}`

// Filtre supplémentaire pour les membres restreints
if (isRestrictedMember && newBooking.assigned_user_id !== user.id) {
  return; // Ignore l'événement
}
```

## 🎨 Expérience Utilisateur

### Indicateurs Visuels
- Pas de rechargement de page nécessaire
- Les modifications apparaissent en douceur
- Pas de flash ou de scintillement

### Gestion des Conflits
- **Optimistic Updates** : L'interface se met à jour immédiatement
- **Server Reconciliation** : La donnée serveur fait autorité
- **Évitement des Duplications** : Vérification avant ajout

## 📊 Performance

### Optimisations

1. **Channels Séparés**
   - Un channel par type de données (bookings, unavailabilities)
   - Réduit la charge réseau

2. **Filtrage Côté Serveur**
   - `filter: user_id=eq.${targetUserId}`
   - Seules les données pertinentes sont envoyées

3. **Déduplication**
   - Vérification `prev.some(b => b.id === newBooking.id)`
   - Évite les doublons dans l'interface

4. **Cleanup Automatique**
   - Désinscription lors de la fermeture du composant
   - Pas de connexions orphelines

### Métriques Estimées
- **Latence** : < 100ms pour la synchronisation
- **Bande passante** : Minimale (seulement les changements)
- **Overhead** : Négligeable sur les performances

## 🧪 Tests

### Test Manuel - 2 Appareils

**Configuration :**
1. Ouvrir BookingFast sur 2 appareils différents
2. Se connecter avec le même compte
3. Naviguer vers le calendrier sur les 2 appareils

**Test Création :**
1. Sur l'appareil A : Créer une nouvelle réservation
2. ✅ Vérifier : La réservation apparaît sur l'appareil B en < 1 seconde

**Test Modification :**
1. Sur l'appareil A : Modifier l'heure d'une réservation
2. ✅ Vérifier : La modification apparaît sur l'appareil B instantanément

**Test Suppression :**
1. Sur l'appareil A : Supprimer une réservation
2. ✅ Vérifier : La réservation disparaît de l'appareil B instantanément

### Test Équipe

**Configuration :**
1. Compte propriétaire sur appareil A
2. Compte membre sur appareil B

**Test Permissions :**
1. Propriétaire crée une réservation assignée au membre
2. ✅ Vérifier : Le membre voit la réservation instantanément
3. Membre avec visibilité restreinte ne voit que ses assignations

## 🐛 Dépannage

### La synchronisation ne fonctionne pas

**Vérifications :**
1. Console du navigateur : Vérifier les messages Realtime
   - `📡 Realtime subscription status: SUBSCRIBED` ✅
   - Pas d'erreurs de connexion

2. Base de données : Vérifier la réplication
   ```sql
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
   - `bookings` et `unavailabilities` doivent être présents

3. Connexion réseau : Vérifier WebSocket
   - Onglet Network > WS dans DevTools
   - Connexion active vers Supabase

### Duplications de données

**Cause :** Le code de déduplication ne fonctionne pas

**Solution :**
```typescript
setBookings((prev) => {
  if (prev.some(b => b.id === newBooking.id)) {
    return prev; // Évite l'ajout
  }
  return [...prev, newBooking];
});
```

### Logs de Debug

**Activer les logs :**
```typescript
// Dans useBookings.ts ou useUnavailabilities.ts
logger.debug('🔄 Realtime event received:', payload.eventType, payload);
```

**Console attendue :**
```
🔄 Realtime event received: INSERT {new: {...}}
📡 Realtime subscription status: SUBSCRIBED
🔌 Unsubscribing from realtime channel: bookings:user-id
```

## 📈 Améliorations Futures

### Possibles Extensions

1. **Indicateur de Présence**
   - Voir qui est en ligne
   - Afficher les utilisateurs actifs sur le calendrier

2. **Curseurs Collaboratifs**
   - Voir où les autres utilisateurs travaillent
   - Éviter les conflits d'édition

3. **Messages de Toast**
   - Notification visuelle lors de modifications par d'autres
   - "Jean vient de créer une nouvelle réservation"

4. **Mode Offline**
   - Queue des modifications locales
   - Synchronisation au retour en ligne

5. **Optimistic Locking**
   - Détection des conflits d'édition simultanée
   - Résolution automatique ou manuelle

## 🎓 Ressources

### Documentation
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

### Exemples de Code
- `src/hooks/useBookings.ts` - Hook avec Realtime
- `src/hooks/useUnavailabilities.ts` - Hook avec Realtime

---

**Version:** 1.0.0
**Date:** 2025-11-10
**Status:** ✅ Implémenté et Actif
