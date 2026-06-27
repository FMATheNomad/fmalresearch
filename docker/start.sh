#!/bin/bash
# Start backend
cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
cd /app/frontend && node server.js &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGTERM SIGINT

# Wait for any to exit
wait $BACKEND_PID $FRONTEND_PID
