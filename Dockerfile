# ========================================================
# Stage 1: Build Frontend Client
# ========================================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY shared/ /app/shared/
COPY client/ ./
RUN npm run build

# ========================================================
# Stage 2: Build Backend Server
# ========================================================
FROM node:22-alpine AS server-builder
WORKDIR /app/server

# Install build dependencies for better-sqlite3 compilation if needed
RUN apk add --no-cache python3 make g++

COPY server/package*.json ./
RUN npm ci

COPY shared/ /app/shared/
COPY server/ ./
RUN npm run build

# ========================================================
# Stage 3: Production Runtime
# ========================================================
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache python3 make g++ curl

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/app/data/chebelew.db

# Copy server package & production node_modules
COPY server/package*.json ./
RUN npm ci --only=production

# Copy compiled server code and shared types
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/shared ./shared

# Copy built frontend assets to serve statically or through reverse proxy
COPY --from=client-builder /app/client/dist ./public

# Volume for SQLite database persistence
RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/server/src/index.js"]
