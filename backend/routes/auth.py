from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from database.connection import get_db
from models.user import User, TwoFactorAuth
from models.portfolio import Portfolio
from services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    generate_2fa_secret, get_2fa_uri, verify_2fa_code, generate_2fa_qr_base64,
    generate_verification_token, verify_verification_token,
)
from config.settings import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# --- Schemas ---

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str
    totp_code: Optional[str] = None

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    uri: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# --- Helper ---

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return user


# --- Routes ---

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check existing
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        virtual_capital=settings.DEFAULT_VIRTUAL_CAPITAL,
        is_verified=True,  # Auto-verify for demo
    )
    db.add(user)
    await db.flush()

    # Create portfolio
    portfolio = Portfolio(
        user_id=user.id,
        available_capital=settings.DEFAULT_VIRTUAL_CAPITAL,
    )
    db.add(portfolio)

    # Generate tokens
    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})

    return {
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Check 2FA
    result = await db.execute(select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id))
    tfa = result.scalar_one_or_none()

    if tfa and tfa.is_enabled:
        if not req.totp_code:
            return {"requires_2fa": True, "message": "2FA code required"}
        if not verify_2fa_code(tfa.secret, req.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id})

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "virtual_capital": user.virtual_capital,
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "virtual_capital": user.virtual_capital,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/2fa/setup")
async def setup_2fa(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id))
    existing = result.scalar_one_or_none()

    secret = generate_2fa_secret()
    uri = get_2fa_uri(secret, user.email)
    qr_base64 = generate_2fa_qr_base64(uri)

    if existing:
        existing.secret = secret
        existing.is_enabled = False
    else:
        tfa = TwoFactorAuth(user_id=user.id, secret=secret)
        db.add(tfa)

    return {"secret": secret, "qr_code": qr_base64, "uri": uri}


@router.post("/2fa/verify")
async def verify_2fa(
    req: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id))
    tfa = result.scalar_one_or_none()

    if not tfa:
        raise HTTPException(status_code=400, detail="2FA not set up")

    if not verify_2fa_code(tfa.secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    tfa.is_enabled = True
    return {"message": "2FA enabled successfully"}


@router.post("/2fa/disable")
async def disable_2fa(
    req: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id))
    tfa = result.scalar_one_or_none()

    if not tfa or not tfa.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    if not verify_2fa_code(tfa.secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    tfa.is_enabled = False
    return {"message": "2FA disabled successfully"}


@router.post("/refresh")
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token required")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({"sub": user.id, "email": user.email})
    return {"access_token": new_access, "token_type": "bearer"}
