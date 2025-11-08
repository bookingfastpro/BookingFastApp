#!/bin/bash

# Script de build Docker avec cache busting automatique
# Ce script génère un timestamp unique pour chaque build

set -e

echo "🏗️  Starting Docker build with cache busting..."

# Générer un timestamp unique
BUILD_TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "📅 Build timestamp: $BUILD_TIMESTAMP"

# Construire l'image Docker avec le timestamp
docker build \
  --build-arg BUILD_TIMESTAMP="$BUILD_TIMESTAMP" \
  --build-arg VITE_APP_VERSION="$BUILD_TIMESTAMP" \
  -t bookingfast:latest \
  -t bookingfast:$BUILD_TIMESTAMP \
  .

echo "✅ Docker image built successfully!"
echo "🏷️  Tags: bookingfast:latest, bookingfast:$BUILD_TIMESTAMP"
echo "🔢 Version: $BUILD_TIMESTAMP"
