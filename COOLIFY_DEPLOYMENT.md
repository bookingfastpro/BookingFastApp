# Guide de déploiement Coolify

## ⚠️ IMPORTANT : Checklist de configuration

Avant de déployer, vérifiez ces points dans Coolify :

### 1. Configuration du port
- [ ] Port interne : **80**
- [ ] Protocol : **HTTP**

### 2. Variables d'environnement (Build Arguments)
- [ ] Toutes les variables `VITE_*` ont **"Available at Buildtime"** coché
- [ ] **"Available at Runtime"** peut aussi être coché (optionnel, mais ne fait pas de mal)

### 3. Type de déploiement
- [ ] Build Pack : **Dockerfile**
- [ ] Le fichier Dockerfile est détecté automatiquement

### 4. Après changement de configuration
- [ ] **NE PAS** utiliser "Restart" - cela ne rebuild pas
- [ ] Utiliser **"Redeploy"** ou **"Force Rebuild"** pour appliquer les changements

## Variables d'environnement requises

Dans Coolify, configurez les variables suivantes avec **"Available at Buildtime"** activé :

### Variables obligatoires :
- `VITE_SUPABASE_URL` - URL de votre instance Supabase
- `VITE_SUPABASE_ANON_KEY` - Clé anonyme Supabase

### Variables optionnelles :
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Clé service role (pour les edge functions)
- `VITE_STRIPE_PUBLIC_KEY` - Clé publique Stripe
- `VITE_BREVO_API_KEY` - Clé API Brevo pour les emails
- `VITE_GOOGLE_CLIENT_ID` - Client ID Google OAuth
- `VITE_GOOGLE_CLIENT_SECRET` - Secret Google OAuth

## Configuration du port

L'application expose le port **80** en interne. Assurez-vous que Coolify mappe correctement ce port.

## Diagnostics en cas de "Bad Gateway"

### 1. Vérifier les logs du build
Dans Coolify, cliquez sur "Show Debug Logs" pour voir si :
- Le build npm réussit
- Les variables d'environnement sont bien passées
- Le test `index.html` passe (vérifie que les fichiers sont copiés)

### 2. Vérifier les logs du container
Dans Coolify, allez dans l'onglet "Logs" pour voir :
- Si nginx démarre correctement
- S'il y a des erreurs de permission
- Si le healthcheck échoue

### 3. Vérifier le port mapping
Dans les paramètres de l'application Coolify :
- Port interne : 80
- Protocol : HTTP

### 4. Tester manuellement
Si vous avez accès SSH au serveur Coolify :

```bash
# Trouver le container
docker ps | grep bookingfast

# Vérifier les logs
docker logs <container-id>

# Entrer dans le container
docker exec -it <container-id> sh

# Vérifier que les fichiers existent
ls -la /usr/share/nginx/html

# Vérifier que nginx fonctionne
wget -O- http://localhost:80
```

## Problèmes courants

### Bad Gateway après le déploiement
- Vérifiez que toutes les variables `VITE_*` ont "Available at Buildtime" activé
- Redéployez complètement (ne pas juste restart)
- Vérifiez les logs du container

### Build échoue avec "vite: not found"
- Le Dockerfile a été mis à jour pour utiliser `npm ci` au lieu de `npm ci --only=production`
- Assurez-vous d'avoir la dernière version du repository

### Variables d'environnement non prises en compte
- Les variables Vite DOIVENT être préfixées par `VITE_`
- Elles DOIVENT être définies comme "Available at Buildtime"
- Elles sont compilées dans le code JavaScript (pas de runtime)
