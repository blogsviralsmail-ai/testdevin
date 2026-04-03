"""Authentication routes - register, login, guest login."""
import datetime
import random
import string
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    display_name: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str


class GuestLoginRequest(BaseModel):
    device_id: str = ""


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if username exists
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email exists
    if req.email:
        result = await db.execute(select(User).where(User.email == req.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        display_name=req.display_name or req.username,
        auth_provider="local",
        coins=1000,
        gems=10,
        avatar_id=random.randint(1, 20),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.username, user.is_admin)
    return {"token": token, "user": user.to_dict()}


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_banned:
        raise HTTPException(status_code=403, detail=f"Account banned: {user.ban_reason}")

    user.is_online = True
    user.last_login = datetime.datetime.utcnow()
    await db.commit()

    token = create_access_token(user.id, user.username, user.is_admin)
    return {"token": token, "user": user.to_dict()}


@router.post("/guest")
async def guest_login(req: GuestLoginRequest, db: AsyncSession = Depends(get_db)):
    # Create guest user
    guest_id = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    username = f"Guest_{guest_id}"
    display_name = f"Player_{guest_id}"

    user = User(
        username=username,
        display_name=display_name,
        auth_provider="guest",
        provider_id=req.device_id or guest_id,
        coins=500,
        gems=5,
        avatar_id=random.randint(1, 20),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.username, user.is_admin)
    return {"token": token, "user": user.to_dict()}
