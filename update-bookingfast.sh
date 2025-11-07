#!/bin/bash
set -e

APP_DIR="/var/www/bookingfast"
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Début mise à jour BookingFast - $DATE"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Vérifier que le répertoire de l'application existe
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Erreur: Le répertoire $APP_DIR n'existe pas"
    exit 1
fi

# Aller dans le répertoire
cd $APP_DIR

echo "📁 Répertoire actuel: $(pwd)"

# 1. Sauvegarde avant mise à jour
echo "💾 Création de la sauvegarde..."
if [ -f "/root/backup-bookingfast.sh" ]; then
    /root/backup-bookingfast.sh
else
    # Sauvegarde simple si le script n'existe pas
    tar -czf $BACKUP_DIR/bookingfast_$DATE.tar.gz -C $APP_DIR .
    echo "✅ Sauvegarde créée: bookingfast_$DATE.tar.gz"
fi

# 2. Corriger les permissions Git
echo "🔧 Correction des permissions Git..."
if [ -d ".git" ]; then
    # Corriger le problème de propriété Git
    git config --global --add safe.directory $APP_DIR
    chown -R root:root $APP_DIR/.git
    echo "✅ Permissions Git corrigées"
else
    echo "⚠️ Pas de repository Git trouvé"
fi

# 3. Mise à jour du code
echo "📥 Mise à jour du code source..."
if [ -d ".git" ]; then
    # Si Git est configuré
    echo "🔄 Git pull depuis le repository..."
    git pull origin main || {
        echo "❌ Erreur lors du git pull"
        echo "💡 Vérifiez que le repository est configuré et accessible"
        exit 1
    }
else
    echo "⚠️ Pas de Git configuré"
    echo "📋 Pour configurer Git :"
    echo "   git init"
    echo "   git remote add origin https://github.com/votre-username/bookingfast.git"
    echo "   git branch -M main"
    echo "   git pull origin main"
    echo ""
    echo "🛑 Mise à jour manuelle requise - Téléchargez et remplacez les fichiers"
    read -p "Appuyez sur Entrée quand c'est fait..."
fi

# 4. Vérifier et mettre à jour Node.js si nécessaire
echo "🔍 Vérification de Node.js..."
NODE_VERSION=$(node --version)
echo "📊 Version Node.js actuelle: $NODE_VERSION"

# Vérifier si Node.js est assez récent (v20+)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "⚠️ Node.js v$NODE_MAJOR détecté - Mise à jour vers v20 recommandée"
    echo "🔄 Mise à jour de Node.js vers v20..."
    
    # Installer Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Vérifier la nouvelle version
    NEW_NODE_VERSION=$(node --version)
    echo "✅ Node.js mis à jour vers: $NEW_NODE_VERSION"
else
    echo "✅ Version Node.js compatible: $NODE_VERSION"
fi

# 5. Nettoyage et installation des dépendances
echo "🧹 Nettoyage des dépendances..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "✅ node_modules supprimé"
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo "✅ package-lock.json supprimé"
fi

echo "📦 Installation des dépendances..."
npm install --production=false || {
    echo "❌ Erreur lors de l'installation des dépendances"
    echo "🔄 Tentative avec cache nettoyé..."
    npm cache clean --force
    npm install --production=false || {
        echo "❌ Échec définitif de l'installation"
        exit 1
    }
}

echo "✅ Dépendances installées avec succès"

# 6. Vérifier que Vite est disponible
echo "🔍 Vérification de Vite..."
if ! npx vite --version > /dev/null 2>&1; then
    echo "❌ Vite non trouvé - Installation globale..."
    npm install -g vite@latest
fi

VITE_VERSION=$(npx vite --version)
echo "✅ Vite disponible: $VITE_VERSION"

# 7. Build de production
echo "🔨 Build de production..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "✅ Ancien build supprimé"
fi

# Vérifier les variables d'environnement
if [ -f ".env.production" ]; then
    echo "📋 Utilisation de .env.production"
    cp .env.production .env
elif [ -f ".env" ]; then
    echo "📋 Utilisation de .env existant"
else
    echo "⚠️ Aucun fichier .env trouvé - création d'un fichier minimal"
    cat > .env << EOF
VITE_SUPABASE_URL=https://api.votre-domaine.com
VITE_SUPABASE_ANON_KEY=votre-anon-key
NODE_ENV=production
EOF
fi

# Lancer le build
npm run build || {
    echo "❌ Erreur lors du build"
    echo "🔍 Vérification des logs d'erreur..."
    npm run build 2>&1 | tail -20
    exit 1
}

# Vérifier que le build existe
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Build échoué - dist/index.html non trouvé"
    exit 1
fi

echo "✅ Build de production créé avec succès"

# 8. Mise à jour des permissions
echo "🔐 Mise à jour des permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
echo "✅ Permissions mises à jour"

# 9. Test de la configuration Nginx
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Configuration Nginx invalide"
    exit 1
fi

# 10. Redémarrer PM2 si utilisé
echo "🔄 Gestion des processus PM2..."
if command -v pm2 > /dev/null 2>&1; then
    if pm2 list | grep -q "online"; then
        pm2 restart all
        echo "✅ Processus PM2 redémarrés"
    else
        echo "ℹ️ Aucun processus PM2 en cours"
    fi
else
    echo "ℹ️ PM2 non installé"
fi

# 11. Redémarrer Supabase si auto-hébergé
echo "🗄️ Vérification Supabase..."
if [ -d "/opt/supabase" ]; then
    cd /opt/supabase
    if docker-compose ps | grep -q "Up"; then
        echo "🔄 Redémarrage des services Supabase..."
        docker-compose restart
        echo "✅ Supabase redémarré"
    else
        echo "⚠️ Services Supabase non actifs"
    fi
    cd $APP_DIR
else
    echo "ℹ️ Supabase auto-hébergé non détecté"
fi

# 12. Vérifications post-déploiement
echo "🔍 Vérifications post-déploiement..."

# Test de l'application
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Application accessible localement"
else
    echo "⚠️ Application non accessible localement"
fi

# Test Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx actif"
else
    echo "❌ Nginx inactif"
fi

# 13. Nettoyage
echo "🧹 Nettoyage..."
npm cache clean --force > /dev/null 2>&1 || true
echo "✅ Cache npm nettoyé"

# 14. Résumé final
echo ""
echo "🎉 =================================="
echo "✅ MISE À JOUR TERMINÉE AVEC SUCCÈS"
echo "🎉 =================================="
echo ""
echo "📊 Résumé de la mise à jour:"
echo "  📅 Date: $DATE"
echo "  📁 Répertoire: $APP_DIR"
echo "  🗂️ Sauvegarde: $BACKUP_DIR/bookingfast_$DATE.tar.gz"
echo "  📦 Node.js: $(node --version)"
echo "  🔨 Build: $(ls -la dist/index.html 2>/dev/null | awk '{print $5}' || echo 'N/A') bytes"
echo "  🌐 Nginx: $(systemctl is-active nginx)"
echo ""
echo "🔗 URLs à tester:"
echo "  📱 Application: https://votre-domaine.com"
echo "  🗄️ API: https://api.votre-domaine.com"
echo "  🎨 Studio: https://studio.votre-domaine.com"
echo ""
echo "💡 Prochaines étapes:"
echo "  1. Testez votre application dans le navigateur"
echo "  2. Vérifiez les logs: tail -f /var/log/nginx/error.log"
echo "  3. Surveillez les performances: htop"
echo ""
echo "🎯 Mise à jour terminée en $(date +%H:%M:%S) !"
