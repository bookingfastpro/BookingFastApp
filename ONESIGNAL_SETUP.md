# Configuration OneSignal pour Supabase Auto-Hébergé

## Vue d'ensemble

L'intégration OneSignal permet d'envoyer des notifications push aux utilisateurs lorsque des réservations sont créées, modifiées ou annulées. Contrairement à Supabase Cloud qui supporte `pg_net`, cette implémentation utilise une approche côté client pour envoyer les notifications push.

## Architecture

1. **Trigger SQL** → Crée une notification dans la table `notifications`
2. **Realtime Supabase** → Notifie le frontend en temps réel
3. **Frontend (Hook)** → Détecte la nouvelle notification et appelle l'Edge Function
4. **Edge Function** → Envoie la notification push via l'API OneSignal

## Configuration requise

### 1. Compte OneSignal

1. Créez un compte sur [OneSignal](https://onesignal.com)
2. Créez une nouvelle application Web
3. Récupérez votre **App ID** et **REST API Key**

### 2. Variables d'environnement

#### Fichier `.env` (Frontend - Racine du projet)

Ajoutez cette variable dans votre fichier `.env` à la racine du projet :

```bash
VITE_ONESIGNAL_APP_ID=votre_app_id_onesignal
```

#### Fichier `supabase/.env` (Backend - Docker)

Les variables OneSignal sont déjà configurées dans `docker-compose.yml`. Ajoutez simplement ces lignes dans votre fichier `supabase/.env` :

```bash
# 🔔 ONESIGNAL (optionnel - notifications push)
ONESIGNAL_APP_ID=votre_onesignal_app_id
ONESIGNAL_REST_API_KEY=votre_onesignal_rest_api_key
```

**Note:** Les variables sont automatiquement injectées dans le conteneur `functions` via le `docker-compose.yml` qui contient déjà la configuration :

```yaml
functions:
  environment:
    ONESIGNAL_APP_ID: ${ONESIGNAL_APP_ID}
    ONESIGNAL_REST_API_KEY: ${ONESIGNAL_REST_API_KEY}
```

### 3. Configuration OneSignal Dashboard

1. Allez dans **Settings → Web Push**
2. Configurez votre **Site URL** (ex: `https://votre-domaine.com`)
3. Si vous supportez Safari, configurez le **Safari Web ID**
4. Sauvegardez la configuration

## Migrations SQL

Les migrations suivantes ont été appliquées :

1. **add_onesignal_support** - Ajoute les colonnes OneSignal à la table `profiles`
2. **fix_onesignal_without_pgnet** - Configure les triggers sans utiliser `pg_net`

### Tables créées

- `onesignal_logs` - Trace les envois de notifications push
- Colonnes ajoutées à `profiles` :
  - `onesignal_player_id` - ID d'abonnement OneSignal
  - `push_notifications_enabled` - Préférence utilisateur
- Colonnes ajoutées à `notifications` :
  - `push_sent` - Indique si la notification push a été envoyée
  - `push_sent_at` - Date d'envoi de la notification push

## Edge Function

L'Edge Function `send-onesignal-notification` a été déployée. Elle :

1. Reçoit les détails de la notification
2. Appelle l'API REST OneSignal
3. Envoie la notification avec des boutons d'action

### Boutons d'action configurés

- **Nouvelle réservation** : "Voir" + "Appeler"
- **Modification** : "Voir changements" + "Confirmer"
- **Annulation** : "Voir détails" + "Contacter"

## Utilisation

### Interface utilisateur

1. Allez dans **Admin → Notifications**
2. Cliquez sur **"Activer"** pour activer les notifications push
3. Acceptez les permissions du navigateur
4. Testez avec le bouton **"Tester"**

### Vérification

Pour vérifier que tout fonctionne :

```sql
-- Voir les utilisateurs avec notifications activées
SELECT id, email, onesignal_player_id, push_notifications_enabled
FROM profiles
WHERE push_notifications_enabled = true;

-- Voir les logs d'envoi
SELECT * FROM onesignal_logs
ORDER BY created_at DESC
LIMIT 10;

-- Voir les notifications non envoyées
SELECT * FROM notifications
WHERE push_sent = false
ORDER BY created_at DESC;
```

## Dépannage

### Les notifications push ne sont pas envoyées

1. Vérifiez que `VITE_ONESIGNAL_APP_ID` est défini dans `.env`
2. Vérifiez que `ONESIGNAL_APP_ID` et `ONESIGNAL_REST_API_KEY` sont définis dans Docker Compose
3. Redémarrez les conteneurs Docker après avoir ajouté les variables
4. Vérifiez les logs de la Edge Function :

```bash
docker logs supabase-functions-1 --tail 100
```

### L'utilisateur ne reçoit pas les notifications

1. Vérifiez que l'utilisateur a activé les notifications dans Admin → Notifications
2. Vérifiez que le navigateur a accordé les permissions
3. Vérifiez que `onesignal_player_id` n'est pas NULL dans la table `profiles`
4. Testez avec le bouton "Tester" dans l'interface

### Erreur "pg_net not found"

C'est normal! Cette implémentation n'utilise pas `pg_net`. Les notifications sont envoyées par le frontend via l'Edge Function.

## Performance

- Les notifications sont envoyées en temps réel via Supabase Realtime
- Aucun polling côté serveur n'est nécessaire
- L'envoi des notifications push se fait de manière asynchrone sans bloquer l'interface

## Sécurité

- L'Edge Function vérifie le JWT (authentification requise)
- Seul l'utilisateur peut mettre à jour son propre `onesignal_player_id`
- Les clés API OneSignal ne sont jamais exposées au frontend
- RLS est activé sur toutes les tables

## Support des navigateurs

- ✅ Chrome Desktop & Mobile
- ✅ Firefox Desktop & Mobile
- ✅ Edge Desktop & Mobile
- ⚠️ Safari (nécessite configuration Safari Web ID)
- ❌ iOS Safari (limitation Apple)

## Ressources

- [Documentation OneSignal](https://documentation.onesignal.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
