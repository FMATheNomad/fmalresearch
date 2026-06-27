FROM python:3.12-slim

# Install Node.js + nginx for frontend serving and reverse proxy
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gnupg nginx gettext \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install backend deps
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Build frontend
WORKDIR /app/build-frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build && cp -r .next/standalone /app/frontend \
    && cp -r public /app/frontend/public \
    && cp -r .next/static /app/frontend/.next/static \
    && rm -rf /app/build-frontend

# Copy nginx config + start script
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /app

EXPOSE 8000

CMD ["/start.sh"]
