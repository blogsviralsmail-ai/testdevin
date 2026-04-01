from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os, uuid
from app.database import get_db
from app.utils.auth import require_admin

from app.utils.uploads import get_upload_dir
from app.utils.image_optimize import optimize_thumbnail

router = APIRouter(prefix="/api/testimonials", tags=["Testimonials"])

class TestimonialCreate(BaseModel):
    name: str
    course: Optional[str] = None
    university: Optional[str] = None
    text: str
    rating: int = 5
    photo: Optional[str] = None
    status: str = "active"
    display_order: int = 99

@router.get("")
async def list_testimonials(status: Optional[str] = None):
    conn = get_db()
    if status:
        rows = conn.execute("SELECT * FROM testimonials WHERE status = ? ORDER BY display_order", (status,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM testimonials ORDER BY display_order").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/public")
async def public_testimonials():
    conn = get_db()
    rows = conn.execute("SELECT * FROM testimonials WHERE status = 'active' ORDER BY display_order").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
async def create_testimonial(data: TestimonialCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO testimonials (name, course, university, text, rating, photo, status, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (data.name, data.course, data.university, data.text, data.rating, data.photo, data.status, data.display_order)
    )
    tid = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": tid, "message": "Testimonial created"}

@router.put("/{tid}")
async def update_testimonial(tid: int, data: TestimonialCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE testimonials SET name=?, course=?, university=?, text=?, rating=?, photo=?, status=?, display_order=? WHERE id=?",
        (data.name, data.course, data.university, data.text, data.rating, data.photo, data.status, data.display_order, tid)
    )
    conn.commit()
    conn.close()
    return {"message": "Testimonial updated"}

@router.post("/{tid}/upload-photo")
async def upload_testimonial_photo(tid: int, file: UploadFile = File(...), user: dict = Depends(require_admin)):
    """Upload a photo for a testimonial."""
    upload_dir = get_upload_dir()
    os.makedirs(upload_dir + "/photos", exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"testimonial_{tid}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(upload_dir, "photos", filename)
    content = await file.read()
    content, filename = optimize_thumbnail(content, filename)
    filepath = os.path.join(upload_dir, "photos", filename)
    with open(filepath, "wb") as f:
        f.write(content)
    photo_url = f"/uploads/photos/{filename}"
    conn = get_db()
    conn.execute("UPDATE testimonials SET photo = ? WHERE id = ?", (photo_url, tid))
    conn.commit()
    conn.close()
    return {"url": photo_url, "message": "Photo uploaded"}

@router.delete("/{tid}")
async def delete_testimonial(tid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM testimonials WHERE id = ?", (tid,))
    conn.commit()
    conn.close()
    return {"message": "Testimonial deleted"}
