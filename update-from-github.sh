#!/bin/bash
set -e

# Configuration
APP_DIR="/var/www/bookingfast"
BACKUP_DIR="/root/backups"
GITHUB_REPO="https://github.com/hevolife/bookingfast.git"
BRANCH="main"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 =================================="
echo "📱 MISE À JOUR BOOKINGFAST DEPUIS GITHUB"
echo "🚀 =================================="
echo ""
echo "📅 Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🔗 Repository: $GITHUB_REPO"
echo "🌿 Branche: $BRANCH"
echo "📁 Répertoire: $APP_DIR"
echo ""

# Fonction de log avec timestamp
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Vérifier que le répertoire de sauvegarde existe
mkdir -p $BACKUP_DIR

# 1. Sauvegarde avant mise à jour
log "💾 Création de la sauvegarde de sécurité..."
if [ -d "$APP_DIR" ]; then
    tar -czf $BACKUP_DIR/bookingfast_before_update_$DATE.tar.gz -C $(dirname $APP_DIR) $(basename $APP_DIR)
    log "✅ Sauvegarde créée: bookingfast_before_update_$DATE.tar.gz"
else
    log "⚠️ Répertoire $APP_DIR n'existe pas - création..."
    mkdir -p $APP_DIR
fi

# 2. Vérifier et installer Git si nécessaire
log "🔍 Vérification de Git..."
if ! command -v git &> /dev/null; then
    log "📦 Installation de Git..."
    apt update
    apt install -y git
    log "✅ Git installé"
else
    log "✅ Git déjà installé: $(git --version)"
fi

# 3. Vérifier et mettre à jour Node.js si nécessaire
log "🔍 Vérification de Node.js..."
NODE_VERSION=$(node --version 2>/dev/null || echo "non installé")
log "📊 Version Node.js actuelle: $NODE_VERSION"

# Extraire le numéro de version majeure
if [[ $NODE_VERSION =~ v([0-9]+) ]]; then
    NODE_MAJOR=${BASH_REMATCH[1]}
else
    NODE_MAJOR=0
fi

if [ "$NODE_MAJOR" -lt 20 ]; then
    log "⚠️ Node.js v$NODE_MAJOR détecté - Mise à jour vers v20 requise..."
    log "🔄 Installation de Node.js v20..."
    
    # Installer Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Vérifier la nouvelle version
    NEW_NODE_VERSION=$(node --version)
    log "✅ Node.js mis à jour vers: $NEW_NODE_VERSION"
else
    log "✅ Version Node.js compatible: $NODE_VERSION"
fi

# 4. Cloner ou mettre à jour le repository
log "📥 Récupération du code depuis GitHub..."

if [ -d "$APP_DIR/.git" ]; then
    log "🔄 Repository existant détecté - mise à jour..."
    cd $APP_DIR
    
    # Corriger le problème de propriété Git
    git config --global --add safe.directory $APP_DIR
    chown -R root:root $APP_DIR/.git
    
    # Sauvegarder les modifications locales si elles existent
    if ! git diff --quiet; then
        log "💾 Sauvegarde des modifications locales..."
        git stash push -m "Modifications locales avant mise à jour $DATE"
    fi
    
    # Récupérer les dernières modifications
    git fetch origin
    git reset --hard origin/$BRANCH
    log "✅ Code mis à jour depuis GitHub"
    
else
    log "🆕 Premier clonage du repository..."
    
    # Supprimer le répertoire s'il existe mais n'est pas un repo Git
    if [ -d "$APP_DIR" ]; then
        rm -rf $APP_DIR
    fi
    
    # Cloner le repository
    git clone $GITHUB_REPO $APP_DIR
    cd $APP_DIR
    
    # Configurer Git
    git config --global --add safe.directory $APP_DIR
    chown -R root:root $APP_DIR
    
    log "✅ Repository cloné avec succès"
fi

# 5. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log "❌ Erreur: package.json non trouvé dans $APP_DIR"
    log "📁 Contenu du répertoire:"
    ls -la
    exit 1
fi

log "✅ Fichier package.json trouvé"

# 6. Nettoyage et installation des dépendances
log "🧹 Nettoyage des anciennes dépendances..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    log "✅ node_modules supprimé"
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    log "✅ package-lock.json supprimé"
fi

log "📦 Installation des dépendances..."
npm install || {
    log "❌ Erreur lors de l'installation des dépendances"
    log "🔄 Tentative avec cache nettoyé..."
    npm cache clean --force
    npm install || {
        log "❌ Échec définitif de l'installation"
        exit 1
    }
}

log "✅ Dépendances installées avec succès"

# 7. Vérifier que Vite est disponible
log "🔍 Vérification de Vite..."
if ! npx vite --version > /dev/null 2>&1; then
    log "❌ Vite non trouvé - Installation..."
    npm install -g vite@latest
fi

VITE_VERSION=$(npx vite --version)
log "✅ Vite disponible: $VITE_VERSION"

# 8. Configuration des variables d'environnement
log "⚙️ Configuration des variables d'environnement..."
if [ -f ".env.production" ]; then
    log "📋 Utilisation de .env.production"
    cp .env.production .env
elif [ -f ".env.example" ]; then
    log "📋 Copie de .env.example vers .env"
    cp .env.example .env
    log "⚠️ N'oubliez pas de configurer vos variables dans .env"
elif [ ! -f ".env" ]; then
    log "⚠️ Aucun fichier .env trouvé - création d'un fichier minimal"
    cat > .env << EOF
# Configuration BookingFast
VITE_SUPABASE_URL=https://api.votre-domaine.com
VITE_SUPABASE_ANON_KEY=votre-anon-key
NODE_ENV=production
EOF
    log "📝 Fichier .env créé - configurez vos variables Supabase"
fi

# 9. Build de production
log "🔨 Build de production..."
if [ -d "dist" ]; then
    rm -rf dist
    log "✅ Ancien build supprimé"
fi

# Lancer le build
npm run build || {
    log "❌ Erreur lors du build"
    log "🔍 Dernières lignes d'erreur:"
    npm run build 2>&1 | tail -10
    exit 1
}

# Vérifier que le build existe
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    log "❌ Build échoué - dist/index.html non trouvé"
    exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
log "✅ Build de production créé avec succès ($BUILD_SIZE)"

# 10. Mise à jour des permissions
log "🔐 Mise à jour des permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
log "✅ Permissions mises à jour"

# 11. Test de la configuration Nginx
log "🧪 Test de la configuration Nginx..."
if nginx -t; then
    log "✅ Configuration Nginx valide"
    systemctl reload nginx
    log "✅ Nginx rechargé"
else
    log "❌ Configuration Nginx invalide"
    nginx -t
    exit 1
fi

# 12. Gestion de PM2 (optionnel)
log "🔄 Gestion des processus PM2..."
if command -v pm2 > /dev/null 2>&1; then
    if pm2 list | grep -q "online"; then
        pm2 restart all
        log "✅ Processus PM2 redémarrés"
    else
        log "ℹ️ Aucun processus PM2 en cours"
    fi
else
    log "ℹ️ PM2 non installé"
fi

# 13. Redémarrer Supabase si auto-hébergé
log "🗄️ Vérification Supabase auto-hébergé..."
if [ -d "/opt/supabase" ]; then
    cd /opt/supabase
    if docker-compose ps | grep -q "Up"; then
        log "🔄 Redémarrage des services Supabase..."
        docker-compose restart
        log "✅ Supabase redémarré"
    else
        log "⚠️ Services Supabase non actifs"
    fi
    cd $APP_DIR
else
    log "ℹ️ Supabase auto-hébergé non détecté"
fi

# 14. Vérifications post-déploiement
log "🔍 Vérifications post-déploiement..."

# Test de l'application
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
if [[ "$HTTP_STATUS" =~ ^(200|301|302)$ ]]; then
    log "✅ Application accessible localement (HTTP $HTTP_STATUS)"
else
    log "⚠️ Application non accessible localement (HTTP $HTTP_STATUS)"
fi

# Test Nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx actif"
else
    log "❌ Nginx inactif"
fi

# 15. Nettoyage
log "🧹 Nettoyage final..."
npm cache clean --force > /dev/null 2>&1 || true
log "✅ Cache npm nettoyé"

# 16. Résumé final
echo ""
echo "🎉 =================================="
echo "✅ MISE À JOUR TERMINÉE AVEC SUCCÈS"
echo "🎉 =================================="
echo ""
echo "📊 Résumé de la mise à jour:"
echo "  📅 Date: $DATE"
echo "  🔗 Repository: $GITHUB_REPO"
echo "  📁 Répertoire: $APP_DIR"
echo "  🗂️ Sauvegarde: $BACKUP_DIR/bookingfast_before_update_$DATE.tar.gz"
echo "  📦 Node.js: $(node --version)"
echo "  🔨 Vite: $(npx vite --version 2>/dev/null || echo 'N/A')"
echo "  📏 Taille build: $BUILD_SIZE"
echo "  🌐 Nginx: $(systemctl is-active nginx)"
echo "  🔄 PM2: $(command -v pm2 > /dev/null && echo 'Installé' || echo 'Non installé')"
echo ""
echo "🔗 URLs à tester:"
echo "  📱 Application: https://votre-domaine.com"
echo "  🗄️ API: https://api.votre-domaine.com (si Supabase auto-hébergé)"
echo ""
echo "💡 Prochaines étapes:"
echo "  1. Testez votre application dans le navigateur"
echo "  2. Vérifiez les logs: tail -f /var/log/nginx/error.log"
echo "  3. Surveillez les performances: htop"
echo ""
echo "🎯 Mise à jour terminée en $(date +%H:%M:%S) !"
echo ""

# Afficher les derniers commits
log "📋 Derniers commits récupérés:"
git log --oneline -5
