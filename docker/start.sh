#!/bin/bash
set -e

PORT=${PORT:-8000}

cd /app/backend
echo "Starting backend on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
