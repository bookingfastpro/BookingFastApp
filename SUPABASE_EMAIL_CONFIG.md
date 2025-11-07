# Configuration Email Redirect Supabase

## Problème
Les emails de confirmation redirigent vers `bookingfast.hevolife.fr` au lieu de `bookingfast.pro/dashboard`

## Solution

### 1. Configuration dans Supabase Dashboard

Allez dans votre projet Supabase : https://bookingfast.hevolife.fr

#### A. Authentication Settings
1. Allez dans **Authentication** → **URL Configuration**
2. Configurez les URLs suivantes :

```
Site URL: https://bookingfast.pro
```

#### B. Redirect URLs (Whitelist)
Ajoutez ces URLs dans la liste blanche :
```
https://bookingfast.pro/**
https://bookingfast.pro/dashboard
https://bookingfast.pro/auth/callback
http://localhost:5173/**
```

#### C. Email Templates
1. Allez dans **Authentication** → **Email Templates**
2. Pour chaque template (Confirm signup, Magic Link, etc.), modifiez l'URL de redirection :

**Template "Confirm signup" :**
```html
<h2>Confirmez votre email</h2>

<p>Suivez ce lien pour confirmer votre compte :</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .SiteURL }}/dashboard">Confirmer mon email</a></p>
```

**Template "Reset Password" :**
```html
<h2>Réinitialiser votre mot de passe</h2>

<p>Suivez ce lien pour réinitialiser votre mot de passe :</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .SiteURL }}/dashboard">Réinitialiser mon mot de passe</a></p>
```

### 2. Configuration DNS (si pas déjà fait)

Assurez-vous que votre domaine `bookingfast.pro` pointe vers votre hébergement :

```
Type: CNAME
Name: @
Value: [votre-hebergeur].netlify.app (ou autre)
```

### 3. Variables d'environnement (déjà configurées)

Vérifiez que ces variables sont bien présentes dans `.env` :
```env
VITE_SUPABASE_URL=https://bookingfast.hevolife.fr/
VITE_APP_URL=https://bookingfast.pro
```

### 4. Redéploiement

Après avoir modifié la configuration Supabase :
1. Attendez 2-3 minutes pour la propagation
2. Testez avec un nouvel utilisateur
3. Vérifiez que l'email contient le bon lien

## Vérification

Pour tester :
1. Créez un nouveau compte test
2. Vérifiez l'email reçu
3. Le lien doit contenir `bookingfast.pro` et non `hevolife.fr`
4. Après clic, vous devez être redirigé vers `bookingfast.pro/dashboard`

## Notes importantes

- ⚠️ **Site URL** dans Supabase est l'URL principale utilisée pour tous les liens
- ⚠️ Les templates d'email utilisent la variable `{{ .SiteURL }}`
- ⚠️ Les modifications prennent effet immédiatement mais peuvent nécessiter 2-3 min
- ⚠️ Les anciens emails déjà envoyés garderont l'ancienne URL
