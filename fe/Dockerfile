# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build argument for Vite environment variable
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
