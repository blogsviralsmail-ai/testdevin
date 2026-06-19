from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    store_type: Optional[str] = None


class ThemeUpdate(BaseModel):
    theme: str = "light"


@router.get("/")
def get_settings(user: User = Depends(get_current_user)):
    return {
        "name": user.name,
        "email": user.email,
        "brand": user.brand,
        "plan": user.plan,
        "features": user.features or [],
        "store_type": user.store_type,
        "theme": user.theme,
    }


@router.post("/profile")
def update_profile(req: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.name is not None:
        user.name = req.name
    if req.brand is not None:
        user.brand = req.brand
    if req.store_type is not None:
        user.store_type = req.store_type
    db.commit()
    return {"status": "ok"}


@router.post("/theme")
def update_theme(req: ThemeUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.theme = req.theme
    db.commit()
    return {"status": "ok", "theme": user.theme}
