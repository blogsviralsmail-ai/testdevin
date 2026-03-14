from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/notices", tags=["Notices"])

@router.get("")
async def list_notices(status: Optional[str] = None, center_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    conn = get_db()
    query = "SELECT n.*, c.name as center_name FROM notices n LEFT JOIN centers c ON n.center_id = c.id WHERE 1=1"
    params = []
    role = user.get("role", "")
    # Students only see published notices relevant to them
    if role == "student":
        query += " AND n.status = 'published'"
        # Get student's center_id to filter notices
        uid = int(user.get("sub", 0))
        student = conn.execute("SELECT center_id FROM students WHERE user_id = ?", (uid,)).fetchone()
        if student and student["center_id"]:
            # Center student sees: admin notices (center_id IS NULL) + own center notices
            query += " AND (n.center_id IS NULL OR n.center_id = ?)"
            params.append(student["center_id"])
        else:
            # Direct student sees only admin notices
            query += " AND n.center_id IS NULL"
    elif role == "center":
        # Center sees their own notices + admin notices
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        cid = center["id"]
        query += " AND (n.center_id IS NULL OR n.center_id = ?)"
        params.append(cid)
    else:
        # Admin sees all notices, optionally filtered
        if center_id:
            query += " AND n.center_id = ?"
            params.append(center_id)
        if status:
            query += " AND n.status = ?"
            params.append(status)
    query += " ORDER BY n.is_pinned DESC, n.created_at DESC"
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
async def create_notice(data: dict, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    center_id = None
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        center_id = center["id"]
    elif role not in ("super_admin", "admin", "branch_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create notices")
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO notices (title, content, category, priority, is_pinned, status, attachment_url, created_by, center_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.get("title", ""), data.get("content", ""), data.get("category", "General"),
         data.get("priority", "normal"), data.get("is_pinned", 0), data.get("status", "published"),
         data.get("attachment_url", ""), int(user["sub"]), center_id)
    )
    conn.commit()
    nid = cursor.lastrowid
    conn.close()
    return {"id": nid, "message": "Notice created"}

@router.put("/{nid}")
async def update_notice(nid: int, data: dict, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    conn = get_db()
    # Center can only edit their own notices
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        notice = conn.execute("SELECT center_id FROM notices WHERE id = ?", (nid,)).fetchone()
        if not notice or notice["center_id"] != center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Cannot edit this notice")
    elif role not in ("super_admin", "admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
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
async def delete_notice(nid: int, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    conn = get_db()
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        notice = conn.execute("SELECT center_id FROM notices WHERE id = ?", (nid,)).fetchone()
        if not notice or notice["center_id"] != center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Cannot delete this notice")
    elif role not in ("super_admin", "admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
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
