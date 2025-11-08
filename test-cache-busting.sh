#!/bin/bash

echo "🧪 Test du système de cache busting"
echo ""

# Test 1: Build avec version personnalisée
echo "Test 1: Build avec version personnalisée (v1.0.0)"
export VITE_APP_VERSION="v1.0.0"
npm run build > /dev/null 2>&1

if ls dist/assets/*-v1.0.0-*.js > /dev/null 2>&1; then
    echo "✅ Les fichiers contiennent bien la version v1.0.0"
    ls dist/assets/*-v1.0.0-*.js | head -3
else
    echo "❌ Échec: les fichiers ne contiennent pas la version"
    exit 1
fi

echo ""

# Test 2: Build avec timestamp
echo "Test 2: Build avec timestamp automatique"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
export VITE_APP_VERSION=$TIMESTAMP
npm run build > /dev/null 2>&1

if ls dist/assets/*-${TIMESTAMP}-*.js > /dev/null 2>&1; then
    echo "✅ Les fichiers contiennent bien le timestamp $TIMESTAMP"
    ls dist/assets/*-${TIMESTAMP}-*.js | head -3
else
    echo "❌ Échec: les fichiers ne contiennent pas le timestamp"
    exit 1
fi

echo ""

# Test 3: Vérifier que le fichier cacheBuster existe
echo "Test 3: Vérification du fichier cacheBuster"
if [ -f "src/utils/cacheBuster.ts" ]; then
    echo "✅ Le fichier cacheBuster.ts existe"
else
    echo "❌ Le fichier cacheBuster.ts est manquant"
    exit 1
fi

echo ""

# Test 4: Vérifier le Dockerfile
echo "Test 4: Vérification du Dockerfile"
if grep -q "BUILD_TIMESTAMP" Dockerfile; then
    echo "✅ Le Dockerfile contient BUILD_TIMESTAMP"
else
    echo "❌ Le Dockerfile ne contient pas BUILD_TIMESTAMP"
    exit 1
fi

echo ""
echo "🎉 Tous les tests sont passés avec succès!"
echo ""
echo "Pour tester avec Docker:"
echo "  ./docker-build.sh"
echo ""
echo "Pour déployer avec Coolify:"
echo "  ./coolify-deploy.sh"
