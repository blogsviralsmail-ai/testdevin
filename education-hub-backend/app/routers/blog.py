from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
import os, uuid
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/blog", tags=["Blog"])
from app.utils.uploads import get_upload_dir
from app.utils.image_optimize import optimize_image

@router.get("")
async def list_posts(status: Optional[str] = None, limit: int = 50):
    conn = get_db()
    query = "SELECT * FROM blog_posts WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{pid}")
async def get_post(pid: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM blog_posts WHERE id = ?", (pid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    return dict(row)

@router.post("")
async def create_post(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO blog_posts (title, slug, content, excerpt, image, category, author, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (data.get("title",""), data.get("slug",""), data.get("content",""), data.get("excerpt",""),
         data.get("image",""), data.get("category","General"), data.get("author","Admin"), data.get("status","published"))
    )
    conn.commit()
    pid = cursor.lastrowid
    conn.close()
    return {"id": pid, "message": "Post created"}

@router.put("/{pid}")
async def update_post(pid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE blog_posts SET title=?, slug=?, content=?, excerpt=?, image=?, category=?, author=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (data.get("title",""), data.get("slug",""), data.get("content",""), data.get("excerpt",""),
         data.get("image",""), data.get("category","General"), data.get("author","Admin"), data.get("status","published"), pid)
    )
    conn.commit()
    conn.close()
    return {"message": "Post updated"}

@router.delete("/{pid}")
async def delete_post(pid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM blog_posts WHERE id = ?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Post deleted"}

@router.post("/upload-image")
async def upload_blog_image(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    upload_dir = get_upload_dir()
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"blog_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    content = await file.read()
    content, filename = optimize_image(content, filename)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}"}
