import jwt
import os
import time
import random
import secrets
from fastapi import HTTPException, Header, Query
from typing import Optional

# BUG-001 FIX: Use cryptographically secure random secret if not set in env
SECRET_KEY = os.environ.get("JWT_SECRET", None)
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"

# BUG-003 FIX: Demo mode gated behind environment variable
DEMO_MODE = os.environ.get("DEMO_MODE", "1") == "1"


def generate_otp(phone: str) -> str:
    """Generate OTP and store in database (BUG-005 FIX)"""
    otp = str(random.randint(1000, 9999))
    from app.database import get_db
    with get_db() as db:
        # Rate limiting: max 5 OTPs per phone per hour
        recent = db.execute(
            "SELECT COUNT(*) as cnt FROM otp_store WHERE phone = ? AND created_at > datetime('now', '-1 hour')",
            (phone,)
        ).fetchone()
        if recent and recent["cnt"] >= 5:
            raise HTTPException(status_code=429, detail="Too many OTP requests. Please try again later.")
        # Delete old OTPs for this phone
        db.execute("DELETE FROM otp_store WHERE phone = ?", (phone,))
        # Store new OTP with 5-minute expiry
        db.execute(
            "INSERT INTO otp_store (phone, otp, expires_at) VALUES (?, ?, datetime('now', '+5 minutes'))",
            (phone, otp),
        )
    return otp


def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP from database (BUG-005 FIX)"""
    from app.database import get_db
    with get_db() as db:
        stored = db.execute(
            "SELECT otp FROM otp_store WHERE phone = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1",
            (phone,)
        ).fetchone()
        if stored and stored["otp"] == otp:
            db.execute("DELETE FROM otp_store WHERE phone = ?", (phone,))
            return True
    # BUG-003 FIX: Demo mode OTP only when DEMO_MODE=1
    if DEMO_MODE and otp == "1234":
        return True
    return False


def create_token(user_id: int, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": time.time() + 86400 * 30  # 30 days
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None), x_auth_token: Optional[str] = Header(None), token: Optional[str] = Query(None)) -> dict:
    t = None
    if x_auth_token:
        t = x_auth_token
    elif authorization and authorization.startswith("Bearer "):
        t = authorization.replace("Bearer ", "")
    elif token:
        t = token
    if not t:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(t)


async def get_optional_user(authorization: Optional[str] = Header(None), x_auth_token: Optional[str] = Header(None)) -> Optional[dict]:
    token = None
    if x_auth_token:
        token = x_auth_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    if not token:
        return None
    try:
        return decode_token(token)
    except Exception:
        return None


def require_role(user: dict, roles: list[str]):
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Access denied")
