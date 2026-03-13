from fastapi import APIRouter, Depends
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/team", tags=["Team"])


@router.get("")
async def get_team():
    conn = get_db()
    rows = conn.execute("SELECT * FROM team_members ORDER BY display_order, id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("")
async def create_member(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO team_members (name, position, role_type, photo, bio, email, phone, linkedin, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("name"),
            data.get("position"),
            data.get("role_type", "staff"),
            data.get("photo", ""),
            data.get("bio", ""),
            data.get("email", ""),
            data.get("phone", ""),
            data.get("linkedin", ""),
            data.get("display_order", 99),
        ),
    )
    conn.commit()
    mid = cursor.lastrowid
    conn.close()
    return {"id": mid, "message": "Team member added"}


@router.put("/{member_id}")
async def update_member(member_id: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    fields = []
    values = []
    for key in ["name", "position", "role_type", "photo", "bio", "email", "phone", "linkedin", "display_order", "status"]:
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if fields:
        values.append(member_id)
        conn.execute(f"UPDATE team_members SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    conn.close()
    return {"message": "Team member updated"}


@router.delete("/{member_id}")
async def delete_member(member_id: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM team_members WHERE id = ?", (member_id,))
    conn.commit()
    conn.close()
    return {"message": "Team member deleted"}
