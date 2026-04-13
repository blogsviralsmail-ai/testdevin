from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, Query, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from bson import ObjectId

security = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    # Support API key auth (keys start with "kkhs_")
    if token.startswith("kkhs_"):
        db = get_db()
        api_key_doc = await db.api_keys.find_one({"key": token, "isActive": True})
        if not api_key_doc:
            raise HTTPException(status_code=401, detail="Invalid or deactivated API key")
        user = await db.users.find_one({"_id": ObjectId(api_key_doc["userId"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("status") == "banned":
            raise HTTPException(status_code=403, detail="Account suspended")
        user["id"] = str(user["_id"])
        return user

    # Standard JWT auth
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Account suspended")
    user["id"] = str(user["_id"])
    return user


async def get_current_user_from_token_param(token: str = Query(..., alias="token")):
    """Auth via query param token - used for <img>/<video> tags that can't set headers."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Account suspended")
    user["id"] = str(user["_id"])
    return user


async def get_admin_user(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def get_admin_or_moderator(user=Depends(get_current_user)):
    if user.get("role") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Admin or moderator access required")
    return user


SENSITIVE_FIELDS = {"password"}


def serialize_doc(doc) -> dict:
    """Convert MongoDB document to JSON-safe dict, stripping sensitive fields."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif key in SENSITIVE_FIELDS:
            continue
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def serialize_docs(docs: list) -> list:
    return [serialize_doc(doc) for doc in docs]
