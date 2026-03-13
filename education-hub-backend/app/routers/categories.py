from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])

class CategoryCreate(BaseModel):
    university_id: Optional[int] = None
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    duration: Optional[str] = None
    fee: Optional[str] = None
    mode: str = "Regular"
    image: Optional[str] = None
    status: str = "active"

@router.get("")
async def list_categories(university_id: Optional[int] = None, mode: Optional[str] = None):
    conn = get_db()
    query = "SELECT c.*, u.name as university_name FROM categories c LEFT JOIN universities u ON c.university_id = u.id WHERE 1=1"
    params = []
    if university_id:
        query += " AND c.university_id = ?"
        params.append(university_id)
    if mode:
        query += " AND c.mode = ?"
        params.append(mode)
    query += " ORDER BY c.name"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{cid}")
async def get_category(cid: int):
    conn = get_db()
    row = conn.execute("SELECT c.*, u.name as university_name FROM categories c LEFT JOIN universities u ON c.university_id = u.id WHERE c.id = ?", (cid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    return dict(row)

@router.get("/slug/{slug}")
async def get_category_by_slug(slug: str):
    conn = get_db()
    row = conn.execute("SELECT c.*, u.name as university_name FROM categories c LEFT JOIN universities u ON c.university_id = u.id WHERE c.slug = ?", (slug,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    return dict(row)

@router.post("")
async def create_category(data: CategoryCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    slug = data.slug or data.name.lower().replace(" ", "-").replace(".", "")
    cursor = conn.execute(
        "INSERT INTO categories (university_id, name, slug, description, eligibility, duration, fee, mode, image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.university_id, data.name, slug, data.description, data.eligibility, data.duration, data.fee, data.mode, data.image, data.status)
    )
    conn.commit()
    cid = cursor.lastrowid
    conn.close()
    return {"id": cid, "message": "Category created"}

@router.put("/{cid}")
async def update_category(cid: int, data: CategoryCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    slug = data.slug or data.name.lower().replace(" ", "-").replace(".", "")
    conn.execute(
        "UPDATE categories SET university_id=?, name=?, slug=?, description=?, eligibility=?, duration=?, fee=?, mode=?, image=?, status=? WHERE id=?",
        (data.university_id, data.name, slug, data.description, data.eligibility, data.duration, data.fee, data.mode, data.image, data.status, cid)
    )
    conn.commit()
    conn.close()
    return {"message": "Category updated"}

@router.delete("/{cid}")
async def delete_category(cid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM categories WHERE id = ?", (cid,))
    conn.commit()
    conn.close()
    return {"message": "Category deleted"}
