# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Instala TODAS las deps (incluye devDependencies: necesito @angular/cli para buildear)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ---- Serve stage ----
FROM nginx:alpine

# Config de nginx con fallback SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# El build de Angular sale directo a dist/ (sin subcarpeta browser/)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
