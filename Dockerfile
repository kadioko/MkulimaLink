FROM node:20-alpine

WORKDIR /app

# Install build dependencies for sharp
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++ \
    node-addon-api

# Copy backend package files
COPY package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./backend/

# Create necessary directories
RUN mkdir -p uploads/products logs

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "backend/server.js"]
