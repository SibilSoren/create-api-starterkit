# ──────────────────────────────────────────────
# Build Stage
# ──────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first for better caching.
# --ignore-scripts skips husky's git hook setup, which needs a .git folder.
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ──────────────────────────────────────────────
# Production Stage
# ──────────────────────────────────────────────
FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the app
CMD ["node", "dist/server.js"]
