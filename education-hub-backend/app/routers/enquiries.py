from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/enquiries", tags=["Enquiries"])

class EnquiryCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    university_id: Optional[int] = None
    category_id: Optional[int] = None
    message: Optional[str] = None
    source: str = "website"

@router.get("")
async def list_enquiries(
    status: Optional[str] = None,
    university_id: Optional[int] = None,
    source: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(require_admin)
):
    conn = get_db()
    query = """SELECT e.*, u.name as university_name, c.name as category_name, c.name as course_name, usr.name as assigned_name
               FROM enquiries e 
               LEFT JOIN universities u ON e.university_id = u.id 
               LEFT JOIN categories c ON e.category_id = c.id
               LEFT JOIN users usr ON e.assigned_to = usr.id WHERE 1=1"""
    params = []
    if status:
        query += " AND e.status = ?"
        params.append(status)
    if university_id:
        query += " AND e.university_id = ?"
        params.append(university_id)
    if source:
        query += " AND e.source = ?"
        params.append(source)
    total = conn.execute(query.replace("SELECT e.*, u.name as university_name, c.name as category_name, usr.name as assigned_name", "SELECT COUNT(*)"), params).fetchone()[0]
    query += " ORDER BY e.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"enquiries": [dict(r) for r in rows], "total": total}

@router.post("")
async def create_enquiry(data: EnquiryCreate):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO enquiries (name, email, phone, state, city, university_id, category_id, message, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.name, data.email, data.phone, data.state, data.city, data.university_id, data.category_id, data.message, data.source)
    )
    conn.commit()
    eid = cursor.lastrowid
    # Send notification
    try:
        from app.utils.notifications import send_notification
        send_notification(conn, "enquiry", "New Enquiry Received",
            f"Name: {data.name}\nPhone: {data.phone or 'N/A'}\nEmail: {data.email or 'N/A'}\nMessage: {data.message or 'N/A'}",
            "/admin/enquiries")
    except Exception as e:
        print(f"Notification error: {e}")
    conn.close()
    return {"id": eid, "message": "Enquiry submitted successfully"}

@router.put("/{eid}/status")
async def update_enquiry_status(eid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE enquiries SET status = ? WHERE id = ?", (data.get("status"), eid))
    conn.commit()
    conn.close()
    return {"message": "Enquiry status updated"}

@router.put("/{eid}/assign")
async def assign_enquiry(eid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE enquiries SET assigned_to = ? WHERE id = ?", (data.get("assigned_to"), eid))
    conn.commit()
    conn.close()
    return {"message": "Enquiry assigned"}

@router.delete("/{eid}")
async def delete_enquiry(eid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM enquiries WHERE id = ?", (eid,))
    conn.commit()
    conn.close()
    return {"message": "Enquiry deleted"}

@router.post("/bulk-delete")
async def bulk_delete_enquiries(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    conn = get_db()
    placeholders = ",".join(["?" for _ in ids])
    conn.execute(f"DELETE FROM enquiries WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"Deleted {len(ids)} enquiries"}
