import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config as StarletteConfig
from app.core.database import get_db
from app.core.config import get_settings
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.core.logging import get_logger
from app.services.email import send_verification_email
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse

settings = get_settings()
logger = get_logger("auth")
router = APIRouter(prefix="/auth", tags=["auth"])

_google_oauth = None


def get_google_oauth():
    global _google_oauth
    if _google_oauth is None and settings.google_client_id:
        oauth = OAuth(StarletteConfig(environ={
            "GOOGLE_CLIENT_ID": settings.google_client_id,
            "GOOGLE_CLIENT_SECRET": settings.google_client_secret,
        }))
        _google_oauth = oauth.register(
            name="google",
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
    return _google_oauth


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    is_admin = req.email in settings.admin_emails
    verification_token = secrets.token_urlsafe(32)
    user = User(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
        verification_token=verification_token,
        balance=999999 if is_admin else 5.00,
    )
    db.add(user)
    await db.commit()

    base_url = settings.google_redirect_uri.replace('/google/callback', '') if settings.google_redirect_uri else "http://localhost:8000"
    verify_url = f"{base_url}/auth/verify-email?token={verification_token}"
    logger.info("user_registered", user_id=user.id, verify_url=verify_url)

    await send_verification_email(user.email, verify_url)

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification token")

    user.email_verified = True
    user.verification_token = None
    await db.commit()
    logger.info("email_verified", user_id=user.id)
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/google/login")
async def google_login(request: Request):
    google = get_google_oauth()
    if not google:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    redirect_uri = settings.google_redirect_uri
    return await google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    google = get_google_oauth()
    if not google:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    try:
        token = await google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth failed: {str(e)}")

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")

    google_id = user_info.get("sub")
    email = user_info.get("email", "")
    name = user_info.get("name", email.split("@")[0])

    result = await db.execute(select(User).where(
        (User.google_id == google_id) | (User.email == email)
    ))
    user = result.scalar_one_or_none()

    if user:
        if not user.google_id:
            user.google_id = google_id
            user.email_verified = True
        access_token = create_access_token(user.id)
    else:
        user = User(
            email=email,
            name=name,
            google_id=google_id,
            email_verified=True,
        )
        db.add(user)
        access_token = create_access_token(user.id)

    await db.commit()
    logger.info("google_login", user_id=user.id)

    frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
    return RedirectResponse(url=f"{frontend_url}/dashboard?token={access_token}")


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
