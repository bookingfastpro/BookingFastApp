#!/bin/bash

# Script de build avec variables d'environnement
# Usage: ./build.sh

echo "🔨 Building BookingFast with environment variables..."

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant!"
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

# Vérifier que les variables Google Calendar sont présentes
if [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then
    echo "❌ VITE_GOOGLE_CLIENT_ID manquant dans .env"
    exit 1
fi

if [ -z "$VITE_GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ VITE_GOOGLE_CLIENT_SECRET manquant dans .env"
    exit 1
fi

echo "✅ Variables d'environnement chargées"
echo "📦 Client ID: ${VITE_GOOGLE_CLIENT_ID:0:20}..."

# Nettoyer le dossier dist
rm -rf dist

# Build avec Vite
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi!"
    echo "📁 Fichiers générés dans ./dist"
else
    echo "❌ Erreur lors du build"
    exit 1
fi
