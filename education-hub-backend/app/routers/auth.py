from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
import uuid
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: Optional[str] = None
    password: str
    name: str
    email: str
    phone: str
    role: str = "student"
    university_id: Optional[int] = None
    category_id: Optional[int] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/login")
async def login(req: LoginRequest):
    conn = get_db()
    # Allow login via username (mobile number) OR email
    user = conn.execute("SELECT * FROM users WHERE username = ? OR email = ?", (req.username, req.username)).fetchone()
    conn.close()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account disabled")
    # Fetch role permissions if user has a custom role
    permissions = None
    conn2 = get_db()
    role_row = conn2.execute("SELECT permissions FROM roles WHERE name = ?", (user["role"],)).fetchone()
    if role_row and role_row["permissions"]:
        try:
            import json
            permissions = json.loads(role_row["permissions"])
        except Exception:
            permissions = None
    
    token = create_access_token({"sub": str(user["id"]), "username": user["username"], "role": user["role"], "name": user["name"]})
    user_data = {
        "id": user["id"],
        "username": user["username"],
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "role": user["role"]
    }
    if permissions is not None:
        user_data["permissions"] = permissions
    # If center user, include center info
    if user["role"] == "center":
        center_row = conn2.execute("SELECT * FROM centers WHERE user_id = ?", (user["id"],)).fetchone()
        if center_row:
            user_data["center"] = {
                "id": center_row["id"],
                "name": center_row["name"],
                "mobile": center_row["mobile"],
                "owner_name": center_row["owner_name"],
                "level": center_row["level"],
                "parent_center_id": center_row["parent_center_id"]
            }
    conn2.close()
    return {
        "token": token,
        "user": user_data
    }

@router.post("/register")
async def register(req: RegisterRequest):
    conn = get_db()
    # Use phone as username if username not provided
    username = req.username or req.phone
    # Check duplicate phone number
    existing_phone = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing_phone:
        conn.close()
        raise HTTPException(status_code=400, detail="Is mobile number se pehle se account hai. Login karein ya doosra number use karein.")
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash, name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (username, req.email, hash_password(req.password), req.name, req.phone, "student", 1)
    )
    user_id = cursor.lastrowid
    # NOTE: Do NOT commit yet - wait until student record is also created to avoid orphaned users
    
    # Auto-create student record with pending status (role is always student)
    # Use MAX(enrollment_no) + retry loop to avoid race condition duplicates
    import sqlite3
    for _attempt in range(5):
        max_row = conn.execute("SELECT MAX(CAST(SUBSTR(enrollment_no, 4) AS INTEGER)) FROM students").fetchone()
        next_num = (max_row[0] or 1000) + 1
        enrollment_no = f"EDU{str(next_num).zfill(6)}"
        try:
            conn.execute(
                "INSERT INTO students (user_id, enrollment_no, name, email, phone, university_id, category_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (user_id, enrollment_no, req.name, req.email, req.phone, req.university_id, req.category_id, "pending")
            )
            conn.commit()
            break
        except sqlite3.IntegrityError:
            continue
    else:
        # Rollback the uncommitted user INSERT to avoid orphaned user accounts
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail="Could not generate unique enrollment number")
    
    conn.close()
    
    # Send registration email (non-blocking)
    if req.email:
        try:
            from app.utils.email import send_registration_email
            send_registration_email(req.name, req.email, username)
        except Exception as e:
            print(f"Registration email failed: {e}")
    
    token = create_access_token({"sub": str(user_id), "username": username, "role": "student", "name": req.name})
    return {"token": token, "user": {"id": user_id, "username": username, "name": req.name, "email": req.email, "role": "student"}}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    if not user:
        conn.close()
        return {"message": "If an account exists with this email, a password reset code has been sent."}
    
    # Generate secure hex token (32 chars) to resist brute-force
    reset_token = uuid.uuid4().hex
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    
    conn.execute("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?", (user["id"],))
    conn.execute(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        (user["id"], reset_token, expires_at)
    )
    conn.commit()
    conn.close()
    
    try:
        from app.utils.email import send_password_reset_email
        send_password_reset_email(user["name"], user["email"], reset_token, "")
    except Exception as e:
        print(f"Password reset email failed: {e}")
    
    return {"message": "If an account exists with this email, a password reset code has been sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    conn = get_db()
    token_row = conn.execute(
        "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0",
        (req.token,)
    ).fetchone()
    if not token_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    expires_at = datetime.fromisoformat(token_row["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="Reset code has expired")
    
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(req.new_password), token_row["user_id"]))
    conn.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", (token_row["id"],))
    conn.commit()
    conn.close()
    return {"message": "Password reset successfully. You can now login with your new password."}

@router.post("/change-password")
async def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    user_id = int(current_user["sub"])
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.get("old_password", ""), user["password_hash"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Old password incorrect")
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(data["new_password"]), user_id))
    conn.commit()
    conn.close()
    return {"message": "Password changed successfully"}
