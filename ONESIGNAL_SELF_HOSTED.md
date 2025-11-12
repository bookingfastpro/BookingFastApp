# Configuration OneSignal pour Supabase Auto-Hébergé

Guide spécifique pour configurer OneSignal avec Supabase auto-hébergé (self-hosted).

## Différence avec Supabase Cloud

Avec Supabase auto-hébergé, il n'y a **PAS** de système de secrets via le dashboard. Les variables d'environnement sont passées directement via Docker Compose.

## Configuration rapide (3 étapes)

### 1. Obtenir vos clés OneSignal

1. Créez un compte sur [OneSignal.com](https://onesignal.com)
2. Créez une nouvelle application
3. Configurez la plateforme **Web Push**
4. Récupérez:
   - **App ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - **REST API Key** (dans Settings → Keys & IDs)

### 2. Ajouter les variables dans votre fichier .env Supabase

Éditez le fichier `supabase/.env` (ou créez-le depuis `.env.example`):

```env
# 🔔 ONESIGNAL CONFIGURATION
ONESIGNAL_APP_ID=votre_app_id_ici
ONESIGNAL_REST_API_KEY=votre_rest_api_key_ici
```

### 3. Redémarrer les conteneurs Supabase

```bash
cd supabase
docker-compose down
docker-compose up -d
```

C'est tout! Les Edge Functions auront automatiquement accès aux variables OneSignal.

## Vérification

### Vérifier que les variables sont bien passées

```bash
# Vérifier que le conteneur Edge Functions a les variables
docker exec supabase_edge_functions env | grep ONESIGNAL
```

Vous devriez voir:
```
ONESIGNAL_APP_ID=votre_app_id
ONESIGNAL_REST_API_KEY=votre_rest_api_key
```

### Tester l'Edge Function

```bash
# Tester l'appel de l'Edge Function
curl -X POST https://votre-domaine.com/functions/v1/send-onesignal-notification \
  -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-de-test",
    "type": "booking_created",
    "title": "Test",
    "message": "Message de test"
  }'
```

## Configuration Frontend

Dans votre fichier `.env` du projet React (à la racine):

```env
# OneSignal Configuration
VITE_ONESIGNAL_APP_ID=votre_app_id_ici
VITE_ONESIGNAL_REST_API_KEY=votre_rest_api_key_ici
```

**⚠️ Important**: Pour le frontend, utilisez seulement l'App ID en production. La REST API Key ne devrait être utilisée que côté serveur (Edge Functions).

## Différences avec le guide principal

| Aspect | Supabase Cloud | Supabase Auto-Hébergé |
|--------|----------------|------------------------|
| Configuration secrets | Via Dashboard → Edge Functions → Secrets | Via `docker-compose.yml` + `.env` |
| Commande secrets | `supabase secrets set` | Éditer `.env` + `docker-compose up -d` |
| Redéploiement | Automatique | Redémarrage manuel des conteneurs |

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React)                           │
│  - VITE_ONESIGNAL_APP_ID                   │
│  - Initialise OneSignal SDK                │
│  - Enregistre les utilisateurs             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Supabase Auto-Hébergé                     │
│  ┌──────────────────────────────────────┐  │
│  │  Base de données                     │  │
│  │  - Notifications                     │  │
│  │  - user_onesignal (Player IDs)      │  │
│  │  - Triggers                          │  │
│  └──────────────┬───────────────────────┘  │
│                 │                            │
│                 ▼                            │
│  ┌──────────────────────────────────────┐  │
│  │  Edge Functions Container            │  │
│  │  - ONESIGNAL_APP_ID                  │  │
│  │  - ONESIGNAL_REST_API_KEY            │  │
│  │  - send-onesignal-notification       │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  OneSignal API     │
         │  Push Notifications│
         └────────────────────┘
```

## Logs et débogage

### Voir les logs de l'Edge Function

```bash
# Logs en temps réel
docker logs -f supabase_edge_functions

# Filtrer les logs OneSignal
docker logs supabase_edge_functions 2>&1 | grep -i onesignal
```

### Logs côté frontend

Ouvrez la console du navigateur (F12) et cherchez:
- `OneSignal initialized`
- `Player ID saved to database`

## Dépannage

### Problème: "Missing OneSignal configuration"

**Cause**: Les variables ne sont pas passées au conteneur Edge Functions

**Solution**:
1. Vérifiez que `supabase/.env` contient les variables
2. Redémarrez les conteneurs: `docker-compose restart functions`
3. Vérifiez avec: `docker exec supabase_edge_functions env | grep ONESIGNAL`

### Problème: Les notifications ne sont pas envoyées

**Solution**:
1. Vérifiez les logs: `docker logs supabase_edge_functions`
2. Vérifiez que l'utilisateur a un player_id:
   ```sql
   SELECT * FROM user_onesignal WHERE user_id = 'votre-user-id';
   ```
3. Testez manuellement l'Edge Function avec curl

### Problème: Trigger ne s'exécute pas

**Solution**:
1. Vérifiez que le trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%onesignal%';
   ```
2. Vérifiez les logs PostgreSQL:
   ```bash
   docker logs supabase_db 2>&1 | grep -i onesignal
   ```

## Production

### Variables d'environnement recommandées

Pour la production, utilisez des fichiers `.env` séparés:

```bash
# Fichier supabase/.env.production
ONESIGNAL_APP_ID=prod_app_id
ONESIGNAL_REST_API_KEY=prod_rest_api_key

# Démarrer avec
docker-compose --env-file .env.production up -d
```

### Sécurité

1. ✅ **Ne commitez JAMAIS** le fichier `.env` dans Git
2. ✅ Ajoutez `.env` dans `.gitignore`
3. ✅ Utilisez des secrets différents pour dev/prod
4. ✅ Limitez l'accès SSH au serveur
5. ✅ Activez HTTPS pour votre domaine

## Support

- [Documentation OneSignal](https://documentation.onesignal.com/)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Note**: Ce guide est spécifique à Supabase auto-hébergé. Pour Supabase Cloud, consultez `ONESIGNAL_SETUP.md`.
