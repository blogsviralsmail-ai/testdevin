from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/student-status", tags=["Student Status Categories"])

@router.get("")
async def list_status_categories():
    conn = get_db()
    rows = conn.execute("SELECT * FROM student_status_categories ORDER BY display_order").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
async def create_status_category(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO student_status_categories (name, color, description, display_order) VALUES (?, ?, ?, ?)",
            (data.get("name",""), data.get("color","#6B7280"), data.get("description",""), data.get("display_order", 99))
        )
        conn.commit()
        sid = cursor.lastrowid
        conn.close()
        return {"id": sid, "message": "Status category created"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Status category already exists or error: {str(e)}")

@router.put("/{sid}")
async def update_status_category(sid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE student_status_categories SET name=?, color=?, description=?, display_order=? WHERE id=?",
        (data.get("name",""), data.get("color","#6B7280"), data.get("description",""), data.get("display_order", 99), sid)
    )
    conn.commit()
    conn.close()
    return {"message": "Status category updated"}

@router.delete("/{sid}")
async def delete_status_category(sid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM student_status_categories WHERE id = ?", (sid,))
    conn.commit()
    conn.close()
    return {"message": "Status category deleted"}

@router.delete("/bulk")
async def bulk_delete_status_categories(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No categories selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM student_status_categories WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} status categories deleted"}
