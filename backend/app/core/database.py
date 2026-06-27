from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("database")

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def migrate_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def add_missing_columns(sync_conn):
            inspector = inspect(sync_conn)
            columns = [c["name"] for c in inspector.get_columns("users")]
            if "google_id" not in columns:
                sync_conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
                logger.info("added_column", column="google_id")
            if "email_verified" not in columns:
                sync_conn.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE"))
                logger.info("added_column", column="email_verified")
            if "verification_token" not in columns:
                sync_conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR"))
                logger.info("added_column", column="verification_token")

        await conn.run_sync(add_missing_columns)
