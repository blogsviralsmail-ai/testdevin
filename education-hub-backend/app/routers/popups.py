from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/popups", tags=["Popups"])


@router.get("")
async def list_popups(user: dict = Depends(get_current_user)):
    """List pop-ups based on user role and target audience."""
    conn = get_db()
    role = user.get("role", "")
    uid = int(user.get("sub", 0))

    if role in ("super_admin", "admin", "branch_admin"):
        # Admin sees all pop-ups
        rows = conn.execute(
            "SELECT * FROM popups ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    # For non-admin users, get active pop-ups not yet dismissed
    now_clause = "AND (p.start_date IS NULL OR p.start_date <= date('now')) AND (p.end_date IS NULL OR p.end_date >= date('now'))"

    if role == "center":
        # Center sees: target_audience in ('all', 'centers', 'all_centers', 'sub_centers')
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        is_sub = center.get("parent_center_id") is not None
        if is_sub:
            target_filter = "AND p.target_audience IN ('all', 'centers', 'all_centers', 'sub_centers')"
        else:
            target_filter = "AND p.target_audience IN ('all', 'centers', 'all_centers')"
        rows = conn.execute(f"""
            SELECT p.* FROM popups p
            LEFT JOIN popup_dismissals pd ON pd.popup_id = p.id AND pd.user_id = ?
            WHERE p.is_active = 1 AND pd.id IS NULL {now_clause} {target_filter}
            ORDER BY p.created_at DESC
        """, (uid,)).fetchall()
    elif role == "student":
        # Student sees: target depends on whether they are center student or direct student
        student = conn.execute("SELECT center_id FROM students WHERE user_id = ?", (uid,)).fetchone()
        if student and student["center_id"]:
            # Center student
            target_filter = "AND p.target_audience IN ('all', 'students', 'all_students', 'center_students')"
        else:
            # Direct/self student
            target_filter = "AND p.target_audience IN ('all', 'students', 'all_students', 'self_students')"
        rows = conn.execute(f"""
            SELECT p.* FROM popups p
            LEFT JOIN popup_dismissals pd ON pd.popup_id = p.id AND pd.user_id = ?
            WHERE p.is_active = 1 AND pd.id IS NULL {now_clause} {target_filter}
            ORDER BY p.created_at DESC
        """, (uid,)).fetchall()
    else:
        rows = []

    conn.close()
    return [dict(r) for r in rows]


@router.post("")
async def create_popup(data: dict, user: dict = Depends(require_admin)):
    """Admin creates a new pop-up."""
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO popups (title, content, popup_type, target_audience, image_url, link_url, link_text, is_active, start_date, end_date, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data.get("title", ""),
            data.get("content", ""),
            data.get("popup_type", "info"),
            data.get("target_audience", "all"),
            data.get("image_url", ""),
            data.get("link_url", ""),
            data.get("link_text", ""),
            data.get("is_active", 1),
            data.get("start_date") or None,
            data.get("end_date") or None,
            int(user["sub"]),
        )
    )
    conn.commit()
    pid = cursor.lastrowid
    conn.close()
    return {"id": pid, "message": "Pop-up created"}


@router.put("/{pid}")
async def update_popup(pid: int, data: dict, user: dict = Depends(require_admin)):
    """Admin updates a pop-up."""
    conn = get_db()
    existing = conn.execute("SELECT id FROM popups WHERE id = ?", (pid,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Pop-up not found")
    conn.execute(
        """UPDATE popups SET title=?, content=?, popup_type=?, target_audience=?, image_url=?, link_url=?, link_text=?, is_active=?, start_date=?, end_date=?, updated_at=CURRENT_TIMESTAMP
           WHERE id=?""",
        (
            data.get("title", ""),
            data.get("content", ""),
            data.get("popup_type", "info"),
            data.get("target_audience", "all"),
            data.get("image_url", ""),
            data.get("link_url", ""),
            data.get("link_text", ""),
            data.get("is_active", 1),
            data.get("start_date") or None,
            data.get("end_date") or None,
            pid,
        )
    )
    conn.commit()
    conn.close()
    return {"message": "Pop-up updated"}


@router.delete("/{pid}")
async def delete_popup(pid: int, user: dict = Depends(require_admin)):
    """Admin deletes a pop-up."""
    conn = get_db()
    conn.execute("DELETE FROM popup_dismissals WHERE popup_id = ?", (pid,))
    conn.execute("DELETE FROM popups WHERE id = ?", (pid,))
    conn.commit()
    conn.close()
    return {"message": "Pop-up deleted"}


@router.post("/{pid}/dismiss")
async def dismiss_popup(pid: int, user: dict = Depends(get_current_user)):
    """User dismisses a pop-up so it won't show again."""
    uid = int(user.get("sub", 0))
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO popup_dismissals (popup_id, user_id) VALUES (?, ?)",
            (pid, uid)
        )
        conn.commit()
    except Exception:
        pass  # Already dismissed
    conn.close()
    return {"message": "Pop-up dismissed"}
