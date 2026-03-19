from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models import CategoryCreate, CategoryUpdate
from app.auth import verify_token
import json

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("")
async def get_categories():
    conn = get_db()
    categories = conn.execute(
        "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC"
    ).fetchall()
    result = []
    for cat in categories:
        c = dict(cat)
        design_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM designs WHERE category_id = ? AND is_active = 1",
            (c["id"],)
        ).fetchone()["cnt"]
        c["design_count"] = design_count
        result.append(c)
    conn.close()
    return {"data": result}


@router.get("/all")
async def get_all_categories(admin: str = Depends(verify_token)):
    conn = get_db()
    categories = conn.execute("SELECT * FROM categories ORDER BY sort_order ASC").fetchall()
    conn.close()
    return {"data": [dict(c) for c in categories]}


@router.get("/{slug}")
async def get_category(slug: str, page: int = 1, limit: int = 20):
    conn = get_db()
    category = conn.execute("SELECT * FROM categories WHERE slug = ?", (slug,)).fetchone()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    cat = dict(category)
    offset = (page - 1) * limit
    designs = conn.execute(
        "SELECT * FROM designs WHERE category_id = ? AND is_active = 1 ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?",
        (cat["id"], limit, offset)
    ).fetchall()
    total = conn.execute(
        "SELECT COUNT(*) as cnt FROM designs WHERE category_id = ? AND is_active = 1",
        (cat["id"],)
    ).fetchone()["cnt"]
    designs_list = []
    for d in designs:
        dd = dict(d)
        dd["images"] = json.loads(dd["images"]) if dd["images"] else []
        designs_list.append(dd)
    conn.close()
    return {"category": cat, "designs": designs_list, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.post("")
async def create_category(category: CategoryCreate, admin: str = Depends(verify_token)):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO categories (name, name_hi, slug, description, description_hi, image_url, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?)",
            (category.name, category.name_hi, category.slug, category.description,
             category.description_hi, category.image_url, category.sort_order, int(category.is_active))
        )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return {"message": "Category created successfully"}


@router.put("/{cat_id}")
async def update_category(cat_id: int, update: CategoryUpdate, admin: str = Depends(verify_token)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM categories WHERE id = ?", (cat_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Category not found")
    updates = {k: v for k, v in update.model_dump().items() if v is not None}
    if "is_active" in updates:
        updates["is_active"] = int(updates["is_active"])
    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [cat_id]
        conn.execute(f"UPDATE categories SET {set_clause} WHERE id = ?", values)
        conn.commit()
    conn.close()
    return {"message": "Category updated successfully"}


@router.delete("/{cat_id}")
async def delete_category(cat_id: int, admin: str = Depends(verify_token)):
    conn = get_db()
    conn.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    conn.commit()
    conn.close()
    return {"message": "Category deleted successfully"}
