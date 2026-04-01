import jwt
import os
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends, Header
from typing import Optional

SECRET_KEY = os.environ.get("JWT_SECRET", "education-hub-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(authorization: str = Header(None), x_auth_token: str = Header(None)):
    # Check standard Authorization header first
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        return decode_token(token)
    # Fallback to X-Auth-Token header (used when tunnel basic auth occupies Authorization)
    if x_auth_token and x_auth_token.startswith("Bearer "):
        token = x_auth_token.split(" ")[1]
        return decode_token(token)
    raise HTTPException(status_code=401, detail="Not authenticated")

# Allowlist of admin-level roles (used by require_admin)
ADMIN_ROLES = ("admin", "super_admin", "branch_admin")
# Built-in non-admin roles that must NEVER pass require_admin even if a custom role with the same name exists
BUILTIN_NON_ADMIN_ROLES = ("student", "center")

def require_admin(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    if role in ADMIN_ROLES:
        return current_user
    # Block built-in non-admin roles immediately - prevents bypass if a custom role named "student"/"center" exists
    if role in BUILTIN_NON_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")
    # Check if it's a custom role from the roles table
    from app.database import get_db
    conn = get_db()
    try:
        role_row = conn.execute("SELECT id FROM roles WHERE name = ? AND status = 'active'", (role,)).fetchone()
    except Exception:
        role_row = None
    conn.close()
    if role_row:
        return current_user
    raise HTTPException(status_code=403, detail="Admin access required")

def require_only_admin(current_user: dict = Depends(get_current_user)):
    """Only super_admin and admin can access - NOT branch_admin/employee."""
    if current_user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Only admin can perform this action")
    return current_user

def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user
