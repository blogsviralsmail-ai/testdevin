from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.database import get_db
try:
    from app.services.email_service import send_registration_welcome, send_password_reset as send_reset_email
except ImportError:
    send_registration_welcome = send_reset_email = lambda *a, **kw: None
from app.auth import generate_otp, verify_otp, create_token, DEMO_MODE
from app.seed import generate_ref_code
import bcrypt
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])


# BUG-002 FIX: Use bcrypt for password hashing
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash. Supports both bcrypt and legacy SHA256."""
    if hashed and hashed.startswith('$2'):
        return bcrypt.checkpw(password.encode(), hashed.encode())
    # Legacy SHA256 fallback for existing users
    import hashlib
    return hashed == hashlib.sha256(password.encode()).hexdigest()


# BUG-027 FIX: Phone number validation
def validate_indian_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    if cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    if not re.match(r'^[6-9]\d{9}$', cleaned):
        raise HTTPException(status_code=400, detail="Invalid phone number. Must be 10 digits starting with 6-9.")
    return cleaned


class SendOTPRequest(BaseModel):
    phone: str

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r'[\s\-\+]', '', v)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError('Invalid phone number. Must be 10 digits starting with 6-9.')
        return cleaned


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: str | None = None


class LoginRequest(BaseModel):
    identifier: str
    password: str


class SignupRequest(BaseModel):
    name: str
    phone: str
    email: str | None = None
    password: str
    referral_code: str | None = None
    role: str | None = None  # 'user' or 'owner'

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r'[\s\-\+]', '', v)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if not re.match(r'^[6-9]\d{9}$', cleaned):
            raise ValueError('Invalid phone number. Must be 10 digits starting with 6-9.')
        return cleaned


class ForgotPasswordRequest(BaseModel):
    identifier: str


class ResetPasswordRequest(BaseModel):
    identifier: str
    otp: str
    new_password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


def user_response(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "phone": user["phone"],
        "email": user["email"],
        "role": user["role"],
        "photo_url": user["photo_url"],
        "wallet_balance": user["wallet_balance"],
        "referral_code": user["referral_code"],
        "rating": user["rating"],
        "city": user["city"],
    }


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest):
    otp = generate_otp(req.phone)
    # BUG-004 FIX: Don't return OTP in response (only show in demo mode)
    response = {"message": "OTP sent successfully"}
    if DEMO_MODE:
        response["otp"] = otp  # Only in demo mode for testing
    return response


@router.post("/verify-otp")
async def verify_otp_endpoint(req: VerifyOTPRequest):
    if not verify_otp(req.phone, req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE phone=?", (req.phone,)).fetchone()
        if not user:
            ref_code = generate_ref_code()
            name = req.name or f"User-{req.phone[-4:]}"
            db.execute(
                "INSERT INTO users (name, phone, role, referral_code, wallet_balance) VALUES (?, ?, 'user', ?, 0)",
                (name, req.phone, ref_code),
            )
            user = db.execute("SELECT * FROM users WHERE phone=?", (req.phone,)).fetchone()

        token = create_token(user["id"], user["role"])
        return {"token": token, "user": user_response(user)}


@router.post("/login")
async def login_with_password(req: LoginRequest):
    with get_db() as db:
        # Try phone or email
        user = db.execute("SELECT * FROM users WHERE phone=? OR email=?", (req.identifier, req.identifier)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # BUG-003 FIX: Demo password only in demo mode
        if DEMO_MODE and req.password == "password123":
            token = create_token(user["id"], user["role"])
            return {"token": token, "user": user_response(user)}

        stored_hash = user["password_hash"] if "password_hash" in user.keys() else None
        if not stored_hash:
            # BUG-014 FIX: User has no password set (OTP-created user)
            raise HTTPException(status_code=401, detail="No password set. Please use 'Forgot Password' to set one.")
        if verify_password(req.password, stored_hash):
            token = create_token(user["id"], user["role"])
            return {"token": token, "user": user_response(user)}

        raise HTTPException(status_code=401, detail="Invalid password")


@router.post("/signup")
async def signup(req: SignupRequest):
    with get_db() as db:
        existing = db.execute("SELECT id FROM users WHERE phone=?", (req.phone,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        if req.email:
            existing_email = db.execute("SELECT id FROM users WHERE email=?", (req.email,)).fetchone()
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already registered")

        ref_code = generate_ref_code()
        pw_hash = hash_password(req.password)
        # Allow signup as owner; only 'user' and 'owner' are valid roles for self-signup
        user_role = 'owner' if req.role == 'owner' else 'user'
        db.execute(
            "INSERT INTO users (name, phone, email, role, referral_code, wallet_balance, password_hash) VALUES (?, ?, ?, ?, ?, 0, ?)",
            (req.name, req.phone, req.email, user_role, ref_code, pw_hash),
        )
        user = db.execute("SELECT * FROM users WHERE phone=?", (req.phone,)).fetchone()

        # Handle referral - BUG-019 FIX: Credit reward on signup
        if req.referral_code:
            referrer = db.execute("SELECT * FROM users WHERE referral_code=?", (req.referral_code,)).fetchone()
            if referrer:
                reward = db.execute("SELECT value FROM settings WHERE key='user_referral_reward'").fetchone()
                reward_amount = float(reward["value"]) if reward else 50
                db.execute("UPDATE users SET referred_by=? WHERE id=?", (req.referral_code, user["id"]))
                db.execute(
                    "INSERT INTO referrals (referrer_id, referee_id, referral_type, reward_amount, status) VALUES (?, ?, 'user', ?, 'completed')",
                    (referrer["id"], user["id"], reward_amount),
                )
                # BUG-019 FIX: Credit referral reward to referrer's wallet immediately
                db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (reward_amount, referrer["id"]))

        token = create_token(user["id"], user["role"])
        return {"token": token, "user": user_response(user)}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE phone=? OR email=?", (req.identifier, req.identifier)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        otp = generate_otp(user["phone"])
        # BUG-032 FIX: Mask phone number and don't return OTP
        phone = user['phone']
        masked_phone = f"****{phone[-4:]}" if len(phone) >= 4 else "****"
        response = {"message": f"OTP sent to +91 {masked_phone}"}
        if DEMO_MODE:
            response["otp"] = otp
        return response


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE phone=? OR email=?", (req.identifier, req.identifier)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_otp(user["phone"], req.otp):
            raise HTTPException(status_code=400, detail="Invalid OTP")
        pw_hash = hash_password(req.new_password)
        db.execute("UPDATE users SET password_hash=? WHERE id=?", (pw_hash, user["id"]))
        token = create_token(user["id"], user["role"])
        return {"token": token, "user": user_response(user), "message": "Password reset successful"}


@router.post("/admin-login")
async def admin_login(req: VerifyOTPRequest):
    # BUG-015 FIX: Require OTP verification for admin login
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE phone=?", (req.phone,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user["role"] not in ("admin", "owner"):
            raise HTTPException(status_code=403, detail="Not an admin or owner")
        if not verify_otp(req.phone, req.otp):
            raise HTTPException(status_code=400, detail="Invalid OTP")
        token = create_token(user["id"], user["role"])
        return {"token": token, "user": user_response(user)}
