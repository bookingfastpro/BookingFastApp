# 🚀 **Guide Complet d'Installation BookingFast sur VPS**

## **📋 Prérequis**
- VPS Ubuntu 20.04+ ou Debian 11+ (minimum 4GB RAM, 20GB stockage)
- Accès root ou sudo
- Nom de domaine pointant vers votre VPS
- Compte Supabase Cloud (pour migration) ou nouveau projet

---

## **1️⃣ PRÉPARATION DU VPS**

### **Connexion et mise à jour :**
```bash
# Connexion SSH
ssh root@votre-ip-vps

# Mise à jour du système
apt update && apt upgrade -y

# Installation des outils de base
apt install -y curl wget git unzip software-properties-common build-essential
```

### **Installation Node.js 18+ :**
```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Installer Node.js
apt install -y nodejs

# Vérifier l'installation
node --version  # Doit afficher v18.x.x ou plus
npm --version
```

### **Installation PM2 (gestionnaire de processus) :**
```bash
npm install -g pm2
```

---

## **2️⃣ INSTALLATION DOCKER & DOCKER COMPOSE**

### **Installation Docker :**
```bash
# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
usermod -aG docker $USER

# Installation Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

---

## **3️⃣ INSTALLATION NGINX**

```bash
# Installation Nginx
apt install -y nginx

# Démarrer et activer Nginx
systemctl start nginx
systemctl enable nginx

# Vérifier le statut
systemctl status nginx
```

---

## **4️⃣ CONFIGURATION SSL (Let's Encrypt)**

```bash
# Installation Certbot
apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL (remplacez votre-domaine.com)
certbot --nginx -d bookingfast.pro -d www.bookingfast.pro -d api.bookingfast.pro -d studio.bookingfast.pro

# Vérifier le renouvellement automatique
certbot renew --dry-run
```

---

## **5️⃣ INSTALLATION SUPABASE AUTO-HÉBERGÉ**

### **Installation Supabase CLI :**
```bash
# Installation via npm
npm install -g supabase

# Vérification
supabase --version
```

### **Configuration Supabase :**
```bash
# Créer le répertoire
mkdir -p /opt/supabase
cd /opt/supabase

# Initialiser Supabase
supabase init

# Générer les clés JWT
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 32  # Pour POSTGRES_PASSWORD
```

### **Configuration personnalisée :**
```bash
# Éditer la configuration
nano supabase/config.toml
```

```toml
# Configuration Supabase Production
project_id = "bookingfast-production"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "https://bookingfast.pro"
additional_redirect_urls = ["https://bookingfast.pro/**"]
jwt_expiry = 3600
enable_signup = true
enable_confirmations = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "https://api.votre-domaine.com"

[storage]
enabled = true
file_size_limit = "50MiB"
```

### **Variables d'environnement Supabase :**
```bash
nano .env
```

```env
# Supabase Configuration
POSTGRES_PASSWORD=votre-mot-de-passe-postgres-securise
JWT_SECRET=votre-jwt-secret-genere
ANON_KEY=votre-anon-key
SERVICE_ROLE_KEY=votre-service-role-key
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=votre-mot-de-passe-admin-securise

# API Configuration
API_EXTERNAL_URL=https://api.votre-domaine.com
SUPABASE_PUBLIC_URL=https://api.votre-domaine.com
STUDIO_DEFAULT_ORGANIZATION=BookingFast
STUDIO_DEFAULT_PROJECT=Production

# Email Configuration (optionnel)
SMTP_ADMIN_EMAIL=admin@votre-domaine.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
```

---

## **6️⃣ DÉPLOIEMENT DE L'APPLICATION BOOKINGFAST**

### **Télécharger et préparer l'application :**
```bash
# Aller dans le répertoire web
cd /var/www

# Option 1: Cloner depuis Git (si vous avez un repository)
git clone https://github.com/votre-username/bookingfast.git
cd bookingfast

# Option 2: Télécharger depuis Bolt (recommandé)
# Téléchargez le ZIP depuis Bolt et uploadez-le sur votre VPS
wget https://votre-lien-de-telechargement.zip
unzip bookingfast.zip
cd bookingfast

# Ou utilisez scp pour copier depuis votre machine locale :
# scp -r ./bookingfast root@votre-ip-vps:/var/www/
```

### **Configuration des variables d'environnement :**
```bash
cd /var/www/bookingfast
nano .env.production
```

```env
# Supabase VPS Configuration
VITE_SUPABASE_URL=https://api.votre-domaine.com
VITE_SUPABASE_ANON_KEY=votre-anon-key-supabase-vps

# Stripe Configuration (optionnel)
VITE_STRIPE_PUBLIC_KEY=pk_live_votre-cle-publique-stripe

# Application
NODE_ENV=production
VITE_APP_URL=https://votre-domaine.com
```

### **Installation et build :**
```bash
# Installer les dépendances
npm ci --only=production

# Build de production avec les bonnes variables
cp .env.production .env
npm run build

# Vérifier que le build existe
ls -la dist/
```

---

## **7️⃣ MIGRATION DES DONNÉES (Si migration depuis Cloud)**

### **Export depuis Supabase Cloud :**
```bash
# Se connecter à votre projet cloud
supabase login

# Lier votre projet cloud
supabase link --project-ref votre-ref-projet-cloud

# Export complet
supabase db dump > /root/supabase-cloud-backup.sql

# Export par parties (plus sûr)
supabase db dump --schema-only > /root/schema.sql
supabase db dump --data-only > /root/data.sql
```

### **Import dans Supabase VPS :**
```bash
# Démarrer Supabase VPS
cd /opt/supabase
supabase start

# Attendre que tous les services soient prêts
sleep 60

# Import du schéma
psql "postgresql://postgres:$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)@localhost:54322/postgres" < /root/schema.sql

# Import des données
psql "postgresql://postgres:$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)@localhost:54322/postgres" < /root/data.sql

# Vérifier l'import
psql "postgresql://postgres:$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)@localhost:54322/postgres" -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings  
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'clients', COUNT(*) FROM clients;
"
```

---

## **8️⃣ CONFIGURATION NGINX COMPLÈTE**

### **Configuration principale :**
```bash
nano /etc/nginx/sites-available/bookingfast
```

```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name votre-domaine.com www.votre-domaine.com api.votre-domaine.com studio.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

# Application principale
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Root directory
    root /var/www/bookingfast/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache HTML files for a short time
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
        }
    }

    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|config)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# API Supabase
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.votre-domaine.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy vers Supabase API
    location / {
        proxy_pass http://localhost:54321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "authorization, x-client-info, apikey, content-type" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "authorization, x-client-info, apikey, content-type" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}

# Studio Supabase (interface admin)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name studio.votre-domaine.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Authentification basique pour sécuriser l'accès
    auth_basic "Supabase Studio";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # Proxy vers Studio
    location / {
        proxy_pass http://localhost:54323;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Activer la configuration :**
```bash
# Créer le lien symbolique
ln -s /etc/nginx/sites-available/bookingfast /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut
rm -f /etc/nginx/sites-enabled/default

# Créer un mot de passe pour Studio
apt install -y apache2-utils
htpasswd -c /etc/nginx/.htpasswd admin

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

---

## **9️⃣ DÉMARRAGE SUPABASE**

### **Démarrer les services :**
```bash
cd /opt/supabase

# Démarrer Supabase
supabase start

# Vérifier que tous les services tournent
docker ps

# Afficher les informations de connexion
supabase status
```

### **Configuration en service système :**
```bash
nano /etc/systemd/system/supabase.service
```

```ini
[Unit]
Description=Supabase Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/supabase
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=300
User=root

[Install]
WantedBy=multi-user.target
```

```bash
# Activer le service
systemctl daemon-reload
systemctl enable supabase.service
systemctl start supabase.service

# Vérifier le statut
systemctl status supabase.service
```

---

## **🔟 MIGRATION DES DONNÉES (Si migration depuis Cloud)**

### **Script de migration automatique :**
```bash
nano /root/migrate-from-cloud.sh
```

```bash
#!/bin/bash
set -e

echo "🚀 Début migration Supabase Cloud → VPS"

# Variables (À MODIFIER)
CLOUD_PROJECT_REF="votre-ref-projet-cloud"
BACKUP_DIR="/root/migration-backup"
SUPABASE_DIR="/opt/supabase"

# Créer les répertoires
mkdir -p $BACKUP_DIR
cd $SUPABASE_DIR

echo "📥 Export depuis Supabase Cloud..."
# Se connecter au cloud
supabase login

# Lier le projet cloud
supabase link --project-ref $CLOUD_PROJECT_REF

# Export complet
supabase db dump > $BACKUP_DIR/full_backup.sql
echo "✅ Export terminé"

echo "🛑 Arrêt des services locaux..."
supabase stop

echo "🗑️ Nettoyage des données locales..."
docker volume prune -f

echo "🚀 Redémarrage des services..."
supabase start

echo "⏳ Attente que les services soient prêts..."
sleep 60

echo "📤 Import des données..."
# Import des données
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
psql "postgresql://postgres:$POSTGRES_PASSWORD@localhost:54322/postgres" < $BACKUP_DIR/full_backup.sql

echo "🔍 Vérification des données..."
psql "postgresql://postgres:$POSTGRES_PASSWORD@localhost:54322/postgres" -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings  
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'business_settings', COUNT(*) FROM business_settings;
"

echo "✅ Migration terminée !"
echo "🔗 API URL: https://api.votre-domaine.com"
echo "🎨 Studio URL: https://studio.votre-domaine.com"
echo "📱 App URL: https://votre-domaine.com"
```

```bash
chmod +x /root/migrate-from-cloud.sh
# Exécuter la migration
/root/migrate-from-cloud.sh
```

---

## **1️⃣1️⃣ DÉPLOIEMENT DES EDGE FUNCTIONS**

### **Copier les Edge Functions :**
```bash
cd /opt/supabase

# Créer le répertoire des fonctions
mkdir -p supabase/functions

# Copier vos fonctions depuis l'application
cp -r /var/www/bookingfast/supabase/functions/* supabase/functions/

# Déployer toutes les fonctions
supabase functions deploy stripe-webhook
supabase functions deploy stripe-checkout  
supabase functions deploy public-booking-data
supabase functions deploy send-brevo-email
supabase functions deploy list-users
supabase functions deploy create-app-user
supabase functions deploy delete-app-user
supabase functions deploy invite-team-member
supabase functions deploy create-affiliate-account

# Vérifier le déploiement
supabase functions list
```

---

## **1️⃣2️⃣ CONFIGURATION DES PERMISSIONS**

### **Permissions des fichiers :**
```bash
# Application
chown -R www-data:www-data /var/www/bookingfast
chmod -R 755 /var/www/bookingfast

# Supabase
chown -R root:root /opt/supabase
chmod -R 755 /opt/supabase

# Logs
mkdir -p /var/log/bookingfast
chown -R www-data:www-data /var/log/bookingfast
```

---

## **1️⃣3️⃣ CONFIGURATION FIREWALL**

```bash
# Installer UFW
apt install -y ufw

# Configurer les règles
ufw default deny incoming
ufw default allow outgoing

# Autoriser les services nécessaires
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 54321  # API Supabase
ufw allow 54323  # Studio Supabase

# Activer le firewall
ufw enable

# Vérifier le statut
ufw status verbose
```

---

## **1️⃣4️⃣ SAUVEGARDES AUTOMATIQUES**

### **Script de sauvegarde complet :**
```bash
nano /root/backup-complete.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
APP_DIR="/var/www/bookingfast"
SUPABASE_DIR="/opt/supabase"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

echo "🔄 Début sauvegarde complète - $DATE"

# 1. Sauvegarde de l'application
echo "📱 Sauvegarde application..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# 2. Sauvegarde de la base de données
echo "🗄️ Sauvegarde base de données..."
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD $SUPABASE_DIR/.env | cut -d '=' -f2)
docker exec supabase_db_1 pg_dump -U postgres postgres > $BACKUP_DIR/database_$DATE.sql

# 3. Sauvegarde des volumes Docker
echo "🐳 Sauvegarde volumes Docker..."
tar -czf $BACKUP_DIR/volumes_$DATE.tar.gz -C $SUPABASE_DIR volumes/

# 4. Sauvegarde de la configuration
echo "⚙️ Sauvegarde configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C / etc/nginx/sites-available/bookingfast opt/supabase/.env opt/supabase/supabase/

# 5. Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

# 6. Créer un résumé
echo "📊 Résumé sauvegarde $DATE:" > $BACKUP_DIR/summary_$DATE.txt
echo "- Application: $(du -h $BACKUP_DIR/app_$DATE.tar.gz | cut -f1)" >> $BACKUP_DIR/summary_$DATE.txt
echo "- Base de données: $(du -h $BACKUP_DIR/database_$DATE.sql | cut -f1)" >> $BACKUP_DIR/summary_$DATE.txt
echo "- Volumes: $(du -h $BACKUP_DIR/volumes_$DATE.tar.gz | cut -f1)" >> $BACKUP_DIR/summary_$DATE.txt
echo "- Configuration: $(du -h $BACKUP_DIR/config_$DATE.tar.gz | cut -f1)" >> $BACKUP_DIR/summary_$DATE.txt

echo "✅ Sauvegarde complète terminée - $DATE"
```

```bash
chmod +x /root/backup-complete.sh

# Tester la sauvegarde
/root/backup-complete.sh

# Programmer les sauvegardes automatiques
crontab -e
# Ajouter ces lignes :
# Sauvegarde complète quotidienne à 3h
0 3 * * * /root/backup-complete.sh

# Sauvegarde rapide de la DB toutes les 6h
0 */6 * * * docker exec supabase_db_1 pg_dump -U postgres postgres > /root/backups/quick_$(date +\%H).sql
```

---

## **1️⃣5️⃣ MONITORING ET ALERTES**

### **Installation Netdata :**
```bash
# Installation Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait

# Configuration
nano /etc/netdata/netdata.conf
```

```ini
[global]
    hostname = bookingfast-vps
    
[web]
    bind to = localhost
    allow connections from = localhost 127.0.0.1
```

### **Script de monitoring :**
```bash
nano /root/monitor-services.sh
```

```bash
#!/bin/bash
LOG_FILE="/var/log/bookingfast/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Fonction de log
log() {
    echo "[$DATE] $1" >> $LOG_FILE
}

# Vérifier Nginx
if ! systemctl is-active --quiet nginx; then
    log "❌ Nginx arrêté - redémarrage..."
    systemctl restart nginx
    log "🔄 Nginx redémarré"
fi

# Vérifier Supabase
if ! docker ps | grep -q supabase_kong_1; then
    log "❌ Supabase arrêté - redémarrage..."
    cd /opt/supabase
    docker-compose restart
    log "🔄 Supabase redémarré"
fi

# Vérifier l'espace disque
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    log "⚠️ Espace disque critique: ${DISK_USAGE}%"
    # Nettoyer les logs anciens
    find /var/log -name "*.log" -mtime +7 -delete
    docker system prune -f
fi

# Vérifier la mémoire
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 90 ]; then
    log "⚠️ Mémoire critique: ${MEM_USAGE}%"
fi

# Test de connectivité API
if ! curl -s https://api.votre-domaine.com/rest/v1/ > /dev/null; then
    log "❌ API Supabase inaccessible"
fi

# Test de l'application
if ! curl -s https://votre-domaine.com > /dev/null; then
    log "❌ Application inaccessible"
fi

log "✅ Monitoring terminé - Tout OK"
```

```bash
chmod +x /root/monitor-services.sh

# Programmer le monitoring (toutes les 5 minutes)
crontab -e
# Ajouter :
*/5 * * * * /root/monitor-services.sh
```

---

## **1️⃣6️⃣ SCRIPT DE MISE À JOUR**

### **Script de mise à jour automatique :**
```bash
nano /root/update-bookingfast.sh
```

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/bookingfast"
SUPABASE_DIR="/opt/supabase"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Début mise à jour BookingFast - $DATE"

# 1. Sauvegarde avant mise à jour
echo "💾 Sauvegarde avant mise à jour..."
/root/backup-complete.sh

# 2. Mise à jour de l'application
echo "📱 Mise à jour application..."
cd $APP_DIR

# Si Git
if [ -d ".git" ]; then
    git pull origin main
else
    echo "⚠️ Pas de repository Git - mise à jour manuelle requise"
    echo "Téléchargez la nouvelle version et remplacez les fichiers"
    read -p "Appuyez sur Entrée quand c'est fait..."
fi

# 3. Mise à jour des dépendances
echo "📦 Mise à jour dépendances..."
npm ci --only=production

# 4. Build de production
echo "🔨 Build de production..."
npm run build

# 5. Mise à jour Supabase
echo "🗄️ Mise à jour Supabase..."
cd $SUPABASE_DIR

# Mettre à jour Supabase CLI
npm update -g supabase

# Appliquer les nouvelles migrations
if [ -d "$APP_DIR/supabase/migrations" ]; then
    cp -r $APP_DIR/supabase/migrations/* supabase/migrations/ 2>/dev/null || true
    supabase db push
fi

# Redéployer les Edge Functions
if [ -d "$APP_DIR/supabase/functions" ]; then
    cp -r $APP_DIR/supabase/functions/* supabase/functions/
    
    # Déployer chaque fonction
    for func in supabase/functions/*/; do
        if [ -d "$func" ]; then
            func_name=$(basename "$func")
            echo "🚀 Déploiement fonction: $func_name"
            supabase functions deploy $func_name
        fi
    done
fi

# 6. Redémarrer les services
echo "🔄 Redémarrage des services..."
systemctl reload nginx
docker-compose restart

# 7. Vérifications
echo "🔍 Vérifications post-mise à jour..."
sleep 30

# Test API
if curl -s https://api.votre-domaine.com/rest/v1/ > /dev/null; then
    echo "✅ API OK"
else
    echo "❌ API KO"
fi

# Test App
if curl -s https://votre-domaine.com > /dev/null; then
    echo "✅ Application OK"
else
    echo "❌ Application KO"
fi

echo "✅ Mise à jour terminée - $DATE"
```

```bash
chmod +x /root/update-bookingfast.sh
```

---

## **1️⃣7️⃣ OPTIMISATIONS PERFORMANCES**

### **Optimisations PostgreSQL :**
```bash
# Éditer la configuration PostgreSQL
nano /opt/supabase/volumes/db/postgresql.conf
```

```conf
# Optimisations pour production VPS
shared_buffers = 1GB                    # 25% de la RAM
effective_cache_size = 3GB              # 75% de la RAM
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 200

# Logging
log_min_duration_statement = 1000      # Log requêtes > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

### **Optimisations Nginx :**
```bash
nano /etc/nginx/nginx.conf
```

```nginx
# Dans le bloc http, ajouter :
client_max_body_size 10M;
client_body_timeout 60s;
client_header_timeout 60s;
keepalive_timeout 65;
send_timeout 60s;

# Cache
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
```

---

## **1️⃣8️⃣ SÉCURITÉ AVANCÉE**

### **Fail2Ban :**
```bash
# Installation
apt install -y fail2ban

# Configuration
nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
```

```bash
# Redémarrer Fail2Ban
systemctl restart fail2ban
systemctl enable fail2ban
```

### **Configuration iptables additionnelle :**
```bash
# Bloquer les ports Supabase depuis l'extérieur
iptables -A INPUT -p tcp --dport 54321 -s localhost -j ACCEPT
iptables -A INPUT -p tcp --dport 54321 -j DROP
iptables -A INPUT -p tcp --dport 54322 -s localhost -j ACCEPT  
iptables -A INPUT -p tcp --dport 54322 -j DROP
iptables -A INPUT -p tcp --dport 54323 -s localhost -j ACCEPT
iptables -A INPUT -p tcp --dport 54323 -j DROP

# Sauvegarder les règles
iptables-save > /etc/iptables/rules.v4
```

---

## **1️⃣9️⃣ TESTS FINAUX**

### **Script de test complet :**
```bash
nano /root/test-installation.sh
```

```bash
#!/bin/bash
echo "🧪 Tests d'installation BookingFast"

# Test 1: Services système
echo "1️⃣ Test services système..."
systemctl is-active nginx && echo "✅ Nginx OK" || echo "❌ Nginx KO"
systemctl is-active supabase && echo "✅ Supabase Service OK" || echo "❌ Supabase Service KO"

# Test 2: Services Docker
echo "2️⃣ Test services Docker..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase

# Test 3: Connectivité réseau
echo "3️⃣ Test connectivité..."
curl -I https://votre-domaine.com && echo "✅ App accessible" || echo "❌ App inaccessible"
curl -I https://api.votre-domaine.com/rest/v1/ && echo "✅ API accessible" || echo "❌ API inaccessible"
curl -I https://studio.votre-domaine.com && echo "✅ Studio accessible" || echo "❌ Studio inaccessible"

# Test 4: Base de données
echo "4️⃣ Test base de données..."
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD /opt/supabase/.env | cut -d '=' -f2)
psql "postgresql://postgres:$POSTGRES_PASSWORD@localhost:54322/postgres" -c "SELECT version();" && echo "✅ DB OK" || echo "❌ DB KO"

# Test 5: Authentification
echo "5️⃣ Test authentification..."
ANON_KEY=$(grep ANON_KEY /opt/supabase/.env | cut -d '=' -f2)
curl -s "https://api.votre-domaine.com/auth/v1/settings" \
  -H "apikey: $ANON_KEY" && echo "✅ Auth OK" || echo "❌ Auth KO"

# Test 6: Edge Functions
echo "6️⃣ Test Edge Functions..."
supabase functions list

echo "🎉 Tests terminés !"
```

```bash
chmod +x /root/test-installation.sh
/root/test-installation.sh
```

---

## **2️⃣0️⃣ CONFIGURATION DNS FINALE**

### **Enregistrements DNS requis :**
```
# Ajouter ces enregistrements dans votre DNS :
Type  Nom                     Valeur              TTL
A     votre-domaine.com       IP-DE-VOTRE-VPS     300
A     www.votre-domaine.com   IP-DE-VOTRE-VPS     300  
A     api.votre-domaine.com   IP-DE-VOTRE-VPS     300
A     studio.votre-domaine.com IP-DE-VOTRE-VPS    300
```

---

## **🎯 CHECKLIST FINALE D'INSTALLATION**

### **✅ Vérifications obligatoires :**
- [ ] VPS configuré et sécurisé
- [ ] Docker et Docker Compose installés
- [ ] Node.js 18+ installé
- [ ] Nginx configuré avec SSL
- [ ] Supabase auto-hébergé démarré
- [ ] Base de données migrée et vérifiée
- [ ] Edge Functions déployées
- [ ] Application buildée et déployée
- [ ] Variables d'environnement configurées
- [ ] Certificats SSL actifs pour tous les domaines
- [ ] Firewall configuré
- [ ] Sauvegardes automatiques programmées
- [ ] Monitoring en place
- [ ] Tests de connectivité réussis

### **🔗 URLs finales :**
- **Application :** `https://votre-domaine.com`
- **API Supabase :** `https://api.votre-domaine.com`
- **Studio Supabase :** `https://studio.votre-domaine.com`
- **Monitoring :** `https://votre-domaine.com:19999`
- **Iframe réservation :** `https://votre-domaine.com/booking/USER_ID`

---

## **🚨 DÉPANNAGE RAPIDE**

### **Problèmes courants :**

**1. Services Supabase ne démarrent pas :**
```bash
cd /opt/supabase
docker-compose logs
docker-compose down && docker-compose up -d
```

**2. Erreur 502 Bad Gateway :**
```bash
# Vérifier les services
docker ps
systemctl status nginx
# Redémarrer si nécessaire
docker-compose restart
systemctl restart nginx
```

**3. Base de données inaccessible :**
```bash
# Vérifier le container DB
docker logs supabase_db_1
# Redémarrer si nécessaire
docker-compose restart db
```

**4. Edge Functions ne fonctionnent pas :**
```bash
# Redéployer les fonctions
cd /opt/supabase
supabase functions deploy --no-verify-jwt stripe-webhook
```

**5. Certificats SSL expirés :**
```bash
# Renouveler
certbot renew --force-renewal
systemctl reload nginx
```

---

## **📞 COMMANDES DE MAINTENANCE QUOTIDIENNE**

```bash
# Statut général
systemctl status nginx supabase
docker ps

# Logs en temps réel
tail -f /var/log/nginx/error.log
docker-compose logs -f

# Espace disque
df -h

# Mémoire
free -h

# Sauvegarde manuelle
/root/backup-complete.sh

# Mise à jour
/root/update-bookingfast.sh

# Tests
/root/test-installation.sh
```

---

## **🎉 FÉLICITATIONS !**

Votre installation BookingFast est maintenant **100% auto-hébergée** sur votre VPS avec :

- ⚡ **Performance optimale**
- 🔒 **Sécurité maximale** 
- 💾 **Sauvegardes automatiques**
- 📊 **Monitoring complet**
- 🔄 **Mise à jour simplifiée**
- 💰 **Coûts maîtrisés**

**Temps d'installation total :** 3-6 heures selon la taille de vos données.

**Support :** Gardez ce fichier comme référence pour la maintenance ! 📚
