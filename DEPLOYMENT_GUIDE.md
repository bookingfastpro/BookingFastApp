# 🚀 Guide de Déploiement de l'Edge Function

## Problème actuel
L'Edge Function `create-plugin-subscription` retourne une erreur 404 car elle n'est pas déployée sur Supabase.

## Solution : Déployer l'Edge Function

### Étape 1 : Installer Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (avec Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via NPM (toutes plateformes)
npm install -g supabase
```

### Étape 2 : Se connecter à Supabase

```bash
# Se connecter avec votre token d'accès
supabase login

# Lier votre projet local au projet Supabase
supabase link --project-ref VOTRE_PROJECT_REF
```

**Pour trouver votre PROJECT_REF :**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. L'URL sera : `https://supabase.com/dashboard/project/VOTRE_PROJECT_REF`
4. Copiez la partie après `/project/`

### Étape 3 : Déployer l'Edge Function

```bash
# Depuis la racine de votre projet
supabase functions deploy create-plugin-subscription
```

### Étape 4 : Configurer les secrets

```bash
# Configurer les variables d'environnement pour l'Edge Function
supabase secrets set SUPABASE_URL=https://bookingfast.hevolife.fr
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Pour trouver votre SERVICE_ROLE_KEY :**
1. Allez sur https://supabase.com/dashboard/project/VOTRE_PROJECT_REF/settings/api
2. Copiez la clé "service_role" (⚠️ ATTENTION : Ne jamais exposer cette clé côté client !)

### Étape 5 : Vérifier le déploiement

```bash
# Lister les fonctions déployées
supabase functions list

# Tester la fonction
supabase functions invoke create-plugin-subscription --body '{"plugin_id":"test","user_id":"test","subscription_id":"test"}'
```

## Alternative : Déploiement via Dashboard Supabase

Si vous préférez utiliser l'interface web :

1. **Allez sur le Dashboard Supabase**
   - https://supabase.com/dashboard/project/VOTRE_PROJECT_REF/functions

2. **Créer une nouvelle fonction**
   - Cliquez sur "Create a new function"
   - Nom : `create-plugin-subscription`
   - Copiez le contenu de `supabase/functions/create-plugin-subscription/index.ts`

3. **Configurer les secrets**
   - Allez dans Settings > Edge Functions > Secrets
   - Ajoutez :
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

4. **Déployer**
   - Cliquez sur "Deploy"

## Vérification

Après le déploiement, testez l'URL :

```bash
curl -X POST https://bookingfast.hevolife.fr/functions/v1/create-plugin-subscription \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plugin_id":"test","user_id":"test","subscription_id":"test"}'
```

Si vous obtenez une réponse (même une erreur de validation), c'est que la fonction est bien déployée ! ✅

## Troubleshooting

### Erreur : "Project not linked"
```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

### Erreur : "Function already exists"
```bash
# Forcer le redéploiement
supabase functions deploy create-plugin-subscription --no-verify-jwt
```

### Erreur : "Invalid credentials"
```bash
# Se reconnecter
supabase logout
supabase login
```

## Notes importantes

⚠️ **SÉCURITÉ** :
- Ne JAMAIS commiter le `SUPABASE_SERVICE_ROLE_KEY` dans Git
- Toujours utiliser les secrets Supabase pour les clés sensibles
- Le `SERVICE_ROLE_KEY` doit UNIQUEMENT être utilisé côté serveur (Edge Functions)

📝 **APRÈS LE DÉPLOIEMENT** :
- L'Edge Function sera accessible à : `https://bookingfast.hevolife.fr/functions/v1/create-plugin-subscription`
- Les logs seront visibles dans le Dashboard Supabase > Edge Functions > Logs
- Vous pourrez monitorer les appels et les erreurs en temps réel
