FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim AS backend-build
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends supervisor && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-build /app /app/backend
COPY --from=frontend-build /app/.next/standalone /app/frontend
COPY --from=frontend-build /app/public /app/frontend/public
COPY --from=frontend-build /app/.next/static /app/frontend/.next/static

RUN pip install --no-cache-dir uvicorn

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000 8000

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
