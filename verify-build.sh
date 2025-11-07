#!/bin/bash

# Script de vérification du build production

echo "🔍 Vérification du build production..."
echo ""

# 1. Vérifier que dist/ existe
if [ -d "dist" ]; then
  echo "✅ Dossier dist/ trouvé"
else
  echo "❌ Dossier dist/ introuvable - Le build n'a pas été exécuté"
  exit 1
fi

# 2. Vérifier la présence de console.log dans les fichiers JS
echo ""
echo "🔍 Recherche de console.log dans les fichiers buildés..."
CONSOLE_COUNT=$(grep -r "console\.log" dist/assets/*.js 2>/dev/null | wc -l)

if [ "$CONSOLE_COUNT" -eq 0 ]; then
  echo "✅ Aucun console.log trouvé dans le build - PARFAIT!"
else
  echo "⚠️  $CONSOLE_COUNT console.log trouvés dans le build"
  echo ""
  echo "Fichiers concernés:"
  grep -r "console\.log" dist/assets/*.js 2>/dev/null | head -5
fi

# 3. Vérifier la minification
echo ""
echo "🔍 Vérification de la minification..."
FIRST_JS=$(find dist/assets -name "*.js" -type f | head -1)
if [ -f "$FIRST_JS" ]; then
  LINES=$(wc -l < "$FIRST_JS")
  if [ "$LINES" -lt 10 ]; then
    echo "✅ Code minifié correctement (fichier compact)"
  else
    echo "⚠️  Code non minifié (trop de lignes: $LINES)"
  fi
fi

# 4. Vérifier la taille des fichiers
echo ""
echo "📊 Taille du build:"
du -sh dist/

echo ""
echo "✅ Vérification terminée"
