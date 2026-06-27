#!/bin/bash
set -e

PORT=${PORT:-8000}

echo "Starting backend on port $PORT with frontend static files..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
