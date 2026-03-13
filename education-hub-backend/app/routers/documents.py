from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os
import uuid
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

from app.utils.uploads import get_upload_dir
from app.utils.image_optimize import optimize_image

router = APIRouter(prefix="/api/documents", tags=["Documents"])

DOC_TYPES = [
    "Marksheet", "Original Degree", "Transcript", "Bonafide Letter",
    "Duplicate Degree", "Duplicate Marksheet"
]

class DocumentCreate(BaseModel):
    student_id: int
    doc_type: str
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    doc_name: Optional[str] = None
    status: str = "pending"
    received_date: Optional[str] = None
    dispatched_date: Optional[str] = None
    branch_id: Optional[int] = None
    fee_access: str = "without_fees"
    fee_percent_required: float = 0

@router.get("/types")
async def get_doc_types():
    return DOC_TYPES

@router.get("")
async def list_documents(
    doc_type: Optional[str] = None,
    student_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    status: Optional[str] = None,
    phone: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    conn = get_db()
    query = """SELECT d.*, st.name as student_name, st.enrollment_no, st.phone as student_phone, b.name as branch_name
               FROM documents d JOIN students st ON d.student_id = st.id
               LEFT JOIN branches b ON d.branch_id = b.id WHERE 1=1"""
    params = []
    if doc_type:
        query += " AND d.doc_type = ?"
        params.append(doc_type)
    if student_id:
        query += " AND d.student_id = ?"
        params.append(student_id)
    if phone:
        query += " AND st.phone LIKE ?"
        params.append(f"%{phone}%")
    if branch_id:
        query += " AND d.branch_id = ?"
        params.append(branch_id)
    if status:
        query += " AND d.status = ?"
        params.append(status)
    is_student = user.get("role") == "student"
    student_id_val = None
    if is_student:
        query += " AND d.student_id IN (SELECT id FROM students WHERE user_id = ?)"
        params.append(int(user["sub"]))
        st = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
        student_id_val = st["id"] if st else None
    query += " ORDER BY d.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    docs = [dict(r) for r in rows]
    # For students, check fee access and mask file if fees not paid
    if is_student and student_id_val:
        from app.routers.accounts import _get_fee_summary
        summary = _get_fee_summary(conn, student_id_val)
        total_fees = summary["total_fees"] or 0
        total_paid = summary["total_paid"] or 0
        paid_pct = (total_paid / total_fees * 100) if total_fees > 0 else 0
        for doc in docs:
            if doc.get("fee_access") == "after_fees":
                req_pct = doc.get("fee_percent_required", 0) or 0
                if paid_pct < req_pct:
                    doc["_locked"] = True
                    doc["_required_percent"] = req_pct
                    doc["_paid_percent"] = round(paid_pct, 1)
                    doc["file_path"] = ""  # hide file from student
    conn.close()
    return docs

@router.delete("/bulk")
async def bulk_delete_documents(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No documents selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM documents WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} documents deleted"}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Student or admin can upload a document file."""
    upload_dir = get_upload_dir()
    os.makedirs(upload_dir + "/docs", exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    filename = f"{uuid.uuid4().hex}.{ext}"
    content = await file.read()
    content, filename = optimize_image(content, filename)
    filepath = os.path.join(upload_dir, "docs", filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"filename": filename, "url": f"/uploads/docs/{filename}"}

@router.post("")
async def create_document(data: DocumentCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    # If student uploads, status is pending_review; admin uploads are approved
    doc_status = data.status
    if user.get("role") == "student":
        doc_status = "pending_review"
        # Get student id from user
        student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
        if student:
            data.student_id = student["id"]
    elif user.get("role") in ("super_admin", "admin"):
        doc_status = data.status or "approved"
    
    file_path = data.file_path or data.file_url or ""
    fee_access = data.fee_access if data.fee_access in ("without_fees", "after_fees") else "without_fees"
    fee_pct = data.fee_percent_required if fee_access == "after_fees" else 0
    cursor = conn.execute(
        "INSERT INTO documents (student_id, doc_type, file_path, status, received_date, dispatched_date, branch_id, fee_access, fee_percent_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.student_id, data.doc_type, file_path, doc_status, data.received_date, data.dispatched_date, data.branch_id, fee_access, fee_pct)
    )
    conn.commit()
    did = cursor.lastrowid
    # Send notification
    try:
        from app.utils.notifications import send_notification
        student = conn.execute("SELECT name FROM students WHERE id=?", (data.student_id,)).fetchone()
        sname = student["name"] if student else "Unknown"
        send_notification(conn, "document", "New Document Uploaded",
            f"Document: {data.doc_type}\nStudent: {sname}\nAccess: {fee_access}" + (f" ({fee_pct}% fees required)" if fee_access == "after_fees" else ""),
            "/admin/documents")
    except Exception as e:
        print(f"Notification error: {e}")
    conn.close()
    return {"id": did, "message": "Document record created"}

@router.put("/{did}")
async def update_document(did: int, data: DocumentCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    fee_access = data.fee_access if data.fee_access in ("without_fees", "after_fees") else "without_fees"
    fee_pct = data.fee_percent_required if fee_access == "after_fees" else 0
    conn.execute(
        "UPDATE documents SET doc_type=?, file_path=?, status=?, received_date=?, dispatched_date=?, branch_id=?, fee_access=?, fee_percent_required=? WHERE id=?",
        (data.doc_type, data.file_path, data.status, data.received_date, data.dispatched_date, data.branch_id, fee_access, fee_pct, did)
    )
    conn.commit()
    conn.close()
    return {"message": "Document updated"}

@router.put("/{did}/dispatch")
async def dispatch_document(did: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    note = data.get("note", "")
    date = data.get("date", "")
    conn.execute("UPDATE documents SET status='dispatched', dispatched_date=?, notes=? WHERE id=?", (date, note, did))
    conn.commit()
    conn.close()
    return {"message": "Document marked as dispatched"}

@router.put("/{did}/receive")
async def receive_document(did: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE documents SET status='received', received_date=? WHERE id=?", (data.get("date", ""), did))
    conn.commit()
    conn.close()
    return {"message": "Document marked as received"}

@router.put("/{did}/status")
async def change_document_status(did: int, data: dict, user: dict = Depends(require_admin)):
    new_status = data.get("status", "")
    date = data.get("date", "")
    note = data.get("note", "")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    conn = get_db()
    conn.execute("UPDATE documents SET status=?, notes=?, status_date=? WHERE id=?", (new_status, note, date, did))
    if new_status == "dispatched" and date:
        conn.execute("UPDATE documents SET dispatched_date=? WHERE id=?", (date, did))
    if new_status in ("received", "office_received") and date:
        conn.execute("UPDATE documents SET received_date=? WHERE id=?", (date, did))
    conn.commit()
    conn.close()
    return {"message": f"Document status changed to {new_status}"}

@router.put("/{did}/approve")
async def approve_document(did: int, data: dict = None, user: dict = Depends(require_admin)):
    conn = get_db()
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    conn.execute("UPDATE documents SET status='approved', status_date=? WHERE id=?", (today, did))
    conn.commit()
    conn.close()
    return {"message": "Document approved"}

@router.put("/{did}/reject")
async def reject_document(did: int, data: dict = None, user: dict = Depends(require_admin)):
    conn = get_db()
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    conn.execute("UPDATE documents SET status='rejected', status_date=? WHERE id=?", (today, did))
    conn.commit()
    conn.close()
    return {"message": "Document rejected"}
