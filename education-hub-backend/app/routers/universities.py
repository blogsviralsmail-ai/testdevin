from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import os, uuid
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

from app.utils.uploads import get_upload_dir
from app.utils.image_optimize import optimize_logo

router = APIRouter(prefix="/api/universities", tags=["Universities"])

class UniversityCreate(BaseModel):
    name: str
    code: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"

@router.get("")
async def list_universities():
    conn = get_db()
    rows = conn.execute("SELECT * FROM universities ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{uid}")
async def get_university(uid: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM universities WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="University not found")
    return dict(row)

@router.post("")
async def create_university(data: UniversityCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO universities (name, code, logo, description, website, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (data.name, data.code, data.logo, data.description, data.website, data.address, data.status)
    )
    uid = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": uid, "message": "University created"}

@router.put("/{uid}")
async def update_university(uid: int, data: UniversityCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE universities SET name=?, code=?, logo=?, description=?, website=?, address=?, status=? WHERE id=?",
        (data.name, data.code, data.logo, data.description, data.website, data.address, data.status, uid)
    )
    conn.commit()
    conn.close()
    return {"message": "University updated"}

@router.post("/{uid}/upload-logo")
async def upload_university_logo(uid: int, file: UploadFile = File(...), user: dict = Depends(require_admin)):
    """Upload a logo image for a university."""
    upload_dir = get_upload_dir()
    os.makedirs(upload_dir + "/logos", exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"uni_{uid}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(upload_dir, "logos", filename)
    content = await file.read()
    content, filename = optimize_logo(content, filename)
    filepath = os.path.join(upload_dir, "logos", filename)
    with open(filepath, "wb") as f:
        f.write(content)
    logo_url = f"/uploads/logos/{filename}"
    conn = get_db()
    conn.execute("UPDATE universities SET logo = ? WHERE id = ?", (logo_url, uid))
    conn.commit()
    conn.close()
    return {"url": logo_url, "message": "Logo uploaded"}

@router.delete("/{uid}")
async def delete_university(uid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM universities WHERE id = ?", (uid,))
    conn.commit()
    conn.close()
    return {"message": "University deleted"}
