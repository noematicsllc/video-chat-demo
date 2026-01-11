# Multi-stage Dockerfile for LiveKit Video Chat App

# Stage 1: Build frontend (Next.js)
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build Next.js app with standalone output
RUN npm run build

# Copy public and static files to standalone directory (required by Next.js)
RUN cp -r public .next/standalone/public && \
    cp -r .next/static .next/standalone/.next/static

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy Next.js standalone build
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Run Next.js server
CMD ["node", "server.js"]
