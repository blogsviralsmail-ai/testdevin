from fastapi import APIRouter, HTTPException, Depends, Query
from app.database import get_db
from app.models import BlogCreate, BlogUpdate
from app.auth import verify_token

router = APIRouter(prefix="/api/blogs", tags=["Blogs"])


@router.get("")
async def get_blogs(page: int = Query(default=1, ge=1), limit: int = Query(default=10, le=50), category: str = Query(default=None)):
    conn = get_db()
    where = ["is_published = 1"]
    params = []
    if category:
        where.append("category = ?")
        params.append(category)
    where_clause = " AND ".join(where)
    offset = (page - 1) * limit
    total = conn.execute(f"SELECT COUNT(*) as cnt FROM blogs WHERE {where_clause}", params).fetchone()["cnt"]
    blogs = conn.execute(
        f"SELECT id, title, title_hi, slug, excerpt, excerpt_hi, image_url, category, tags, views, created_at FROM blogs WHERE {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset]
    ).fetchall()
    conn.close()
    return {"data": [dict(b) for b in blogs], "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.get("/recent")
async def get_recent_blogs(limit: int = Query(default=5, le=20)):
    conn = get_db()
    blogs = conn.execute(
        "SELECT id, title, title_hi, slug, excerpt, excerpt_hi, image_url, category, created_at FROM blogs WHERE is_published = 1 ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return {"data": [dict(b) for b in blogs]}


@router.get("/{slug}")
async def get_blog(slug: str):
    conn = get_db()
    blog = conn.execute("SELECT * FROM blogs WHERE slug = ? AND is_published = 1", (slug,)).fetchone()
    if not blog:
        conn.close()
        raise HTTPException(status_code=404, detail="Blog not found")
    conn.execute("UPDATE blogs SET views = views + 1 WHERE slug = ?", (slug,))
    conn.commit()
    result = dict(blog)
    related = conn.execute(
        "SELECT id, title, title_hi, slug, excerpt_hi, image_url, created_at FROM blogs WHERE category = ? AND slug != ? AND is_published = 1 ORDER BY created_at DESC LIMIT 4",
        (result["category"], slug)
    ).fetchall()
    conn.close()
    return {"data": result, "related": [dict(r) for r in related]}


@router.get("/admin/all")
async def get_all_blogs_admin(admin: str = Depends(verify_token), page: int = 1, limit: int = 50):
    conn = get_db()
    offset = (page - 1) * limit
    total = conn.execute("SELECT COUNT(*) as cnt FROM blogs").fetchone()["cnt"]
    blogs = conn.execute("SELECT * FROM blogs ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
    conn.close()
    return {"data": [dict(b) for b in blogs], "total": total}


@router.post("")
async def create_blog(blog: BlogCreate, admin: str = Depends(verify_token)):
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO blogs (title, title_hi, slug, content, content_hi, excerpt, excerpt_hi, image_url, category, tags, is_published)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (blog.title, blog.title_hi, blog.slug, blog.content, blog.content_hi,
             blog.excerpt, blog.excerpt_hi, blog.image_url, blog.category, blog.tags, int(blog.is_published))
        )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return {"message": "Blog created successfully"}


@router.put("/{blog_id}")
async def update_blog(blog_id: int, update: BlogUpdate, admin: str = Depends(verify_token)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM blogs WHERE id = ?", (blog_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Blog not found")
    updates = {k: v for k, v in update.model_dump().items() if v is not None}
    if "is_published" in updates:
        updates["is_published"] = int(updates["is_published"])
    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [blog_id]
        conn.execute(f"UPDATE blogs SET {set_clause}, updated_at = datetime('now') WHERE id = ?", values)
        conn.commit()
    conn.close()
    return {"message": "Blog updated successfully"}


@router.delete("/{blog_id}")
async def delete_blog(blog_id: int, admin: str = Depends(verify_token)):
    conn = get_db()
    conn.execute("DELETE FROM blogs WHERE id = ?", (blog_id,))
    conn.commit()
    conn.close()
    return {"message": "Blog deleted successfully"}
