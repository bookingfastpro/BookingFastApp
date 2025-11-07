# 🚀 Déploiement BookingFast en Production

## Configuration Coolify

### Option 1: Build + Preview (Recommandé)

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

Cette option utilise `vite preview` qui sert les fichiers buildés de manière optimisée.

### Option 2: Docker (Production complète)

**Dockerfile fourni** avec Nginx pour servir l'application.

**Build Command dans Coolify:**
```bash
docker build -t bookingfast .
```

**Start Command:**
```bash
docker run -p 80:80 bookingfast
```

### Option 3: Script de déploiement

**Build Command:**
```bash
chmod +x coolify-deploy.sh && ./coolify-deploy.sh
```

**Start Command:**
```bash
npm run start
```

## Variables d'environnement requises

Assurez-vous que ces variables sont configurées dans Coolify:

```env
VITE_SUPABASE_URL=https://bookingfast.hevolife.fr
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_GOOGLE_CLIENT_ID=votre_client_id
VITE_GOOGLE_CLIENT_SECRET=votre_client_secret
```

## Optimisations de production

✅ **Minification**: Code JavaScript et CSS minifié avec Terser
✅ **Tree-shaking**: Code mort supprimé automatiquement
✅ **Code splitting**: Chunks optimisés par vendor
✅ **Compression**: Gzip activé sur Nginx
✅ **Cache**: Assets statiques cachés 1 an
✅ **Console logs**: Supprimés en production
✅ **Source maps**: Désactivées pour réduire la taille

## Vérification du build

Après le build, vérifiez:

```bash
# Taille du bundle
du -sh dist

# Fichiers générés
ls -lh dist/assets/

# Test local du build
npm run preview
```

## Performance attendue

- **Bundle principal**: ~200-300 KB (gzippé)
- **Temps de chargement initial**: < 2s
- **Lighthouse Score**: > 90

## Troubleshooting

### Le build échoue
```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
```

### Variables d'environnement manquantes
Vérifiez que toutes les variables `VITE_*` sont définies dans Coolify.

### Port déjà utilisé
Le preview utilise le port 5173 par défaut. Modifiez dans `package.json` si nécessaire.
