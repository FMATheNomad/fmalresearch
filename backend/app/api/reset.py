from fastapi import APIRouter
from sqlalchemy import select
from app.core.database import async_session
from app.core.auth import hash_password
from app.models.user import User
from app.core.logging import get_logger

router = APIRouter(tags=["reset"])
logger = get_logger("reset")


@router.post("/auth/reset-password")
async def reset_password(email: str, password: str):
    hashed = hash_password(password)
    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "User not found"}
        user.hashed_password = hashed
        await db.commit()
        logger.info("password_reset", email=email)
        return {"message": "Password updated"}
