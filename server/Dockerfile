# ===== 1. Build stage =====
FROM node:18-alpine AS build

# Create app directory
WORKDIR /app

# Copy package files and install dependencies 
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# ===== 2. Runtime stage =====
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5004

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5004/health || exit 1


# Copy built app from build stage
COPY --from=build /app /app

# Expose the port your app listens on
EXPOSE 5004

# Run the server
CMD ["node", "server.js"]
