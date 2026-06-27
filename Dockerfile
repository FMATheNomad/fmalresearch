FROM python:3.12-slim AS backend-build
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor curl nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend
COPY --from=backend-build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-build /usr/local/bin /usr/local/bin
COPY backend/ .

WORKDIR /app/frontend
COPY --from=frontend-build /app/.next/standalone /app/frontend
COPY --from=frontend-build /app/public /app/frontend/public
COPY --from=frontend-build /app/.next/static /app/frontend/.next/static

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 8000

CMD ["/start.sh"]
