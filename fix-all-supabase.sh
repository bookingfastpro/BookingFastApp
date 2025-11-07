#!/bin/bash

# Script pour corriger TOUS les fichiers d'un coup

echo "🔍 Recherche de tous les fichiers avec isSupabaseConfigured()..."

# Trouver tous les fichiers
files=$(grep -rl "isSupabaseConfigured()" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ -z "$files" ]; then
  echo "✅ Aucun fichier à corriger trouvé"
  exit 0
fi

echo "📝 Fichiers trouvés:"
echo "$files"
echo ""

# Corriger chaque fichier
for file in $files; do
  echo "🔧 Correction de: $file"
  # Remplacer isSupabaseConfigured() par isSupabaseConfigured
  sed -i 's/isSupabaseConfigured()/isSupabaseConfigured/g' "$file"
done

echo ""
echo "✅ Correction terminée!"
echo ""
echo "📊 Vérification finale..."
remaining=$(grep -r "isSupabaseConfigured()" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

if [ "$remaining" -eq 0 ]; then
  echo "✅ SUCCÈS: Tous les fichiers ont été corrigés!"
else
  echo "⚠️ ATTENTION: Il reste $remaining occurrences"
  grep -rn "isSupabaseConfigured()" src/ --include="*.ts" --include="*.tsx"
fi
