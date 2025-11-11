# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared ./packages/shared

# Install dependencies
RUN npm ci

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

