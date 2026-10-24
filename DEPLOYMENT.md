# 🚀 KOINEXA — Production Deployment Guide

KOINEXA is architected as an all-in-one educational platform featuring:
- **Backend**: Flask REST API, SQLite (WAL mode for concurrent access), Polyglot Compiler Sandbox, and Veritas Agentic AI.
- **Frontend**: High-performance React 18, Vite, Tailwind CSS, Lucide icons, KaTeX LaTeX renderer, and Framer Motion.
- **Unified Deployment Architecture**: Flask serves the compiled Vite SPA (`frontend/dist`) and all static assets directly. A single server/container port handles both frontend and API routes with zero CORS friction.

---

## 📋 Table of Contents
1. [Deployment Architectures](#deployment-architectures)
2. [Option A: Docker / Docker Compose (Recommended)](#option-a-docker--docker-compose-recommended)
3. [Option B: One-Click Cloud Deployment (Render / Railway)](#option-b-one-click-cloud-deployment-render--railway)
4. [Option C: Linux VPS (Ubuntu / Debian + Nginx + Gunicorn)](#option-c-linux-vps-ubuntu--debian--nginx--gunicorn)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Pre-Flight Verification Checklist](#pre-flight-verification-checklist)

---

## 1. Deployment Architectures

### Architecture 1: Single-Port Unified Service (Turnkey)
```
Internet ──> [Port 5001 / $PORT] ──> Gunicorn / Flask
                                        ├── GET /           ──> frontend/dist/index.html (SPA)
                                        ├── GET /assets/*   ──> frontend/dist/assets/*
                                        ├── GET /<route>    ──> frontend/dist/index.html (SPA Fallback)
                                        └── ALL /api/*      ──> Python REST API Endpoints
```
*Best for: Docker, Render, Railway, Heroku, Fly.io, single VPS droplet.*

### Architecture 2: Decoupled Static Host + Backend API
- **Frontend**: Hosted on Vercel / Cloudflare Pages / Netlify (pointed to `frontend/dist`).
- **Backend**: Hosted on Render / Railway / AWS / VPS (API endpoints on `/api/*`).

---

## 2. Option A: Docker / Docker Compose (Recommended)

### Using Docker Compose
Build and run the entire platform with one command:
```bash
docker compose up --build -d
```

Check health and logs:
```bash
docker compose ps
docker compose logs -f
```

The container automatically:
1. Builds the Vite production frontend bundle in a lightweight Node 20 stage.
2. Installs Python dependencies and compilers (`gcc`, `g++`, `default-jre-headless`) for the Code Lab sandbox.
3. Launches Gunicorn on port `5001`.
4. Persists the SQLite database at `./backend/koinexa.db`.

### Using Standalone Docker
```bash
# 1. Build image
docker build -t koinexa:latest .

# 2. Run container
docker run -d \
  --name koinexa_app \
  -p 5001:5001 \
  -e PORT=5001 \
  -e FLASK_DEBUG=0 \
  -v $(pwd)/backend/koinexa.db:/app/backend/koinexa.db \
  koinexa:latest
```

---

## 3. Option B: One-Click Cloud Deployment (Render / Railway)

### Deploying on Render (Web Service)
1. Link your GitHub repository.
2. Choose **Docker** environment (or Native Python).
3. If using **Native Environment**:
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt
     ```
   - **Start Command**:
     ```bash
     gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 backend.app:app
     ```
4. Add Disk mount (optional for SQLite database persistence):
   - Mount Path: `/app/backend`

### Deploying on Railway
1. New Project -> **Deploy from GitHub repo**.
2. Railway detects the root `Dockerfile` automatically.
3. Set Environment Variable:
   - `PORT=5001` (or let Railway set its dynamic `$PORT`).
4. Attach a Volume to `/app/backend` to persist `koinexa.db`.

---

## 4. Option C: Linux VPS (Ubuntu / Debian + Nginx + Gunicorn)

### 1. Install System Compilers & Python
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv nodejs npm gcc g++ default-jre-headless sqlite3 nginx
```

### 2. Build Frontend
```bash
cd /var/www/koinexa/frontend
npm install
npm run build
```

### 3. Setup Python Virtual Environment
```bash
cd /var/www/koinexa
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 4. Create Systemd Service (`/etc/systemd/system/koinexa.service`)
```ini
[Unit]
Description=Koinexa Production WSGI Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/koinexa
Environment="PATH=/var/www/koinexa/venv/bin"
Environment="PORT=5001"
Environment="FLASK_DEBUG=0"
ExecStart=/var/www/koinexa/venv/bin/gunicorn --workers 3 --threads 4 --timeout 120 --bind 127.0.0.1:5001 backend.app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable koinexa
sudo systemctl start koinexa
```

### 5. Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/koinexa`)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/koinexa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## 5. Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5001` | Server listener port |
| `FLASK_DEBUG` | `0` | Set `0` for production, `1` for development |
| `SECRET_KEY` | *(Auto-generated)* | 256-bit cryptographically secure session signing key |
| `SMTP_SERVER` | `smtp.gmail.com` | SMTP host for Veritas 2FA & notifications |
| `SMTP_PORT` | `587` | TLS port for SMTP |
| `SMTP_USERNAME`| `""` | Institutional email account |
| `SMTP_PASSWORD`| `""` | App-specific email password |

---

## 6. Pre-Flight Verification Checklist

Run these quick checks prior to pointing DNS traffic:
```bash
# 1. API Health Check
curl -i http://localhost:5001/api/health
# Expected: HTTP 200 {"service":"Koinexa API Engine","status":"ok","version":"1.0.0"}

# 2. SPA Route Direct Hit
curl -i http://localhost:5001/cbt
# Expected: HTTP 200 (serves index.html with SPA status 200)

# 3. Static Asset Delivery
curl -i http://localhost:5001/assets/index-*.js
# Expected: HTTP 200 with Content-Type: application/javascript or text/javascript
```
