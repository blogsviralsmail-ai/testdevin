from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Admin
from app.models.notification import Announcement
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminLoginReq(BaseModel):
    username: str
    password: str


class AdminCreateReq(BaseModel):
    email: str
    password: str
    name: str = "Admin"


class AnnouncementIn(BaseModel):
    title: str
    body: str = ""
    type: str = "info"


class ImpersonateReq(BaseModel):
    user_id: int


class BillingUpdateReq(BaseModel):
    user_id: int
    plan: str
    features: list = []


class UserStatusReq(BaseModel):
    user_id: int
    is_active: bool


@router.post("/login")
def admin_login(req: AdminLoginReq, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == req.username).first()
    if not admin or not verify_password(req.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = create_access_token({"sub": str(admin.id), "role": "admin", "email": admin.email})
    return {"access_token": token, "token_type": "bearer", "name": admin.name}


@router.post("/create")
def create_admin(req: AdminCreateReq, db: Session = Depends(get_db)):
    existing = db.query(Admin).filter(Admin.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    admin = Admin(email=req.email, password_hash=hash_password(req.password), name=req.name)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"status": "ok", "admin_id": admin.id}


@router.get("/users")
def list_users(
    page: int = Query(1),
    limit: int = Query(50),
    search: Optional[str] = None,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search:
        q = q.filter(User.email.contains(search) | User.name.contains(search) | User.brand.contains(search))
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "users": [
            {"id": u.id, "email": u.email, "name": u.name, "brand": u.brand, "plan": u.plan, "is_active": u.is_active, "created_at": u.created_at.isoformat() if u.created_at else None}
            for u in users
        ],
        "total": total,
    }


@router.get("/users/{user_id}")
def get_user_detail(user_id: int, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id, "email": user.email, "name": user.name, "brand": user.brand,
        "plan": user.plan, "features": user.features, "is_active": user.is_active,
        "store_type": user.store_type, "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/impersonate")
def impersonate_user(req: ImpersonateReq, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_access_token({"sub": str(user.id), "email": user.email, "impersonated_by": admin.id})
    return {"access_token": token, "token_type": "bearer", "username": user.name or user.email}


@router.post("/billing")
def update_billing(req: BillingUpdateReq, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.plan = req.plan
    user.features = ",".join(req.features) if isinstance(req.features, list) else req.features
    db.commit()
    return {"status": "ok"}


@router.post("/user-status")
def update_user_status(req: UserStatusReq, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = req.is_active
    db.commit()
    return {"status": "ok"}


@router.get("/stats")
def admin_stats(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    free_users = db.query(User).filter(User.plan == "free").count()
    paid_users = total_users - free_users
    return {
        "total_users": total_users,
        "active_users": active_users,
        "free_users": free_users,
        "paid_users": paid_users,
        "plans": {
            "free": db.query(User).filter(User.plan == "free").count(),
            "growth": db.query(User).filter(User.plan == "growth").count(),
            "pro": db.query(User).filter(User.plan == "pro").count(),
            "enterprise": db.query(User).filter(User.plan == "enterprise").count(),
        },
    }


@router.get("/announcements")
def list_announcements(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    anns = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return {
        "announcements": [
            {"id": a.id, "title": a.title, "body": a.body, "type": a.type, "is_active": a.is_active, "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in anns
        ]
    }


@router.post("/announcements")
def create_announcement(req: AnnouncementIn, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ann = Announcement(title=req.title, body=req.body, type=req.type)
    db.add(ann)
    db.commit()
    return {"status": "ok", "announcement_id": ann.id}


@router.delete("/announcements/{ann_id}")
def delete_announcement(ann_id: int, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if ann:
        db.delete(ann)
        db.commit()
    return {"status": "ok"}
