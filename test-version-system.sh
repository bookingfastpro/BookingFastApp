#!/bin/bash

# Script de test du système de versionnement automatique
# Permet de vérifier que la détection de nouvelle version fonctionne

set -e

echo "🧪 Test du système de versionnement automatique"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Vérifier que version.txt existe après le build
echo -e "${BLUE}📋 Étape 1: Vérification du fichier version.txt${NC}"
if [ -f "dist/version.txt" ]; then
    VERSION=$(cat dist/version.txt)
    echo -e "${GREEN}✅ version.txt trouvé${NC}"
    echo -e "   Version: ${YELLOW}$VERSION${NC}"
else
    echo -e "${RED}❌ version.txt introuvable dans dist/${NC}"
    echo "   Exécutez 'npm run build' d'abord"
    exit 1
fi

echo ""

# 2. Vérifier que la version est un timestamp valide
echo -e "${BLUE}📋 Étape 2: Validation du format de version${NC}"
if [[ "$VERSION" =~ ^[0-9]{13}$ ]]; then
    echo -e "${GREEN}✅ Format timestamp valide (13 chiffres)${NC}"
    # Convertir en date lisible
    READABLE_DATE=$(date -d @$((VERSION/1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "N/A")
    echo -e "   Date: ${YELLOW}$READABLE_DATE${NC}"
elif [[ "$VERSION" =~ ^[0-9]{10}$ ]]; then
    echo -e "${GREEN}✅ Format timestamp valide (10 chiffres - secondes)${NC}"
    READABLE_DATE=$(date -d @$VERSION '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "N/A")
    echo -e "   Date: ${YELLOW}$READABLE_DATE${NC}"
else
    echo -e "${YELLOW}⚠️  Format non-standard: $VERSION${NC}"
    echo "   Attendu: timestamp UNIX (10 ou 13 chiffres)"
fi

echo ""

# 3. Vérifier la présence des fichiers avec version dans le nom
echo -e "${BLUE}📋 Étape 3: Vérification des assets versionnés${NC}"
# Extraire les premiers 10 chiffres du timestamp (secondes)
VERSION_PREFIX=${VERSION:0:10}
VERSIONED_FILES=$(find dist/assets -name "*-${VERSION_PREFIX}*" | wc -l)
if [ "$VERSIONED_FILES" -gt 0 ]; then
    echo -e "${GREEN}✅ $VERSIONED_FILES fichiers versionnés trouvés${NC}"
    echo "   Exemples:"
    find dist/assets -name "*-${VERSION_PREFIX}*" | head -3 | sed 's/^/   - /'
else
    # Chercher n'importe quel timestamp
    TOTAL_FILES=$(find dist/assets -name "*.js" | wc -l)
    if [ "$TOTAL_FILES" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Fichiers trouvés mais format différent${NC}"
        echo "   Exemples:"
        find dist/assets -name "*.js" | head -3 | sed 's/^/   - /'
    else
        echo -e "${RED}❌ Aucun fichier dans dist/assets${NC}"
    fi
fi

echo ""

# 4. Vérifier le contenu de index.html
echo -e "${BLUE}📋 Étape 4: Vérification de index.html${NC}"
if grep -q "$VERSION_PREFIX" dist/index.html; then
    echo -e "${GREEN}✅ index.html référence des assets versionnés${NC}"
    # Compter combien de références versionnées
    COUNT=$(grep -o "$VERSION_PREFIX" dist/index.html | wc -l)
    echo -e "   Nombre de références: ${YELLOW}$COUNT${NC}"
else
    echo -e "${YELLOW}⚠️  Timestamp non trouvé dans index.html${NC}"
    echo "   Recherche de pattern asset..."
    if grep -q "assets/" dist/index.html; then
        echo -e "   ${GREEN}✓${NC} Références assets trouvées"
    fi
fi

echo ""

# 5. Simulation de vérification serveur
echo -e "${BLUE}📋 Étape 5: Test de détection de nouvelle version${NC}"
echo -e "   Simulation du comportement client:"
echo ""
echo -e "   ${YELLOW}Scénario:${NC}"
echo "   1. Client a la version: $VERSION"
echo "   2. Serveur déploie une nouvelle version"
echo "   3. Client vérifie /version.txt"
echo "   4. Détection: versions différentes → modal affiché"
echo ""
echo -e "   ${GREEN}✅ Comportement attendu:${NC}"
echo "   - Vérification au démarrage (après 2s)"
echo "   - Vérification périodique (toutes les 60s)"
echo "   - Modal 'Nouvelle version disponible'"
echo "   - Bouton 'Recharger maintenant'"

echo ""

# 6. Vérifier la configuration nginx
echo -e "${BLUE}📋 Étape 6: Vérification de nginx.conf${NC}"
if grep -q "location = /version.txt" nginx.conf; then
    echo -e "${GREEN}✅ Configuration nginx pour /version.txt trouvée${NC}"
    if grep -A2 "location = /version.txt" nginx.conf | grep -q "no-cache"; then
        echo -e "${GREEN}✅ Headers no-cache configurés${NC}"
    else
        echo -e "${RED}❌ Headers no-cache manquants${NC}"
    fi
else
    echo -e "${RED}❌ Configuration nginx pour /version.txt manquante${NC}"
fi

echo ""

# 7. Instructions de test manuel
echo -e "${BLUE}📋 Étape 7: Test manuel recommandé${NC}"
echo ""
echo "Pour tester le système complet:"
echo ""
echo "1. Déployez la version actuelle:"
echo "   ${YELLOW}./docker-build.sh${NC}"
echo ""
echo "2. Ouvrez l'application dans un navigateur"
echo "   Ouvrez la console (F12)"
echo ""
echo "3. Attendez les logs de vérification:"
echo "   ${GREEN}✅ Version check started (immediate + every 60s)${NC}"
echo "   ${GREEN}🔍 Version check: {...}${NC}"
echo ""
echo "4. Déployez une nouvelle version:"
echo "   ${YELLOW}./docker-build.sh${NC}"
echo ""
echo "5. Attendez max 60s, vous devriez voir:"
echo "   ${GREEN}🆕 New server version detected!${NC}"
echo "   ${GREEN}🚨 New version detected during periodic check!${NC}"
echo "   ${GREEN}→ Modal s'affiche automatiquement${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}✅ Test du système de versionnement terminé${NC}"
echo ""
echo "Documentation complète: AUTO_VERSION_DEPLOYMENT.md"
