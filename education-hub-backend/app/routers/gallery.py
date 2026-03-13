from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
import os, uuid
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/gallery", tags=["Gallery"])

from app.utils.uploads import get_upload_dir
from app.utils.image_optimize import optimize_image

@router.get("")
async def list_images(category: Optional[str] = None, university: Optional[str] = None):
    conn = get_db()
    query = "SELECT * FROM gallery WHERE 1=1"
    params = []
    if category:
        query += " AND category = ?"
        params.append(category)
    if university:
        query += " AND university = ?"
        params.append(university)
    query += " ORDER BY display_order, created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
async def add_image(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO gallery (title, image, category, description, university, display_order) VALUES (?, ?, ?, ?, ?, ?)",
        (data.get("title",""), data.get("image",""), data.get("category","General"), data.get("description",""), data.get("university",""), data.get("display_order", 99))
    )
    conn.commit()
    gid = cursor.lastrowid
    conn.close()
    return {"id": gid, "message": "Image added"}

@router.put("/{gid}")
async def update_image(gid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE gallery SET title=?, image=?, category=?, description=?, university=?, display_order=? WHERE id=?",
        (data.get("title",""), data.get("image",""), data.get("category","General"), data.get("description",""), data.get("university",""), data.get("display_order", 99), gid)
    )
    conn.commit()
    conn.close()
    return {"message": "Image updated"}

@router.delete("/{gid}")
async def delete_image(gid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM gallery WHERE id = ?", (gid,))
    conn.commit()
    conn.close()
    return {"message": "Image deleted"}

@router.post("/upload")
async def upload_gallery_image(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    upload_dir = get_upload_dir()
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"gallery_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    content = await file.read()
    content, filename = optimize_image(content, filename)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}"}
