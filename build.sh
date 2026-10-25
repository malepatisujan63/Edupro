#!/usr/bin/env bash
set -e

echo "=== KOINEXA RENDER BUILD PIPELINE ==="

# 1. Build React/Vite Frontend
if [ -d "frontend" ]; then
  echo "--> Installing Node packages and compiling frontend bundle..."
  cd frontend
  npm install --legacy-peer-deps
  npm run build
  cd ..
fi

# 2. Install Python Dependencies
echo "--> Installing Python requirements..."
pip install -r backend/requirements.txt

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
