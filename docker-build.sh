#!/bin/bash

# Script de build Docker avec versionnement automatique
# Génère un timestamp unique à chaque build pour forcer la mise à jour

set -e

echo "🏗️  Starting Docker build with automatic versioning..."

# Générer un timestamp UNIX unique (en secondes depuis epoch)
BUILD_VERSION=$(date +%s)
echo "📦 Build version: $BUILD_VERSION"
echo "📅 Build date: $(date '+%Y-%m-%d %H:%M:%S')"

# Construire l'image Docker avec le timestamp
# NOTE: Le Dockerfile utilise déjà date +%s en interne si pas fourni
docker build \
  --no-cache \
  --build-arg VITE_APP_VERSION="$BUILD_VERSION" \
  -t bookingfast:latest \
  -t bookingfast:$BUILD_VERSION \
  .

echo ""
echo "✅ Docker image built successfully!"
echo "🏷️  Tags: bookingfast:latest, bookingfast:$BUILD_VERSION"
echo "🔢 Version: $BUILD_VERSION"
echo ""
echo "💡 This version will trigger update notifications on client browsers"
