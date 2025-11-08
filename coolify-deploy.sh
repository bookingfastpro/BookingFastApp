#!/bin/bash

echo "🚀 Déploiement BookingFast en mode PRODUCTION"

# Générer un timestamp unique pour le cache busting
export BUILD_TIMESTAMP=$(date +%Y%m%d%H%M%S)
export VITE_APP_VERSION=$BUILD_TIMESTAMP
echo "📅 Build timestamp: $BUILD_TIMESTAMP"

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant!"
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

echo "✅ Variables d'environnement chargées"

# Nettoyer le dossier dist
echo "🧹 Nettoyage du dossier dist..."
rm -rf dist

# Build de production
echo "📦 Build de production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi!"
    echo "📁 Fichiers générés dans ./dist"
    
    # Afficher la taille du build
    echo "📊 Taille du build:"
    du -sh dist
    
    # Lister les fichiers principaux
    echo "📄 Fichiers principaux:"
    ls -lh dist/assets/*.js | head -5
else
    echo "❌ Erreur lors du build"
    exit 1
fi
