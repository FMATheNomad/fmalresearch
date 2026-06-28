import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import get_settings
from app.core.database import engine, Base, migrate_database
from app.core.logging import setup_logging, get_logger
from app.api import auth, research, ws, billing

settings = get_settings()
logger = get_logger("main")

setup_logging(settings.environment)

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.25,
    )
    logger.info("sentry_initialized")

app = FastAPI(title=settings.app_name, version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)

app.include_router(auth.router)
app.include_router(research.router)
app.include_router(ws.router)
app.include_router(billing.router)


@app.on_event("startup")
async def startup():
    logger.info("starting_database_migration")
    await migrate_database()
    logger.info("database_migration_complete")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
