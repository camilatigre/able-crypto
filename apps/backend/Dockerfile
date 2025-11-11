# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package*.json ./

# Copy backend and shared package files
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared ./packages/shared

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/backend ./apps/backend

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY --from=builder /app/apps/backend/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]

