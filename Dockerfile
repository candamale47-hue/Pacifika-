# ============================================
# Pacifika Wear - Production Dockerfile
# Works with: Railway, Render, Fly.io, 
# DigitalOcean, AWS, GCP, any Docker host
# ============================================

# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Install build tools needed for native modules
RUN apk add --no-cache python3 make g++

# Copy dependency files first (for layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy all source files
COPY . .

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Build the application (Vite frontend + esbuild backend)
RUN npm run build

# ---- Stage 3: Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy essential runtime files
COPY --from=builder --chown=nodejs:nodejs /app/db ./db
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/.env ./

# Create directories for persistent data
RUN mkdir -p /app/db /app/public/uploads && \
    chown -R nodejs:nodejs /app/db /app/public/uploads

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Start the production server
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "dist/boot.js"]
