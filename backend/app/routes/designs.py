from fastapi import APIRouter, HTTPException, Depends, Query
from app.database import get_db
from app.models import DesignCreate, DesignUpdate
from app.auth import verify_token
import json

router = APIRouter(prefix="/api/designs", tags=["Designs"])


@router.get("")
async def get_designs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=100),
    category: str = Query(default=None),
    featured: bool = Query(default=None),
    search: str = Query(default=None)
):
    conn = get_db()
    where = ["d.is_active = 1"]
    params = []
    if category:
        where.append("c.slug = ?")
        params.append(category)
    if featured is not None:
        where.append("d.is_featured = ?")
        params.append(int(featured))
    if search:
        where.append("(d.title LIKE ? OR d.title_hi LIKE ? OR d.tags LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    where_clause = " AND ".join(where)
    offset = (page - 1) * limit

    total = conn.execute(
        f"SELECT COUNT(*) as cnt FROM designs d LEFT JOIN categories c ON d.category_id = c.id WHERE {where_clause}",
        params
    ).fetchone()["cnt"]

    designs = conn.execute(
        f"""SELECT d.*, c.name as category_name, c.name_hi as category_name_hi, c.slug as category_slug
        FROM designs d LEFT JOIN categories c ON d.category_id = c.id
        WHERE {where_clause}
        ORDER BY d.is_featured DESC, d.created_at DESC LIMIT ? OFFSET ?""",
        params + [limit, offset]
    ).fetchall()

    result = []
    for d in designs:
        dd = dict(d)
        dd["images"] = json.loads(dd["images"]) if dd["images"] else []
        result.append(dd)
    conn.close()
    return {"data": result, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.get("/featured")
async def get_featured_designs(limit: int = Query(default=12, le=50)):
    conn = get_db()
    designs = conn.execute(
        """SELECT d.*, c.name as category_name, c.name_hi as category_name_hi, c.slug as category_slug
        FROM designs d LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.is_featured = 1 AND d.is_active = 1
        ORDER BY d.created_at DESC LIMIT ?""",
        (limit,)
    ).fetchall()
    result = []
    for d in designs:
        dd = dict(d)
        dd["images"] = json.loads(dd["images"]) if dd["images"] else []
        result.append(dd)
    conn.close()
    return {"data": result}


@router.get("/popular")
async def get_popular_designs(limit: int = Query(default=12, le=50)):
    conn = get_db()
    designs = conn.execute(
        """SELECT d.*, c.name as category_name, c.name_hi as category_name_hi, c.slug as category_slug
        FROM designs d LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.is_active = 1
        ORDER BY d.views DESC LIMIT ?""",
        (limit,)
    ).fetchall()
    result = []
    for d in designs:
        dd = dict(d)
        dd["images"] = json.loads(dd["images"]) if dd["images"] else []
        result.append(dd)
    conn.close()
    return {"data": result}


@router.get("/{slug}")
async def get_design(slug: str):
    conn = get_db()
    design = conn.execute(
        """SELECT d.*, c.name as category_name, c.name_hi as category_name_hi, c.slug as category_slug
        FROM designs d LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.slug = ?""",
        (slug,)
    ).fetchone()
    if not design:
        conn.close()
        raise HTTPException(status_code=404, detail="Design not found")
    dd = dict(design)
    dd["images"] = json.loads(dd["images"]) if dd["images"] else []
    # Increment views
    conn.execute("UPDATE designs SET views = views + 1 WHERE slug = ?", (slug,))
    # Get related designs from same category
    related = conn.execute(
        """SELECT d.*, c.slug as category_slug FROM designs d
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.category_id = ? AND d.id != ? AND d.is_active = 1
        ORDER BY RANDOM() LIMIT 6""",
        (dd["category_id"], dd["id"])
    ).fetchall()
    related_list = []
    for r in related:
        rd = dict(r)
        rd["images"] = json.loads(rd["images"]) if rd["images"] else []
        related_list.append(rd)
    conn.commit()
    conn.close()
    return {"data": dd, "related": related_list}


@router.get("/admin/all")
async def get_all_designs_admin(
    admin: str = Depends(verify_token),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200)
):
    conn = get_db()
    offset = (page - 1) * limit
    total = conn.execute("SELECT COUNT(*) as cnt FROM designs").fetchone()["cnt"]
    designs = conn.execute(
        """SELECT d.*, c.name as category_name FROM designs d
        LEFT JOIN categories c ON d.category_id = c.id
        ORDER BY d.created_at DESC LIMIT ? OFFSET ?""",
        (limit, offset)
    ).fetchall()
    result = []
    for d in designs:
        dd = dict(d)
        dd["images"] = json.loads(dd["images"]) if dd["images"] else []
        result.append(dd)
    conn.close()
    return {"data": result, "total": total, "page": page}


@router.post("")
async def create_design(design: DesignCreate, admin: str = Depends(verify_token)):
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO designs (title, title_hi, slug, category_id, description, description_hi,
            weight_grams, purity, price_range, images, tags, is_featured, is_active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (design.title, design.title_hi, design.slug, design.category_id,
             design.description, design.description_hi, design.weight_grams,
             design.purity, design.price_range, json.dumps(design.images),
             design.tags, int(design.is_featured), int(design.is_active))
        )
        conn.commit()
        design_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return {"message": "Design created successfully", "id": design_id}


@router.put("/{design_id}")
async def update_design(design_id: int, update: DesignUpdate, admin: str = Depends(verify_token)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM designs WHERE id = ?", (design_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Design not found")
    updates = {k: v for k, v in update.model_dump().items() if v is not None}
    if "images" in updates:
        updates["images"] = json.dumps(updates["images"])
    if "is_featured" in updates:
        updates["is_featured"] = int(updates["is_featured"])
    if "is_active" in updates:
        updates["is_active"] = int(updates["is_active"])
    if updates:
        updates["updated_at"] = "datetime('now')"
        set_parts = []
        values = []
        for k, v in updates.items():
            if k == "updated_at":
                set_parts.append(f"{k} = datetime('now')")
            else:
                set_parts.append(f"{k} = ?")
                values.append(v)
        set_clause = ", ".join(set_parts)
        values.append(design_id)
        conn.execute(f"UPDATE designs SET {set_clause} WHERE id = ?", values)
        conn.commit()
    conn.close()
    return {"message": "Design updated successfully"}


@router.delete("/{design_id}")
async def delete_design(design_id: int, admin: str = Depends(verify_token)):
    conn = get_db()
    conn.execute("DELETE FROM designs WHERE id = ?", (design_id,))
    conn.commit()
    conn.close()
    return {"message": "Design deleted successfully"}
