FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_MARKETPLACE_MODE=Listings
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_MARKETPLACE_MODE=$VITE_MARKETPLACE_MODE
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
EXPOSE 8080
