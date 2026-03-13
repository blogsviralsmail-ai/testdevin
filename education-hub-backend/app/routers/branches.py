from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/branches", tags=["Branches"])

class BranchCreate(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    admin_user_id: Optional[int] = None
    share_percentage: float = 0
    status: str = "active"

@router.get("")
async def list_branches():
    conn = get_db()
    rows = conn.execute("""SELECT b.*, u.name as admin_name, 
                           (SELECT COUNT(*) FROM students WHERE branch_id = b.id) as student_count
                           FROM branches b LEFT JOIN users u ON b.admin_user_id = u.id ORDER BY b.name""").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{bid}")
async def get_branch(bid: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM branches WHERE id = ?", (bid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Branch not found")
    return dict(row)

@router.post("")
async def create_branch(data: BranchCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO branches (name, code, address, contact, email, admin_user_id, share_percentage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (data.name, data.code, data.address, data.contact, data.email, data.admin_user_id, data.share_percentage, data.status)
    )
    conn.commit()
    bid = cursor.lastrowid
    conn.close()
    return {"id": bid, "message": "Branch created"}

@router.put("/{bid}")
async def update_branch(bid: int, data: BranchCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE branches SET name=?, code=?, address=?, contact=?, email=?, admin_user_id=?, share_percentage=?, status=? WHERE id=?",
        (data.name, data.code, data.address, data.contact, data.email, data.admin_user_id, data.share_percentage, data.status, bid)
    )
    conn.commit()
    conn.close()
    return {"message": "Branch updated"}

@router.delete("/{bid}")
async def delete_branch(bid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM branches WHERE id = ?", (bid,))
    conn.commit()
    conn.close()
    return {"message": "Branch deleted"}

@router.get("/{bid}/share")
async def get_branch_share(bid: int):
    conn = get_db()
    branch = conn.execute("SELECT * FROM branches WHERE id = ?", (bid,)).fetchone()
    if not branch:
        conn.close()
        raise HTTPException(status_code=404, detail="Branch not found")
    total_revenue = conn.execute("SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN students s ON t.student_id = s.id WHERE s.branch_id = ?", (bid,)).fetchone()[0]
    share = total_revenue * (branch["share_percentage"] / 100)
    conn.close()
    return {"branch": dict(branch), "total_revenue": total_revenue, "share_amount": share}
