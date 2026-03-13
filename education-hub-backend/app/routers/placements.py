from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user
import os, uuid, base64

router = APIRouter(prefix="/api/placements", tags=["Placements"])

from app.utils.uploads import get_upload_dir

# ── Job Listings ──
@router.get("/jobs")
async def list_jobs(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    role = user.get("role", "")

    if role == "student":
        student = conn.execute("SELECT id FROM students WHERE user_id = ?", (uid,)).fetchone()
        sid = student["id"] if student else -1
        rows = conn.execute(
            """SELECT j.*,
                      CASE WHEN EXISTS(
                          SELECT 1 FROM placement_applications a
                          WHERE a.job_id = j.id AND a.student_id = ?
                      ) THEN 1 ELSE 0 END as has_applied
               FROM placement_jobs j
               WHERE j.status = 'active'
               ORDER BY j.created_at DESC""",
            (sid,)
        ).fetchall()
    else:
        query = "SELECT * FROM placement_jobs WHERE 1=1"
        params = []
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()

    conn.close()
    return [dict(r) for r in rows]

@router.get("/jobs/{jid}")
async def get_job(jid: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    job = conn.execute("SELECT * FROM placement_jobs WHERE id = ?", (jid,)).fetchone()
    if not job:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")
    # Get application count
    count = conn.execute("SELECT COUNT(*) as c FROM placement_applications WHERE job_id = ?", (jid,)).fetchone()
    conn.close()
    result = dict(job)
    result["application_count"] = count["c"] if count else 0
    return result

@router.post("/jobs")
async def create_job(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO placement_jobs (company_name, company_logo, title, description, location, job_type,
           salary_range, eligibility, last_date, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.get("company_name", ""), data.get("company_logo", ""), data.get("title", ""),
         data.get("description", ""), data.get("location", ""), data.get("job_type", "Full-time"),
         data.get("salary_range", ""), data.get("eligibility", ""), data.get("last_date", ""),
         data.get("status", "active"), int(user["sub"]))
    )
    conn.commit()
    jid = cursor.lastrowid
    conn.close()
    return {"id": jid, "message": "Job created"}

@router.put("/jobs/{jid}")
async def update_job(jid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        """UPDATE placement_jobs SET company_name=?, company_logo=?, title=?, description=?, location=?,
           job_type=?, salary_range=?, eligibility=?, last_date=?, status=?, updated_at=CURRENT_TIMESTAMP
           WHERE id=?""",
        (data.get("company_name", ""), data.get("company_logo", ""), data.get("title", ""),
         data.get("description", ""), data.get("location", ""), data.get("job_type", "Full-time"),
         data.get("salary_range", ""), data.get("eligibility", ""), data.get("last_date", ""),
         data.get("status", "active"), jid)
    )
    conn.commit()
    conn.close()
    return {"message": "Job updated"}

@router.delete("/jobs/{jid}")
async def delete_job(jid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM placement_applications WHERE job_id = ?", (jid,))
    conn.execute("DELETE FROM placement_jobs WHERE id = ?", (jid,))
    conn.commit()
    conn.close()
    return {"message": "Job deleted"}

# ── Applications ──
@router.get("/applications")
async def list_applications(job_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    conn = get_db()
    role = user.get("role", "")
    uid = int(user["sub"])
    
    if role == "student":
        query = """SELECT a.*, j.title as job_title, j.company_name
                   FROM placement_applications a
                   JOIN placement_jobs j ON a.job_id = j.id
                   WHERE a.student_id IN (SELECT id FROM students WHERE user_id = ?)
                   ORDER BY a.created_at DESC"""
        rows = conn.execute(query, (uid,)).fetchall()
    else:
        query = """SELECT a.*, j.title as job_title, j.company_name, s.name as student_name, s.enrollment_no, s.email as student_email
                   FROM placement_applications a
                   JOIN placement_jobs j ON a.job_id = j.id
                   LEFT JOIN students s ON a.student_id = s.id
                   WHERE 1=1"""
        params = []
        if job_id:
            query += " AND a.job_id = ?"
            params.append(job_id)
        query += " ORDER BY a.created_at DESC"
        rows = conn.execute(query, params).fetchall()
    
    conn.close()
    return [dict(r) for r in rows]

@router.get("/jobs/{jid}/applications")
async def get_job_applications(jid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute(
        """SELECT a.id, a.resume_url, a.cover_letter, a.status, a.created_at,
                  s.name as student_name, s.enrollment_no
           FROM placement_applications a
           LEFT JOIN students s ON a.student_id = s.id
           WHERE a.job_id = ?
           ORDER BY a.created_at DESC""",
        (jid,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/jobs/{jid}/apply")
async def apply_job_by_id(jid: int, data: dict, user: dict = Depends(get_current_user)):
    data["job_id"] = jid
    return await apply_job(data, user)

@router.post("/applications")
async def apply_job(data: dict, user: dict = Depends(get_current_user)):
    conn = get_db()
    uid = int(user["sub"])
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (uid,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=400, detail="Student profile not found")
    
    job_id = data.get("job_id")
    if not job_id:
        conn.close()
        raise HTTPException(status_code=400, detail="job_id required")
    
    # Check if already applied
    existing = conn.execute("SELECT id FROM placement_applications WHERE job_id = ? AND student_id = ?",
                           (job_id, student["id"])).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Already applied for this job")
    
    cursor = conn.execute(
        """INSERT INTO placement_applications (job_id, student_id, resume_url, cover_letter, status)
           VALUES (?, ?, ?, ?, 'applied')""",
        (job_id, student["id"], data.get("resume_url", ""), data.get("cover_letter", ""))
    )
    conn.commit()
    aid = cursor.lastrowid
    conn.close()
    return {"id": aid, "message": "Application submitted"}

@router.put("/applications/{aid}/status")
async def update_application_status(aid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE placement_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (data.get("status", "applied"), aid))
    conn.commit()
    conn.close()
    return {"message": "Application status updated"}

@router.put("/applications/{aid}")
async def update_application(aid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE placement_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (data.get("status", "applied"), aid))
    conn.commit()
    conn.close()
    return {"message": "Application updated"}

# ── Company Visits ──
@router.get("/visits")
async def list_visits(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM company_visits ORDER BY visit_date DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/visits")
async def create_visit(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO company_visits (company_name, visit_date, visit_time, venue, description, contact_person, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (data.get("company_name", ""), data.get("visit_date", ""), data.get("visit_time", ""),
         data.get("venue", ""), data.get("description", ""), data.get("contact_person", ""),
         data.get("status", "upcoming"))
    )
    conn.commit()
    vid = cursor.lastrowid
    conn.close()
    return {"id": vid, "message": "Visit created"}

@router.put("/visits/{vid}")
async def update_visit(vid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        """UPDATE company_visits SET company_name=?, visit_date=?, visit_time=?, venue=?,
           description=?, contact_person=?, status=? WHERE id=?""",
        (data.get("company_name", ""), data.get("visit_date", ""), data.get("visit_time", ""),
         data.get("venue", ""), data.get("description", ""), data.get("contact_person", ""),
         data.get("status", "upcoming"), vid)
    )
    conn.commit()
    conn.close()
    return {"message": "Visit updated"}

@router.delete("/visits/{vid}")
async def delete_visit(vid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM company_visits WHERE id = ?", (vid,))
    conn.commit()
    conn.close()
    return {"message": "Visit deleted"}

# ── Resume Upload ──
@router.post("/upload-resume")
async def upload_resume(data: dict, user: dict = Depends(get_current_user)):
    upload_dir = get_upload_dir()
    file_data = data.get("data", "") or data.get("file", "")
    if "base64," in file_data:
        file_data = file_data.split("base64,")[1]
    orig_filename = data.get("filename", "resume.pdf")
    ext = orig_filename.rsplit(".", 1)[-1] if "." in orig_filename else data.get("ext", "pdf")
    filename = f"resume_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(file_data))
    return {"url": f"/uploads/{filename}"}

# ── Stats ──
@router.get("/stats")
async def placement_stats(user: dict = Depends(require_admin)):
    conn = get_db()
    jobs = conn.execute("SELECT COUNT(*) as c FROM placement_jobs WHERE status = 'active'").fetchone()
    apps = conn.execute("SELECT COUNT(*) as c FROM placement_applications").fetchone()
    selected = conn.execute("SELECT COUNT(*) as c FROM placement_applications WHERE status = 'selected'").fetchone()
    visits = conn.execute("SELECT COUNT(*) as c FROM company_visits WHERE status = 'upcoming'").fetchone()
    conn.close()
    return {
        "active_jobs": jobs["c"] if jobs else 0,
        "total_applications": apps["c"] if apps else 0,
        "selected_students": selected["c"] if selected else 0,
        "upcoming_visits": visits["c"] if visits else 0
    }
