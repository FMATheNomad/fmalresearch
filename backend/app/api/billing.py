from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import get_settings
from app.core.auth import get_current_user
from app.core.logging import get_logger
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])
logger = get_logger("billing")
settings = get_settings()


@router.get("/balance")
async def get_balance(user: User = Depends(get_current_user)):
    return {"balance": user.balance, "total_spent": user.total_spent}


@router.post("/top-up")
async def top_up(amount: float, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    if settings.polar_access_token:
        logger.info("polar_redirect", user_id=user.id, amount=amount)
        return {
            "redirect_url": f"https://checkout.polar.sh/checkout?amount={amount}&user_id={user.id}",
            "amount": amount,
        }

    user.balance += amount
    await db.commit()
    logger.info("top_up_local", user_id=user.id, amount=amount)
    return {"balance": user.balance, "added": amount, "note": "Local mode — Polar.sh not configured"}
