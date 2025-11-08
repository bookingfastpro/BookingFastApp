FROM node:20-alpine AS builder

# Arguments pour les variables d'environnement de build (toutes optionnelles)
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_SUPABASE_SERVICE_ROLE_KEY=""
ARG VITE_STRIPE_PUBLIC_KEY=""
ARG VITE_BREVO_API_KEY=""
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_GOOGLE_CLIENT_SECRET=""

# Generate unique build version for cache busting
ARG BUILD_TIMESTAMP
ARG VITE_APP_VERSION=${BUILD_TIMESTAMP:-default}

# Définir les variables d'environnement pour le build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY \
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY \
    VITE_BREVO_API_KEY=$VITE_BREVO_API_KEY \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GOOGLE_CLIENT_SECRET=$VITE_GOOGLE_CLIENT_SECRET \
    VITE_APP_VERSION=$VITE_APP_VERSION

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate build timestamp if not provided
RUN if [ -z "$VITE_APP_VERSION" ]; then \
      export VITE_APP_VERSION=$(date +%Y%m%d%H%M%S); \
    fi && \
    echo "Building with APP_VERSION: $VITE_APP_VERSION" && \
    npm run build

FROM nginx:alpine

# Installer curl pour le healthcheck (requis par Coolify)
RUN apk add --no-cache curl

# COPIER nginx.conf DANS LE BON DOSSIER
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Supprimer les configs par défaut de nginx
RUN rm -f /etc/nginx/conf.d/default.conf.dpkg-dist && \
    rm -f /etc/nginx/conf.d/default.conf.default

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a cache-busting script that runs on container start
RUN echo '#!/bin/sh' > /docker-entrypoint.d/10-cache-bust.sh && \
    echo 'echo "[Cache Bust] Deployment timestamp: $(date)"' >> /docker-entrypoint.d/10-cache-bust.sh && \
    echo 'echo "[Cache Bust] Injecting cache busting headers"' >> /docker-entrypoint.d/10-cache-bust.sh && \
    chmod +x /docker-entrypoint.d/10-cache-bust.sh

# Add build version file for tracking
RUN echo "$(date +%Y%m%d%H%M%S)" > /usr/share/nginx/html/version.txt

# Vérifier que les fichiers sont bien copiés
RUN ls -la /usr/share/nginx/html && \
    test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

EXPOSE 80

# Healthcheck pour Coolify (utilise curl qui est maintenant installé)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
