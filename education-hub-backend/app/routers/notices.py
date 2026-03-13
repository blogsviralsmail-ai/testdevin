from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/notices", tags=["Notices"])

@router.get("")
async def list_notices(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    conn = get_db()
    query = "SELECT * FROM notices WHERE 1=1"
    params = []
    # Students only see published notices
    if user.get("role") == "student":
        query += " AND status = 'published'"
    elif status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY is_pinned DESC, created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{nid}")
async def get_notice(nid: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    notice = conn.execute("SELECT * FROM notices WHERE id = ?", (nid,)).fetchone()
    conn.close()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    return dict(notice)

@router.post("")
async def create_notice(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO notices (title, content, category, priority, is_pinned, status, attachment_url, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.get("title", ""), data.get("content", ""), data.get("category", "General"),
         data.get("priority", "normal"), data.get("is_pinned", 0), data.get("status", "published"),
         data.get("attachment_url", ""), int(user["sub"]))
    )
    conn.commit()
    nid = cursor.lastrowid
    conn.close()
    return {"id": nid, "message": "Notice created"}

@router.put("/{nid}")
async def update_notice(nid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        """UPDATE notices SET title=?, content=?, category=?, priority=?, is_pinned=?, status=?, attachment_url=?, updated_at=CURRENT_TIMESTAMP
           WHERE id=?""",
        (data.get("title", ""), data.get("content", ""), data.get("category", "General"),
         data.get("priority", "normal"), data.get("is_pinned", 0), data.get("status", "published"),
         data.get("attachment_url", ""), nid)
    )
    conn.commit()
    conn.close()
    return {"message": "Notice updated"}

@router.delete("/{nid}")
async def delete_notice(nid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM notices WHERE id = ?", (nid,))
    conn.commit()
    conn.close()
    return {"message": "Notice deleted"}

@router.post("/bulk-delete")
async def bulk_delete_notices(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    conn = get_db()
    placeholders = ",".join(["?" for _ in ids])
    conn.execute(f"DELETE FROM notices WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"Deleted {len(ids)} notices"}
