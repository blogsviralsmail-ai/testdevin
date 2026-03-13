from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/support", tags=["Support"])

class TicketCreate(BaseModel):
    student_id: Optional[int] = None
    category: str
    subject: str
    description: Optional[str] = None
    priority: str = "medium"

class TicketMessageCreate(BaseModel):
    ticket_id: int
    message: str

TICKET_CATEGORIES = [
    "Admission", "Re-Registration", "Examination", "Marksheet",
    "Transcript", "Revaluation", "Migration", "Original Degree",
    "E-Learning", "Other"
]

@router.get("/categories")
async def get_ticket_categories():
    return TICKET_CATEGORIES

@router.get("/tickets")
async def list_tickets(
    category: Optional[str] = None,
    status: Optional[str] = None,
    student_id: Optional[int] = None,
    user: dict = Depends(get_current_user)
):
    conn = get_db()
    query = """SELECT t.*, st.name as student_name, st.enrollment_no
               FROM tickets t LEFT JOIN students st ON t.student_id = st.id WHERE 1=1"""
    params = []
    if category:
        query += " AND t.category = ?"
        params.append(category)
    if status:
        query += " AND t.status = ?"
        params.append(status)
    if student_id:
        query += " AND t.student_id = ?"
        params.append(student_id)
    if user.get("role") == "student":
        query += " AND t.student_id IN (SELECT id FROM students WHERE user_id = ?)"
        params.append(int(user["sub"]))
    query += " ORDER BY t.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/tickets/{tid}")
async def get_ticket(tid: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    ticket = conn.execute("SELECT t.*, st.name as student_name FROM tickets t LEFT JOIN students st ON t.student_id = st.id WHERE t.id = ?", (tid,)).fetchone()
    if not ticket:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
    messages = conn.execute("SELECT tm.*, u.name as sender_name, u.role as sender_role FROM ticket_messages tm JOIN users u ON tm.sender_id = u.id WHERE tm.ticket_id = ? ORDER BY tm.created_at", (tid,)).fetchall()
    conn.close()
    return {"ticket": dict(ticket), "messages": [dict(m) for m in messages]}

@router.get("/tickets/{tid}/messages")
async def get_ticket_messages(tid: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    messages = conn.execute(
        """SELECT tm.*, u.name as sender_name, u.role as sender_type 
           FROM ticket_messages tm JOIN users u ON tm.sender_id = u.id 
           WHERE tm.ticket_id = ? ORDER BY tm.created_at""", (tid,)
    ).fetchall()
    conn.close()
    return [dict(m) for m in messages]

@router.post("/tickets")
async def create_ticket(data: dict, user: dict = Depends(get_current_user)):
    conn = get_db()
    student_id = data.get("student_id")
    if user.get("role") == "student" and not student_id:
        student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
        if student:
            student_id = student["id"]
    cursor = conn.execute(
        "INSERT INTO tickets (student_id, category, subject, description, priority) VALUES (?, ?, ?, ?, ?)",
        (student_id, data.get("category", ""), data.get("subject", ""), data.get("description", ""), data.get("priority", "medium"))
    )
    tid = cursor.lastrowid
    # Store initial message if provided
    msg = data.get("message", "")
    if msg:
        conn.execute("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)",
                     (tid, int(user["sub"]), msg))
    conn.commit()
    # Send notification
    try:
        from app.utils.notifications import send_notification
        student_name = ""
        if student_id:
            st = conn.execute("SELECT name FROM students WHERE id=?", (student_id,)).fetchone()
            student_name = st["name"] if st else ""
        send_notification(conn, "support", "New Support Ticket",
            f"Subject: {data.get('subject','')}\nCategory: {data.get('category','')}\nPriority: {data.get('priority','medium')}\nStudent: {student_name or 'N/A'}",
            "/admin/support")
    except Exception as e:
        print(f"[Notification Error] Support: {e}")
    conn.close()
    return {"id": tid, "message": "Ticket created"}

@router.put("/tickets/{tid}/status")
async def update_ticket_status(tid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (data.get("status"), tid))
    conn.commit()
    conn.close()
    return {"message": "Ticket status updated"}

@router.post("/tickets/{tid}/messages")
async def add_ticket_message(tid: int, data: dict, user: dict = Depends(get_current_user)):
    conn = get_db()
    conn.execute("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)",
                 (tid, int(user["sub"]), data.get("message", "")))
    conn.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (tid,))
    conn.commit()
    conn.close()
    return {"message": "Message added"}

@router.delete("/tickets/{tid}")
async def delete_ticket(tid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM ticket_messages WHERE ticket_id = ?", (tid,))
    conn.execute("DELETE FROM tickets WHERE id = ?", (tid,))
    conn.commit()
    conn.close()
    return {"message": "Ticket deleted"}

@router.post("/tickets/bulk-delete")
async def bulk_delete_tickets(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    conn = get_db()
    placeholders = ",".join(["?" for _ in ids])
    conn.execute(f"DELETE FROM ticket_messages WHERE ticket_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM tickets WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"Deleted {len(ids)} tickets"}

@router.put("/tickets/{tid}/solution")
async def add_ticket_solution(tid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    solution = data.get("solution", "")
    conn.execute("UPDATE tickets SET solution = ?, status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (solution, tid))
    # Also add as a message
    conn.execute("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES (?, ?, ?)",
                 (tid, int(user["sub"]), f"[SOLUTION] {solution}"))
    conn.commit()
    conn.close()
    return {"message": "Solution added and ticket resolved"}
