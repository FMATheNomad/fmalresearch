#!/bin/bash
set -e

NGINX_PORT=${PORT:-8080}

sed "s/__PORT__/$NGINX_PORT/g" /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

echo "Starting backend on internal port 8001..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!
sleep 4

echo "Starting frontend on internal port 3000..."
cd /app/frontend
ls -la server.js package.json 2>&1 || echo "Missing frontend files!"
PORT=3000 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!
sleep 10

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "Frontend process is running (PID: $FRONTEND_PID)"
else
    echo "WARNING: Frontend process died!"
fi

echo "Starting nginx on port $NGINX_PORT..."
nginx -g "daemon off;" &
NGINX_PID=$!
sleep 1

echo "All processes started."

cleanup() {
    kill $NGINX_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGTERM SIGINT

wait
