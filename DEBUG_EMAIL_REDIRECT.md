# Debug Email Redirect - Configuration OK mais ne fonctionne pas

## Situation
- ✅ `GOTRUE_SITE_URL=https://bookingfast.pro` est bien configuré
- ❌ Les emails redirigent toujours vers `bookingfast.hevolife.fr`

## Causes possibles

### 1. Service Auth pas redémarré après modification
```bash
# Vérifier si le service auth utilise bien la nouvelle config
docker exec supabase_auth env | grep GOTRUE_SITE_URL

# Devrait afficher: GOTRUE_SITE_URL=https://bookingfast.pro
```

### 2. Templates d'email avec URL hardcodée
Les templates d'email peuvent avoir l'ancienne URL en dur.

**Vérifier les templates :**
```bash
# Chercher les templates d'email
docker exec supabase_auth ls -la /etc/gotrue/templates/

# Ou dans votre dossier supabase
ls -la supabase/volumes/auth/templates/
```

### 3. Configuration dans la base de données
GoTrue peut stocker la configuration dans la base de données, qui override les variables d'environnement.

**Vérifier la config en base :**
```sql
-- Se connecter à la base
docker exec -it supabase_db psql -U postgres

-- Vérifier la table de config
SELECT * FROM auth.config;

-- Vérifier s'il y a une config site_url
SELECT * FROM auth.config WHERE parameter = 'site_url';
```

### 4. Variable SUPABASE_PUBLIC_URL qui interfère
Dans votre `.env`, vous avez :
```
SUPABASE_PUBLIC_URL=https://bookingfast.hevolife.fr
```

Cette variable peut être utilisée par certains services au lieu de `GOTRUE_SITE_URL`.

### 5. Kong (API Gateway) qui modifie les URLs
Kong peut modifier les URLs dans les réponses.

**Vérifier la config Kong :**
```bash
cat supabase/volumes/api/kong.yml | grep -i url
```

## Solutions à tester

### Solution 1: Forcer le redémarrage complet
```bash
cd supabase
docker-compose down
docker-compose up -d

# Attendre 30 secondes
sleep 30

# Vérifier les logs
docker logs supabase_auth | grep -i "site_url"
```

### Solution 2: Vérifier et nettoyer la config en base
```sql
-- Se connecter
docker exec -it supabase_db psql -U postgres -d postgres

-- Vérifier la config auth
\c postgres
SET search_path TO auth;
SELECT * FROM auth.config;

-- Si une config site_url existe, la supprimer
DELETE FROM auth.config WHERE parameter = 'site_url';
```

### Solution 3: Créer des templates d'email personnalisés
```bash
# Créer le dossier templates
mkdir -p supabase/volumes/auth/templates
```

Créer `supabase/volumes/auth/templates/confirmation.html` :
```html
<h2>Confirmez votre email</h2>
<p>Bienvenue sur BookingFast !</p>
<p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
<p><a href="https://bookingfast.pro/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to=https://bookingfast.pro/dashboard">Confirmer mon email</a></p>
```

Puis modifier `docker-compose.yml` service `auth` :
```yaml
auth:
  volumes:
    - ./volumes/auth/templates:/etc/gotrue/templates:ro
  environment:
    GOTRUE_MAILER_TEMPLATES_CONFIRMATION: /etc/gotrue/templates/confirmation.html
```

### Solution 4: Vérifier les logs en temps réel
```bash
# Créer un nouveau compte pendant que vous regardez les logs
docker logs -f supabase_auth

# Dans un autre terminal, créez un compte test
# Regardez ce qui s'affiche dans les logs
```

### Solution 5: Vérifier le code source de l'email reçu
Ouvrez l'email de confirmation et regardez le code source HTML (clic droit > "Afficher la source").

Cherchez l'URL du lien de confirmation. Si c'est hardcodé, c'est un problème de template.

## Commandes de diagnostic

```bash
# 1. Vérifier toutes les variables GOTRUE
docker exec supabase_auth env | grep GOTRUE

# 2. Vérifier la config Kong
docker exec supabase_kong cat /var/lib/kong/kong.yml

# 3. Vérifier les logs d'erreur
docker logs supabase_auth --tail 100 | grep -i error

# 4. Tester l'API auth directement
curl http://localhost:54321/auth/v1/settings

# 5. Vérifier la base de données
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT * FROM auth.config;"
```

## Prochaines étapes

1. **Exécutez ces commandes** et partagez les résultats :
```bash
docker exec supabase_auth env | grep GOTRUE_SITE_URL
docker logs supabase_auth | grep -i "site_url" | tail -5
curl http://localhost:54321/auth/v1/settings
```

2. **Vérifiez le code source** d'un email de confirmation reçu

3. **Testez avec un template personnalisé** si nécessaire
