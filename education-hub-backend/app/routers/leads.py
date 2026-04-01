from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Optional, List
import csv, io
from app.database import get_db
from app.utils.auth import require_admin, get_current_user, decode_token

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.get("")
async def list_leads(
    status: Optional[str] = None,
    source: Optional[str] = None,
    assigned_to: Optional[int] = None,
    follow_up_filter: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    user: dict = Depends(require_admin)
):
    conn = get_db()
    query = "SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE 1=1"
    params = []
    if status:
        query += " AND l.status = ?"
        params.append(status)
    if source:
        query += " AND l.source = ?"
        params.append(source)
    if assigned_to:
        query += " AND l.assigned_to = ?"
        params.append(assigned_to)
    if follow_up_filter:
        if follow_up_filter == "today":
            query += " AND date(l.follow_up_date) = date('now')"
        elif follow_up_filter == "overdue":
            query += " AND date(l.follow_up_date) < date('now') AND l.status NOT IN ('converted','lost')"
        elif follow_up_filter == "upcoming":
            query += " AND date(l.follow_up_date) > date('now')"
        elif follow_up_filter == "no_followup":
            query += " AND (l.follow_up_date IS NULL OR l.follow_up_date = '')"
    
    if sort_by == "follow_up_date":
        order_dir = "ASC" if sort_order == "asc" else "DESC"
        query += f" ORDER BY l.follow_up_date {order_dir} NULLS LAST"
    elif sort_by == "created_at":
        order_dir = "ASC" if sort_order == "asc" else "DESC"
        query += f" ORDER BY l.created_at {order_dir}"
    else:
        query += " ORDER BY l.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/download-csv")
async def download_leads_csv(
    status: Optional[str] = None,
    source: Optional[str] = None,
    assigned_to: Optional[int] = None,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    jwt_token = None
    if token:
        jwt_token = token
    elif authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ")[1]
    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = decode_token(jwt_token)
    if user.get("role") not in ["super_admin", "admin", "branch_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    conn = get_db()
    query = "SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE 1=1"
    params = []
    if status:
        query += " AND l.status = ?"
        params.append(status)
    if source:
        query += " AND l.source = ?"
        params.append(source)
    if assigned_to:
        query += " AND l.assigned_to = ?"
        params.append(assigned_to)
    query += " ORDER BY l.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Phone", "Source", "Status", "University Interest", "Course Interest", "Assigned To", "Follow-up Date", "Notes", "Created At"])
    for r in rows:
        d = dict(r)
        writer.writerow([d.get("id",""), d.get("name",""), d.get("email",""), d.get("phone",""), d.get("source",""), d.get("status",""), d.get("university_interest",""), d.get("course_interest",""), d.get("assigned_name","Unassigned"), d.get("follow_up_date",""), d.get("notes",""), d.get("created_at","")])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=leads.csv"})

@router.put("/transfer")
async def transfer_leads(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    new_assigned_to = data.get("assigned_to")
    note = data.get("note", "")
    if not ids or not new_assigned_to:
        raise HTTPException(status_code=400, detail="Select leads and target employee")
    conn = get_db()
    performed_by = int(user.get("sub", 0))
    for lid in ids:
        old_lead = conn.execute("SELECT assigned_to, status FROM leads WHERE id=?", (lid,)).fetchone()
        old_assigned = dict(old_lead).get("assigned_to") if old_lead else None
        conn.execute(
            "INSERT INTO lead_history (lead_id, action, from_user_id, to_user_id, old_status, new_status, note, performed_by) VALUES (?,?,?,?,?,?,?,?)",
            (lid, "transfer", old_assigned, new_assigned_to, dict(old_lead).get("status") if old_lead else None, dict(old_lead).get("status") if old_lead else None, note, performed_by)
        )
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"UPDATE leads SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN ({placeholders})", [new_assigned_to] + ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} leads transferred"}

@router.delete("/bulk")
async def bulk_delete_leads(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No leads selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(f"DELETE FROM lead_follow_ups WHERE lead_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM leads WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} leads deleted"}

@router.get("/stats")
async def lead_stats(user: dict = Depends(require_admin)):
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    new = conn.execute("SELECT COUNT(*) FROM leads WHERE status='new'").fetchone()[0]
    contacted = conn.execute("SELECT COUNT(*) FROM leads WHERE status='contacted'").fetchone()[0]
    interested = conn.execute("SELECT COUNT(*) FROM leads WHERE status='interested'").fetchone()[0]
    qualified = conn.execute("SELECT COUNT(*) FROM leads WHERE status='qualified'").fetchone()[0]
    negotiation = conn.execute("SELECT COUNT(*) FROM leads WHERE status='negotiation'").fetchone()[0]
    converted = conn.execute("SELECT COUNT(*) FROM leads WHERE status='converted'").fetchone()[0]
    lost = conn.execute("SELECT COUNT(*) FROM leads WHERE status='lost'").fetchone()[0]
    conn.close()
    return {"total": total, "new": new, "contacted": contacted, "interested": interested, "qualified": qualified, "negotiation": negotiation, "converted": converted, "lost": lost}

@router.get("/counselors")
async def get_counselors(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT id, name, email FROM users WHERE role IN ('admin','super_admin','branch_admin') AND is_active=1").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{lid}")
async def get_lead(lid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    row = conn.execute("SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.id = ?", (lid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    return dict(row)

@router.post("")
async def create_lead(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO leads (name, email, phone, source, status, university_interest, course_interest, notes, assigned_to, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.get("name",""), data.get("email",""), data.get("phone",""), data.get("source","website"),
         data.get("status","new"), data.get("university_interest",""), data.get("course_interest",""),
         data.get("notes",""), data.get("assigned_to"), data.get("follow_up_date"))
    )
    conn.commit()
    lid = cursor.lastrowid
    # Send notification
    try:
        from app.utils.notifications import send_notification
        send_notification(conn, "lead", "New Lead Added",
            f"Name: {data.get('name','')}\nPhone: {data.get('phone','N/A')}\nSource: {data.get('source','website')}\nInterest: {data.get('university_interest','')} - {data.get('course_interest','')}",
            "/admin/leads")
    except Exception as e:
        print(f"Notification error: {e}")
    conn.close()
    return {"id": lid, "message": "Lead created"}

@router.put("/{lid}")
async def update_lead(lid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    performed_by = int(user.get("sub", 0))
    old_lead = conn.execute("SELECT * FROM leads WHERE id=?", (lid,)).fetchone()
    old = dict(old_lead) if old_lead else {}
    new_status = data.get("status", "new")
    new_assigned = data.get("assigned_to")
    # Log status change
    if old.get("status") != new_status:
        conn.execute(
            "INSERT INTO lead_history (lead_id, action, from_user_id, to_user_id, old_status, new_status, note, performed_by) VALUES (?,?,?,?,?,?,?,?)",
            (lid, "status_change", old.get("assigned_to"), new_assigned, old.get("status"), new_status, f"Status changed from {old.get('status')} to {new_status}", performed_by)
        )
    # Log assignment change
    if old.get("assigned_to") != new_assigned and new_assigned:
        conn.execute(
            "INSERT INTO lead_history (lead_id, action, from_user_id, to_user_id, old_status, new_status, note, performed_by) VALUES (?,?,?,?,?,?,?,?)",
            (lid, "transfer", old.get("assigned_to"), new_assigned, old.get("status"), new_status, "Reassigned via edit", performed_by)
        )
    conn.execute(
        "UPDATE leads SET name=?, email=?, phone=?, source=?, status=?, university_interest=?, course_interest=?, notes=?, assigned_to=?, follow_up_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (data.get("name",""), data.get("email",""), data.get("phone",""), data.get("source","website"),
         new_status, data.get("university_interest",""), data.get("course_interest",""),
         data.get("notes",""), new_assigned, data.get("follow_up_date"), lid)
    )
    conn.commit()
    conn.close()
    return {"message": "Lead updated"}

@router.delete("/{lid}")
async def delete_lead(lid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM leads WHERE id = ?", (lid,))
    conn.commit()
    conn.close()
    return {"message": "Lead deleted"}

@router.post("/{lid}/follow-up")
async def add_follow_up(lid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO lead_follow_ups (lead_id, note, follow_up_type, next_follow_up, created_by) VALUES (?, ?, ?, ?, ?)",
        (lid, data.get("note",""), data.get("follow_up_type","call"), data.get("next_follow_up"), int(user.get("sub",0)))
    )
    conn.commit()
    fid = cursor.lastrowid
    conn.close()
    return {"id": fid, "message": "Follow-up added"}

@router.get("/{lid}/follow-ups")
async def get_follow_ups(lid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute(
        "SELECT f.*, u.name as created_by_name FROM lead_follow_ups f LEFT JOIN users u ON f.created_by = u.id WHERE f.lead_id = ? ORDER BY f.created_at DESC", (lid,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{lid}/history")
async def get_lead_history(lid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("""
        SELECT h.*, 
            uf.name as from_user_name, ut.name as to_user_name, up.name as performed_by_name
        FROM lead_history h 
        LEFT JOIN users uf ON h.from_user_id = uf.id
        LEFT JOIN users ut ON h.to_user_id = ut.id
        LEFT JOIN users up ON h.performed_by = up.id
        WHERE h.lead_id = ? ORDER BY h.created_at DESC
    """, (lid,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/bulk-upload")
async def bulk_upload_leads(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    """Bulk upload leads from CSV file. Expected columns: Name, Email, Phone, Source, Status, University Interest, Course Interest, Notes"""
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # Handle BOM
    except UnicodeDecodeError:
        text = content.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    conn = get_db()
    added = 0
    skipped = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        # Normalize column names (case-insensitive, strip whitespace)
        normalized = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        name = normalized.get("name", "") or normalized.get("lead name", "") or normalized.get("student name", "")
        if not name:
            skipped += 1
            continue
        phone = normalized.get("phone", "") or normalized.get("mobile", "") or normalized.get("contact", "") or normalized.get("phone number", "")
        email = normalized.get("email", "") or normalized.get("email id", "")
        source = normalized.get("source", "") or "website"
        status = normalized.get("status", "") or "new"
        # Validate status
        valid_statuses = ["new", "contacted", "interested", "qualified", "negotiation", "converted", "lost"]
        if status.lower() not in valid_statuses:
            status = "new"
        else:
            status = status.lower()
        university = normalized.get("university interest", "") or normalized.get("university", "")
        course = normalized.get("course interest", "") or normalized.get("course", "")
        notes = normalized.get("notes", "") or normalized.get("remarks", "") or normalized.get("comment", "")
        follow_up = normalized.get("follow_up_date", "") or normalized.get("follow-up date", "") or normalized.get("follow up date", "") or normalized.get("followup", "")
        try:
            conn.execute(
                "INSERT INTO leads (name, email, phone, source, status, university_interest, course_interest, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (name, email, phone, source, status, university, course, notes, follow_up if follow_up else None)
            )
            added += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1
    conn.commit()
    conn.close()
    return {"message": f"{added} leads added, {skipped} skipped", "added": added, "skipped": skipped, "errors": errors[:10]}

@router.post("/bulk-add")
async def bulk_add_leads(data: dict, user: dict = Depends(require_admin)):
    """Bulk add leads from JSON data (manual paste/form)."""
    leads_data = data.get("leads", [])
    if not leads_data:
        raise HTTPException(status_code=400, detail="No leads provided")
    conn = get_db()
    added = 0
    for lead in leads_data:
        name = lead.get("name", "").strip()
        if not name:
            continue
        conn.execute(
            "INSERT INTO leads (name, email, phone, source, status, university_interest, course_interest, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (name, lead.get("email", ""), lead.get("phone", ""), lead.get("source", "website"),
             lead.get("status", "new"), lead.get("university_interest", ""), lead.get("course_interest", ""),
             lead.get("notes", ""), lead.get("follow_up_date") or None)
        )
        added += 1
    conn.commit()
    conn.close()
    return {"message": f"{added} leads added", "added": added}

@router.post("/auto-assign")
async def auto_assign_leads(user: dict = Depends(require_admin)):
    conn = get_db()
    unassigned = conn.execute("SELECT id FROM leads WHERE assigned_to IS NULL AND status='new'").fetchall()
    counselors = conn.execute("SELECT id FROM users WHERE role IN ('admin','super_admin','branch_admin') AND is_active=1").fetchall()
    if not counselors:
        conn.close()
        return {"message": "No counselors available"}
    counselor_ids = [c["id"] for c in counselors]
    assigned = 0
    for i, lead in enumerate(unassigned):
        cid = counselor_ids[i % len(counselor_ids)]
        conn.execute("UPDATE leads SET assigned_to = ?, status = 'contacted' WHERE id = ?", (cid, lead["id"]))
        assigned += 1
    conn.commit()
    conn.close()
    return {"message": f"{assigned} leads auto-assigned"}
