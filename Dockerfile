FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine

# COPIER nginx.conf DANS LE BON DOSSIER
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Supprimer la config par défaut de nginx
RUN rm -f /etc/nginx/conf.d/default.conf.dpkg-dist

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
