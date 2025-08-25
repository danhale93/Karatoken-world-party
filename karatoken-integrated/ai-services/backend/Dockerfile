# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies for building
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the TypeScript source code
# This assumes you have a build script in package.json that runs `tsc`
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy environment file example
COPY .env.example .env

# Expose the application port (defaulting to 3000)
# Ensure this matches the PORT in your .env file
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]
