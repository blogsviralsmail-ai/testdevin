import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    name: str = ""
    email: str
    password: str
    store_type: str = ""
    monthly_orders: str = ""


class ForgotReq(BaseModel):
    email: str


class ResetReq(BaseModel):
    token: str
    password: str


class ChangePwReq(BaseModel):
    old_password: str
    new_password: str


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.name or user.email,
    }


@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        store_type=req.store_type,
        monthly_orders=req.monthly_orders,
        plan="free",
        features=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.name or user.email,
    }


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "brand": user.brand,
        "plan": user.plan,
        "features": user.features or [],
        "store_type": user.store_type,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/forgot")
def forgot_password(req: ForgotReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {"status": "ok", "message": "If the email exists, a reset link has been sent."}
    token = create_access_token({"sub": str(user.id), "purpose": "reset"}, expires_delta=datetime.timedelta(hours=1))
    # In production: send email with reset link
    return {"status": "ok", "message": "If the email exists, a reset link has been sent.", "reset_token": token}


@router.post("/reset")
def reset_password(req: ResetReq, db: Session = Depends(get_db)):
    from app.utils.auth import decode_token
    payload = decode_token(req.token)
    if payload.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(req.password)
    db.commit()
    return {"status": "ok", "message": "Password has been reset."}


@router.post("/change-password")
def change_password(req: ChangePwReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"status": "ok", "message": "Password changed."}


@router.post("/delete-account")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.is_active = False
    db.commit()
    return {"status": "ok", "message": "Account deactivated."}
