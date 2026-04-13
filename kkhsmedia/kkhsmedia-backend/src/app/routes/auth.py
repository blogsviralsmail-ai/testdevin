from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
import os
import secrets
import string
from bson import ObjectId

from app.database import get_db
from app.models.schemas import (
    RegisterRequest, LoginRequest, VerifyEmailRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    UpdatePasswordRequest, UpdateUsernameRequest, UpdateUserDetailsRequest,
)
from app.utils.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, serialize_doc,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register")
async def register(req: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "firstName": req.firstName,
        "lastName": req.lastName,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "phone": "",
        "address": {},
        "role": "user",
        "emailVerified": False,
        "status": "active",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.users.insert_one(user)

    # Generate OTP
    otp = "".join(secrets.choice(string.digits) for _ in range(6))
    await db.otp_codes.insert_one({
        "email": req.email.lower(),
        "otp": otp,
        "type": "email_verify",
        "createdAt": datetime.utcnow(),
    })

    # Send OTP email
    from app.services.email import send_otp_email
    await send_otp_email(req.email.lower(), otp, "email_verify")

    # Set trial period (3 days free)
    trial_expiry = datetime.utcnow() + timedelta(days=3)
    await db.users.update_one(
        {"_id": result.inserted_id},
        {"$set": {"trialExpiry": trial_expiry, "plan": "trial", "maxSlots": 2}}
    )

    # Handle referral code
    if req.referralCode:
        referrer = await db.users.find_one({"referralCode": req.referralCode})
        if referrer:
            await db.users.update_one(
                {"_id": result.inserted_id},
                {"$set": {"referredBy": str(referrer["_id"])}}
            )

    return {
        "message": "Registration successful. Please verify your email.",
        "userId": str(result.inserted_id),
        "otp_dev": otp if os.getenv("DEBUG", "").lower() == "true" else None,
    }


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    db = get_db()
    otp_doc = await db.otp_codes.find_one({
        "email": req.email.lower(),
        "otp": req.otp,
        "type": "email_verify",
    })
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    await db.users.update_one(
        {"email": req.email.lower()},
        {"$set": {"emailVerified": True, "updatedAt": datetime.utcnow()}}
    )
    await db.otp_codes.delete_many({"email": req.email.lower(), "type": "email_verify"})

    return {"message": "Email verified successfully"}


@router.post("/login")
async def login(req: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Account suspended")

    if not user.get("emailVerified"):
        raise HTTPException(status_code=403, detail="Please verify your email first")

    token = create_access_token({"sub": str(user["_id"]), "role": user.get("role", "user")})

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "emailVerified": user.get("emailVerified", False),
        }
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}

    otp = "".join(secrets.choice(string.digits) for _ in range(6))
    await db.otp_codes.insert_one({
        "email": req.email.lower(),
        "otp": otp,
        "type": "password_reset",
        "createdAt": datetime.utcnow(),
    })

    # Send reset OTP email
    from app.services.email import send_otp_email
    await send_otp_email(req.email.lower(), otp, "password_reset")

    return {"message": "If the email exists, a reset link has been sent.", "otp_dev": otp if os.getenv("DEBUG", "").lower() == "true" else None}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    db = get_db()
    otp_doc = await db.otp_codes.find_one({"otp": req.token, "type": "password_reset"})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    await db.users.update_one(
        {"email": otp_doc["email"]},
        {"$set": {"password": hash_password(req.password), "updatedAt": datetime.utcnow()}}
    )
    await db.otp_codes.delete_many({"email": otp_doc["email"], "type": "password_reset"})

    return {"message": "Password reset successfully"}


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    safe_user = {
        "id": user["id"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "address": user.get("address", {}),
        "role": user.get("role", "user"),
        "emailVerified": user.get("emailVerified", False),
        "plan": user.get("plan", "free"),
        "trialExpiry": user.get("trialExpiry", "").isoformat() if isinstance(user.get("trialExpiry"), datetime) else str(user.get("trialExpiry", "")),
        "maxSlots": user.get("maxSlots", 2),
        "referralCode": user.get("referralCode", ""),
        "createdAt": user.get("createdAt", ""),
    }
    if isinstance(safe_user["createdAt"], datetime):
        safe_user["createdAt"] = safe_user["createdAt"].isoformat()
    return safe_user


@router.put("/update-password")
async def update_password(req: UpdatePasswordRequest, user=Depends(get_current_user)):
    if not verify_password(req.currentPassword, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password": hash_password(req.newPassword), "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Password updated successfully"}


@router.post("/update-username")
async def update_username(req: UpdateUsernameRequest, user=Depends(get_current_user)):
    db = get_db()
    update = {"updatedAt": datetime.utcnow()}
    if req.firstName is not None:
        update["firstName"] = req.firstName
    if req.lastName is not None:
        update["lastName"] = req.lastName

    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    return {"message": "Name updated successfully"}


@router.put("/update-user-details")
async def update_user_details(req: UpdateUserDetailsRequest, user=Depends(get_current_user)):
    db = get_db()
    update = {"updatedAt": datetime.utcnow()}
    if req.phone is not None:
        update["phone"] = req.phone
    if req.address is not None:
        update["address"] = req.address

    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    return {"message": "Details updated successfully"}
