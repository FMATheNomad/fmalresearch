#!/bin/bash
set -e

PORT=${PORT:-8080}

sed "s/__PORT__/$PORT/g" /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

echo "Starting backend on internal port 8001..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on internal port 3000..."
cd /app/frontend
NEXT_PUBLIC_API_URL="" node server.js &
FRONTEND_PID=$!

sleep 2

echo "Starting nginx on port $PORT..."
nginx -g "daemon off;" &
NGINX_PID=$!

cleanup() {
    kill $NGINX_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGTERM SIGINT

wait
