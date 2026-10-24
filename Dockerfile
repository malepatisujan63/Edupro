# ========================================================
# KOINEXA — Turnkey Production Multi-Stage Dockerfile
# Stage 1: Build Vite / React Frontend Bundle
# Stage 2: Unified Python + Polyglot Compiler Container
# ========================================================

# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --silent || npm install --silent

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Python Runtime ──
FROM python:3.11-slim-bullseye AS production

# Install polyglot compiler suite (C, C++, Java JRE, SQLite3, curl) for Code Lab Sandbox
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    default-jre-headless \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy compiled frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source code
COPY backend/ ./backend/

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=5001 \
    FLASK_DEBUG=0 \
    PYTHONPATH=/app

EXPOSE 5001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Production WSGI startup via Gunicorn
CMD exec gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 2 --threads 4 --timeout 120 backend.app:app
