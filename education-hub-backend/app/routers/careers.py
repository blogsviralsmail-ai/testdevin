from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
import json, os, uuid
from app.database import get_db
from app.utils.auth import require_admin

from app.utils.uploads import get_upload_dir

router = APIRouter(prefix="/api/careers", tags=["Careers"])

@router.get("")
async def list_jobs(status: Optional[str] = None):
    conn = get_db()
    query = "SELECT * FROM careers WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/applications/all")
async def get_all_applications(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute(
        "SELECT ca.*, c.title as job_title FROM career_applications ca LEFT JOIN careers c ON ca.career_id = c.id ORDER BY ca.created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.delete("/applications/bulk")
async def bulk_delete_applications(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No applications selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM career_applications WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} applications deleted"}

@router.delete("/bulk")
async def bulk_delete_jobs(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No jobs selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM career_applications WHERE career_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM career_form_fields WHERE career_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM careers WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} jobs deleted"}

@router.get("/{jid}")
async def get_job(jid: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM careers WHERE id = ?", (jid,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")
    job = dict(row)
    # Get form fields for this job
    fields = conn.execute("SELECT * FROM career_form_fields WHERE career_id = ? ORDER BY field_order", (jid,)).fetchall()
    job["form_fields"] = [dict(f) for f in fields]
    conn.close()
    return job

@router.post("")
async def create_job(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO careers (title, department, location, type, experience, salary_range, description, requirements, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.get("title",""), data.get("department",""), data.get("location",""), data.get("type","Full-time"),
         data.get("experience",""), data.get("salary_range",""), data.get("description",""), data.get("requirements",""), data.get("status","active"))
    )
    jid = cursor.lastrowid
    # Save custom form fields
    form_fields = data.get("form_fields", [])
    for i, field in enumerate(form_fields):
        conn.execute(
            "INSERT INTO career_form_fields (career_id, field_name, field_label, field_type, is_required, field_order, options, placeholder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (jid, field.get("field_name",""), field.get("field_label",""), field.get("field_type","text"),
             field.get("is_required",0), i, field.get("options",""), field.get("placeholder",""))
        )
    conn.commit()
    conn.close()
    return {"id": jid, "message": "Job posted"}

@router.put("/{jid}")
async def update_job(jid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE careers SET title=?, department=?, location=?, type=?, experience=?, salary_range=?, description=?, requirements=?, status=? WHERE id=?",
        (data.get("title",""), data.get("department",""), data.get("location",""), data.get("type","Full-time"),
         data.get("experience",""), data.get("salary_range",""), data.get("description",""), data.get("requirements",""), data.get("status","active"), jid)
    )
    # Update form fields
    conn.execute("DELETE FROM career_form_fields WHERE career_id = ?", (jid,))
    form_fields = data.get("form_fields", [])
    for i, field in enumerate(form_fields):
        conn.execute(
            "INSERT INTO career_form_fields (career_id, field_name, field_label, field_type, is_required, field_order, options, placeholder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (jid, field.get("field_name",""), field.get("field_label",""), field.get("field_type","text"),
             field.get("is_required",0), i, field.get("options",""), field.get("placeholder",""))
        )
    conn.commit()
    conn.close()
    return {"message": "Job updated"}

@router.delete("/{jid}")
async def delete_job(jid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM career_form_fields WHERE career_id = ?", (jid,))
    conn.execute("DELETE FROM career_applications WHERE career_id = ?", (jid,))
    conn.execute("DELETE FROM careers WHERE id = ?", (jid,))
    conn.commit()
    conn.close()
    return {"message": "Job deleted"}

@router.get("/{jid}/applications")
async def get_applications(jid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM career_applications WHERE career_id = ? ORDER BY created_at DESC", (jid,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Public endpoint - no auth required - for job applicants to upload resume."""
    upload_dir = get_upload_dir()
    os.makedirs(os.path.join(upload_dir, "resumes"), exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".pdf"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, "resumes", filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/resumes/{filename}", "filename": file.filename}

@router.post("/{jid}/apply")
async def apply_job(jid: int, data: dict):
    conn = get_db()
    form_data = json.dumps(data.get("form_data", {})) if data.get("form_data") else None
    cursor = conn.execute(
        "INSERT INTO career_applications (career_id, name, email, phone, resume_url, cover_letter, form_data) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (jid, data.get("name",""), data.get("email",""), data.get("phone",""), data.get("resume_url",""), data.get("cover_letter",""), form_data)
    )
    # Get job title for notification
    job = conn.execute("SELECT title FROM careers WHERE id=?", (jid,)).fetchone()
    job_title = job["title"] if job else f"Job #{jid}"
    conn.commit()
    # Send notification
    try:
        from app.utils.notifications import send_notification
        send_notification(conn, "career", "New Job Application",
            f"Applicant: {data.get('name','')}\nEmail: {data.get('email','N/A')}\nPhone: {data.get('phone','N/A')}\nPosition: {job_title}",
            "/admin/careers")
    except Exception as e:
        print(f"[Notification Error] Career: {e}")
    conn.close()
    return {"message": "Application submitted"}
