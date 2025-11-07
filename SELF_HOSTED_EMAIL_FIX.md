# Fix Email Redirect - Supabase Self-Hosted

## Problème
Les emails de confirmation redirigent vers `bookingfast.hevolife.fr` au lieu de `bookingfast.pro/dashboard`

## Solution pour Self-Hosted

### 1. Modifier le fichier `.env` de Supabase

Dans votre dossier `supabase/`, créez ou modifiez le fichier `.env` :

```bash
# 🔐 CONFIGURATION GOTRUE (AUTH)
GOTRUE_SITE_URL=https://bookingfast.pro
GOTRUE_URI_ALLOW_LIST=https://bookingfast.pro/**,http://localhost:5173/**
```

### 2. Variables critiques à vérifier

```bash
# URL principale utilisée dans les emails
GOTRUE_SITE_URL=https://bookingfast.pro

# Liste blanche des URLs autorisées
GOTRUE_URI_ALLOW_LIST=https://bookingfast.pro/**,http://localhost:5173/**

# Email settings
SMTP_ADMIN_EMAIL=admin@bookingfast.pro
GOTRUE_SMTP_SENDER_NAME=BookingFast
```

### 3. Redémarrer les services

```bash
cd supabase
docker-compose down
docker-compose up -d
```

### 4. Vérifier les logs

```bash
# Vérifier que GoTrue a bien pris en compte la config
docker logs supabase_auth

# Vous devriez voir:
# site_url=https://bookingfast.pro
```

### 5. Templates d'email (optionnel)

Si vous voulez personnaliser les templates, créez :

`supabase/volumes/auth/templates/confirmation.html`
```html
<h2>Confirmez votre email</h2>
<p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .SiteURL }}/dashboard">Confirmer mon email</a></p>
```

Puis dans `docker-compose.yml`, ajoutez au service `auth` :
```yaml
volumes:
  - ./volumes/auth/templates:/etc/gotrue/templates:ro
environment:
  GOTRUE_MAILER_TEMPLATES_CONFIRMATION: /etc/gotrue/templates/confirmation.html
```

## Vérification

1. Créez un nouveau compte test
2. Vérifiez l'email reçu
3. Le lien doit contenir `bookingfast.pro`
4. Après clic, redirection vers `bookingfast.pro/dashboard`

## Troubleshooting

### Les emails utilisent toujours l'ancienne URL

```bash
# 1. Vérifier la config actuelle
docker exec supabase_auth env | grep GOTRUE_SITE_URL

# 2. Forcer le redémarrage
docker-compose restart auth

# 3. Vérifier les logs
docker logs -f supabase_auth
```

### Les redirections ne fonctionnent pas

Vérifiez que `GOTRUE_URI_ALLOW_LIST` contient bien votre domaine :
```bash
GOTRUE_URI_ALLOW_LIST=https://bookingfast.pro/**,http://localhost:5173/**
```

## Notes importantes

- ⚠️ `GOTRUE_SITE_URL` est la variable clé pour les emails
- ⚠️ Redémarrage obligatoire après modification
- ⚠️ Les anciens emails gardent l'ancienne URL
- ⚠️ Testez toujours avec un nouveau compte
