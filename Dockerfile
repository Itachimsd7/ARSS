# Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Production Environment
FROM node:20-slim

# Install Python 3, pip, venv, and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python backend requirements & setup virtualenv
COPY requirements.txt ./
RUN python3 -m venv .venv
RUN .venv/bin/pip install --no-cache-dir --upgrade pip
RUN .venv/bin/pip install --no-cache-dir -r requirements.txt
RUN .venv/bin/python -m spacy download en_core_web_sm

# Copy node server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --only=production

# Copy remaining code
COPY . .
# Copy built client from builder
COPY --from=frontend-builder /app/client/dist /app/client/dist

# Set env variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Command to start
CMD ["node", "server/index.js"]
