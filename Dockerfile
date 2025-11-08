FROM node:20-alpine AS builder

# Arguments pour les variables d'environnement de build (toutes optionnelles)
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_SUPABASE_SERVICE_ROLE_KEY=""
ARG VITE_STRIPE_PUBLIC_KEY=""
ARG VITE_BREVO_API_KEY=""
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_GOOGLE_CLIENT_SECRET=""
ARG CACHEBUST=1

# Définir les variables d'environnement pour le build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY \
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY \
    VITE_BREVO_API_KEY=$VITE_BREVO_API_KEY \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GOOGLE_CLIENT_SECRET=$VITE_GOOGLE_CLIENT_SECRET

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Vider le cache des fichiers statiques en ajoutant un timestamp
RUN find /app/dist -type f \( -name "*.js" -o -name "*.css" \) -exec sed -i "s/\$CACHEBUST/${CACHEBUST}/g" {} \;

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

# Vérifier que les fichiers sont bien copiés
RUN ls -la /usr/share/nginx/html && \
    test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

EXPOSE 80

# Healthcheck pour Coolify (utilise curl qui est maintenant installé)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
