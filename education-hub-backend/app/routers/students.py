from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import csv
import io
import os
import base64
import uuid
from app.database import get_db
from app.utils.auth import require_admin, get_current_user
from app.utils.image_optimize import optimize_thumbnail

router = APIRouter(prefix="/api/students", tags=["Students"])

from app.utils.uploads import get_upload_dir

class StudentCreate(BaseModel):
    university_id: Optional[int] = None
    category_id: Optional[int] = None
    branch_id: Optional[int] = None
    session_name: Optional[str] = None
    admission_type: str = "FRESH_ADMISSION"
    name: str
    email: str
    phone: Optional[str] = None
    photo: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    category_type: Optional[str] = None
    nationality: Optional[str] = "Indian"
    aadhar_no: Optional[str] = None
    marital_status: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    father_occupation: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    current_address: Optional[str] = None
    current_city: Optional[str] = None
    current_state: Optional[str] = None
    current_pincode: Optional[str] = None
    permanent_address: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_pincode: Optional[str] = None
    tenth_board: Optional[str] = None
    tenth_year: Optional[str] = None
    tenth_percentage: Optional[str] = None
    tenth_school: Optional[str] = None
    twelfth_board: Optional[str] = None
    twelfth_year: Optional[str] = None
    twelfth_percentage: Optional[str] = None
    twelfth_school: Optional[str] = None
    graduation_university: Optional[str] = None
    graduation_year: Optional[str] = None
    graduation_percentage: Optional[str] = None
    graduation_degree: Optional[str] = None
    post_graduation_university: Optional[str] = None
    post_graduation_year: Optional[str] = None
    post_graduation_percentage: Optional[str] = None
    post_graduation_degree: Optional[str] = None
    blood_group: Optional[str] = None
    disability: Optional[str] = "No"
    disability_type: Optional[str] = None
    hostel_required: Optional[str] = "No"
    transport_required: Optional[str] = "No"
    pickup_location: Optional[str] = None
    extra_curricular: Optional[str] = None
    achievements: Optional[str] = None
    status: str = "active"
    form_data: Optional[str] = None

ALL_FIELDS = [
    "university_id", "category_id", "branch_id", "session_name", "admission_type",
    "name", "email", "phone", "photo", "date_of_birth", "gender", "category_type",
    "nationality", "aadhar_no", "marital_status", "father_name", "mother_name",
    "guardian_name", "father_occupation", "parent_phone", "parent_email",
    "current_address", "current_city", "current_state", "current_pincode",
    "permanent_address", "permanent_city", "permanent_state", "permanent_pincode",
    "tenth_board", "tenth_year", "tenth_percentage", "tenth_school",
    "twelfth_board", "twelfth_year", "twelfth_percentage", "twelfth_school",
    "graduation_university", "graduation_year", "graduation_percentage", "graduation_degree",
    "post_graduation_university", "post_graduation_year", "post_graduation_percentage", "post_graduation_degree",
    "blood_group", "disability", "disability_type",
    "hostel_required", "transport_required", "pickup_location",
    "extra_curricular", "achievements", "status", "form_data",
]

@router.get("/me")
async def get_my_student_profile(user: dict = Depends(get_current_user)):
    """Get the current logged-in student's profile with university/course names."""
    conn = get_db()
    uid = int(user.get("sub", 0))
    row = conn.execute(
        """SELECT s.*, u.name as university_name, c.name as category_name, b.name as branch_name 
           FROM students s 
           LEFT JOIN universities u ON s.university_id = u.id 
           LEFT JOIN categories c ON s.category_id = c.id 
           LEFT JOIN branches b ON s.branch_id = b.id 
           WHERE s.user_id = ?""", (uid,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Student profile not found")
    result = dict(row)
    if result.get("form_data"):
        try:
            import json as _json
            result["form_data"] = _json.loads(result["form_data"])
        except:
            pass
    return result

@router.get("")
async def list_students(
    university_id: Optional[int] = None,
    category_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    admission_type: Optional[str] = None,
    center_id: Optional[int] = None,
    admission_source: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    conn = get_db()
    query = """SELECT s.*, u.name as university_name, c.name as category_name, b.name as branch_name,
               ct.name as center_name 
               FROM students s 
               LEFT JOIN universities u ON s.university_id = u.id 
               LEFT JOIN categories c ON s.category_id = c.id 
               LEFT JOIN branches b ON s.branch_id = b.id 
               LEFT JOIN centers ct ON s.center_id = ct.id
               WHERE 1=1"""
    params = []
    if university_id:
        query += " AND s.university_id = ?"
        params.append(university_id)
    if category_id:
        query += " AND s.category_id = ?"
        params.append(category_id)
    if branch_id:
        query += " AND s.branch_id = ?"
        params.append(branch_id)
    if status:
        query += " AND s.status = ?"
        params.append(status)
    if admission_type:
        query += " AND s.admission_type = ?"
        params.append(admission_type)
    if center_id:
        query += " AND s.center_id = ?"
        params.append(center_id)
    if admission_source:
        query += " AND s.admission_source = ?"
        params.append(admission_source)
    if search:
        query += " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.enrollment_no LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])
    
    # Count
    count_query = f"SELECT COUNT(*) FROM ({query})"
    total = conn.execute(count_query, params).fetchone()[0]
    
    query += " ORDER BY s.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    rows = conn.execute(query, params).fetchall()
    # Add deposit (paid) amount for each student
    students_list = []
    for r in rows:
        d = dict(r)
        # Sum approved fee_payments (exclude soft-deleted)
        fp_paid = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = ? AND status = 'approved' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)", (d["id"],)).fetchone()[0]
        # Sum admin-added credit transactions (exclude online fee payment mirrors and soft-deleted)
        admin_paid = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE student_id = ? AND transaction_type = 'credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)", (d["id"],)).fetchone()[0]
        d["deposit"] = fp_paid + admin_paid
        students_list.append(d)
    conn.close()
    return {"students": students_list, "total": total, "page": page, "limit": limit}

@router.get("/csv")
async def download_csv(
    university_id: Optional[int] = None,
    category_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    # Accept token from query param (for window.open) or header
    jwt_token = None
    if token:
        jwt_token = token
    elif authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ")[1]
    if not jwt_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    from app.utils.auth import decode_token
    user = decode_token(jwt_token)
    if user.get("role") not in ["super_admin", "admin", "branch_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    conn = get_db()
    query = """SELECT s.*, u.name as university_name, c.name as category_name, b.name as branch_name 
               FROM students s 
               LEFT JOIN universities u ON s.university_id = u.id 
               LEFT JOIN categories c ON s.category_id = c.id 
               LEFT JOIN branches b ON s.branch_id = b.id WHERE 1=1"""
    params = []
    if university_id:
        query += " AND s.university_id = ?"
        params.append(university_id)
    if category_id:
        query += " AND s.category_id = ?"
        params.append(category_id)
    if branch_id:
        query += " AND s.branch_id = ?"
        params.append(branch_id)
    if status:
        query += " AND s.status = ?"
        params.append(status)
    if date_from:
        query += " AND s.created_at >= ?"
        params.append(date_from)
    if date_to:
        query += " AND s.created_at <= ?"
        params.append(date_to + " 23:59:59")
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Enrollment No", "Name", "Email", "Phone", "DOB", "Gender", "Category",
        "Father Name", "Mother Name", "Aadhar No", "University", "Course", "Branch",
        "Session", "Admission Type", "Current Address", "Current City", "Current State",
        "10th Board", "10th %", "12th Board", "12th %", "Blood Group", "Status", "Created At"
    ])
    for r in rows:
        d = dict(r)
        writer.writerow([
            d.get("id"), d.get("enrollment_no"), d.get("name"), d.get("email"), d.get("phone"),
            d.get("date_of_birth"), d.get("gender"), d.get("category_type"),
            d.get("father_name"), d.get("mother_name"), d.get("aadhar_no"),
            d.get("university_name"), d.get("category_name"), d.get("branch_name"),
            d.get("session_name"), d.get("admission_type"),
            d.get("current_address"), d.get("current_city"), d.get("current_state"),
            d.get("tenth_board"), d.get("tenth_percentage"),
            d.get("twelfth_board"), d.get("twelfth_percentage"),
            d.get("blood_group"), d.get("status"), d.get("created_at")
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students.csv"}
    )

@router.get("/{sid}")
async def get_student(sid: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("""SELECT s.*, u.name as university_name, c.name as category_name, b.name as branch_name 
                          FROM students s 
                          LEFT JOIN universities u ON s.university_id = u.id 
                          LEFT JOIN categories c ON s.category_id = c.id 
                          LEFT JOIN branches b ON s.branch_id = b.id 
                          WHERE s.id = ?""", (sid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    result = dict(row)
    if result.get("form_data"):
        try:
            result["form_data"] = json.loads(result["form_data"])
        except:
            pass
    return result

@router.post("")
async def create_student(data: StudentCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    # Block duplicate mobile number - one phone = one student
    if data.phone:
        existing_phone = conn.execute("SELECT id FROM students WHERE phone = ?", (data.phone,)).fetchone()
        if existing_phone:
            conn.close()
            raise HTTPException(status_code=400, detail="Is mobile number se ek student pehle se registered hai. Ek number se sirf ek student register ho sakta hai.")
    # Generate enrollment number using MAX to avoid race conditions
    import sqlite3
    # If admin creates student, status is active; if student self-registers, pending
    if user.get("role") in ("super_admin", "admin"):
        data.status = "active"
    else:
        data.status = "pending"
    
    for _attempt in range(5):
        max_row = conn.execute("SELECT MAX(CAST(SUBSTR(enrollment_no, 4) AS INTEGER)) FROM students").fetchone()
        next_num = (max_row[0] or 1000) + 1
        enrollment_no = f"EDU{str(next_num).zfill(6)}"
        fields = ["enrollment_no"] + ALL_FIELDS
        values = [enrollment_no] + [getattr(data, f) for f in ALL_FIELDS]
        placeholders = ", ".join(["?"] * len(fields))
        field_names = ", ".join(fields)
        try:
            cursor = conn.execute(f"INSERT INTO students ({field_names}) VALUES ({placeholders})", values)
            sid = cursor.lastrowid
            conn.commit()
            break
        except sqlite3.IntegrityError:
            continue
    else:
        conn.close()
        raise HTTPException(status_code=500, detail="Could not generate unique enrollment number")
    
    # If registered by student user, link user_id
    if user.get("role") == "student":
        conn.execute("UPDATE students SET user_id = ? WHERE id = ?", (int(user["sub"]), sid))
        conn.commit()
    
    # Send notification
    try:
        from app.utils.notifications import send_notification
        send_notification(conn, "student", "New Student Registered",
            f"Name: {data.name}\nEnrollment: {enrollment_no}\nEmail: {data.email}\nPhone: {data.phone or 'N/A'}",
            "/admin/students")
    except Exception as e:
        print(f"Notification error: {e}")
    conn.close()
    return {"id": sid, "enrollment_no": enrollment_no, "message": "Student created successfully"}

@router.put("/{sid}")
async def update_student(sid: int, data: dict, user: dict = Depends(get_current_user)):
    conn = get_db()
    update_fields = []
    values = []
    # Foreign key fields - convert empty strings to None
    fk_fields = {"university_id", "category_id", "branch_id"}
    for f in ALL_FIELDS:
        if f in data:
            val = data[f]
            # Convert empty strings to None for foreign key and integer fields
            if f in fk_fields and (val == "" or val is None):
                val = None
            update_fields.append(f"{f}=?")
            values.append(val)
    # Handle total_fees separately (not in ALL_FIELDS)
    if "total_fees" in data and data["total_fees"] is not None:
        update_fields.append("total_fees=?")
        values.append(float(data["total_fees"]) if data["total_fees"] else 0)
    if update_fields:
        values.append(sid)
        set_clause = ", ".join(update_fields)
        conn.execute(f"UPDATE students SET {set_clause}, updated_at=CURRENT_TIMESTAMP WHERE id=?", values)
        conn.commit()
    conn.close()
    return {"message": "Student updated"}

@router.delete("/{sid}")
async def delete_student(sid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    # Get user_id before deleting student
    student = conn.execute("SELECT user_id FROM students WHERE id = ?", (sid,)).fetchone()
    # Delete all related records first (foreign key constraints - order matters!)
    # ticket_messages references tickets, receipts references transactions
    conn.execute("DELETE FROM ticket_messages WHERE ticket_id IN (SELECT id FROM tickets WHERE student_id = ?)", (sid,))
    conn.execute("DELETE FROM receipts WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM transactions WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM documents WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM fee_records WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM fee_payments WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM exam_results WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM tickets WHERE student_id = ?", (sid,))
    conn.execute("DELETE FROM placement_applications WHERE student_id = ?", (sid,))
    # Delete user-related records (conversations, chat_messages, notifications, password_reset_tokens)
    if student and student["user_id"]:
        uid = student["user_id"]
        # chat_messages references conversations(id) and sender_id -> users(id)
        conn.execute("DELETE FROM chat_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE student_user_id = ?)", (uid,))
        conn.execute("DELETE FROM chat_messages WHERE sender_id = ?", (uid,))
        conn.execute("DELETE FROM conversations WHERE student_user_id = ?", (uid,))
        conn.execute("DELETE FROM notifications WHERE user_id = ?", (uid,))
        conn.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", (uid,))
    conn.execute("DELETE FROM students WHERE id = ?", (sid,))
    # Also delete the user account if exists
    if student and student["user_id"]:
        conn.execute("DELETE FROM users WHERE id = ? AND role = 'student'", (student["user_id"],))
    conn.commit()
    conn.close()
    return {"message": "Student deleted"}

@router.post("/{sid}/transfer")
async def transfer_student(sid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE students SET branch_id = ?, status = 'transferred', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                 (data.get("new_branch_id"), sid))
    conn.commit()
    conn.close()
    return {"message": "Student transferred"}

@router.post("/{sid}/re-register")
async def re_register_student(sid: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE students SET session_name = ?, status = 're-registered', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                 (data.get("new_session"), sid))
    conn.commit()
    conn.close()
    return {"message": "Student re-registered"}

@router.post("/{sid}/approve")
async def approve_student(sid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE students SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (sid,))
    conn.commit()
    conn.close()
    return {"message": "Student approved"}

@router.post("/{sid}/reject")
async def reject_student(sid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE students SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (sid,))
    conn.commit()
    conn.close()
    return {"message": "Student rejected"}

@router.post("/{sid}/change-status")
async def change_student_status(sid: int, data: dict, user: dict = Depends(require_admin)):
    """Change student status to any status category."""
    new_status = data.get("status", "")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    conn = get_db()
    student = conn.execute("SELECT id FROM students WHERE id = ?", (sid,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    conn.execute("UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, sid))
    conn.commit()
    conn.close()
    return {"message": f"Student status changed to {new_status}"}

@router.post("/admin-add")
async def admin_add_student(data: dict, user: dict = Depends(require_admin)):
    """Admin creates student with user account (username/password) + all details."""
    from app.utils.auth import hash_password
    conn = get_db()
    
    # Default username to phone number (mobile number as login ID)
    phone = data.get("phone", "")
    email = data.get("email", "")
    username = data.get("username", "") or phone
    password = data.get("password", "")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username/phone and password required")
    if not email:
        raise HTTPException(status_code=400, detail="Email ID is required for all students")
    
    # Block duplicate mobile number - one phone = one student
    if phone:
        existing_phone = conn.execute("SELECT id FROM students WHERE phone = ?", (phone,)).fetchone()
        if existing_phone:
            conn.close()
            raise HTTPException(status_code=400, detail="Is mobile number se ek student pehle se registered hai. Ek number se sirf ek student register ho sakta hai.")
    
    # Check if username exists
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create user account
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash, name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (username, data.get("email", ""), hash_password(password), data.get("name", ""), data.get("phone", ""), "student", 1)
    )
    uid = cursor.lastrowid
    conn.commit()
    
    # Create student record with all details - use MAX to avoid race condition
    import sqlite3
    student_fields = {}
    for f in ALL_FIELDS:
        if f in data:
            student_fields[f] = data[f]
    student_fields["status"] = "active"  # Admin-added students are auto-approved
    
    # Handle total_fees
    if "total_fees" in data and data["total_fees"]:
        student_fields["total_fees"] = float(data["total_fees"])
    
    for _attempt in range(5):
        max_row = conn.execute("SELECT MAX(CAST(SUBSTR(enrollment_no, 4) AS INTEGER)) FROM students").fetchone()
        next_num = (max_row[0] or 1000) + 1
        enrollment_no = f"EDU{str(next_num).zfill(6)}"
        field_names = ["user_id", "enrollment_no"] + list(student_fields.keys())
        field_values = [uid, enrollment_no] + list(student_fields.values())
        placeholders = ", ".join(["?"] * len(field_names))
        names_str = ", ".join(field_names)
        try:
            cursor = conn.execute(f"INSERT INTO students ({names_str}) VALUES ({placeholders})", field_values)
            sid = cursor.lastrowid
            conn.commit()
            break
        except sqlite3.IntegrityError:
            continue
    else:
        conn.close()
        raise HTTPException(status_code=500, detail="Could not generate unique enrollment number")
    conn.close()
    return {"id": sid, "enrollment_no": enrollment_no, "username": username, "message": "Student created with login credentials"}

@router.post("/bulk-upload")
async def bulk_upload(data: dict, user: dict = Depends(require_admin)):
    students = data.get("students", [])
    conn = get_db()
    created = 0
    import sqlite3
    for s in students:
        max_row = conn.execute("SELECT MAX(CAST(SUBSTR(enrollment_no, 4) AS INTEGER)) FROM students").fetchone()
        next_num = (max_row[0] or 1000) + 1
        enrollment_no = f"EDU{str(next_num).zfill(6)}"
        # Build dynamic insert with all provided fields
        field_names = ["enrollment_no"]
        field_values = [enrollment_no]
        for f in ALL_FIELDS:
            if f in s and s[f] is not None and s[f] != "":
                field_names.append(f)
                field_values.append(s[f])
        # Ensure status is set
        if "status" not in field_names:
            field_names.append("status")
            field_values.append("active")
        placeholders = ", ".join(["?"] * len(field_names))
        names_str = ", ".join(field_names)
        conn.execute(f"INSERT INTO students ({names_str}) VALUES ({placeholders})", field_values)
        created += 1
    conn.commit()
    conn.close()
    return {"message": f"{created} students uploaded successfully"}

@router.delete("/bulk-delete")
async def bulk_delete_students(data: dict, user: dict = Depends(require_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"message": "No students selected"}
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    # Delete in correct FK order: children before parents
    # ticket_messages -> tickets, receipts -> transactions
    try:
        conn.execute(f"DELETE FROM ticket_messages WHERE ticket_id IN (SELECT id FROM tickets WHERE student_id IN ({placeholders}))", ids)
    except Exception:
        pass
    conn.execute(f"DELETE FROM receipts WHERE student_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM documents WHERE student_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM transactions WHERE student_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM fee_records WHERE student_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM fee_payments WHERE student_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM exam_results WHERE student_id IN ({placeholders})", ids)
    try:
        conn.execute(f"DELETE FROM placement_applications WHERE student_id IN ({placeholders})", ids)
    except Exception:
        pass
    conn.execute(f"DELETE FROM tickets WHERE student_id IN ({placeholders})", ids)
    conn.execute(f"DELETE FROM students WHERE id IN ({placeholders})", ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} students deleted"}

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    upload_dir = get_upload_dir()
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    content = await file.read()
    content, filename = optimize_thumbnail(content, filename)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"filename": filename, "url": f"/uploads/{filename}"}

@router.post("/upload-photo-base64")
async def upload_photo_base64(data: dict, user: dict = Depends(get_current_user)):
    upload_dir = get_upload_dir()
    image_data = data.get("image", "")
    if "base64," in image_data:
        image_data = image_data.split("base64,")[1]
    ext = data.get("ext", "jpg")
    filename = f"{uuid.uuid4().hex}.{ext}"

    content = base64.b64decode(image_data)
    content, filename = optimize_thumbnail(content, filename)

    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    photo_url = f"/uploads/{filename}"
    # Auto-save photo to student record
    try:
        conn = get_db()
        student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
        if student:
            conn.execute("UPDATE students SET photo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (photo_url, student["id"]))
            conn.commit()
        conn.close()
    except Exception:
        pass
    return {"filename": filename, "url": photo_url}

@router.put("/{sid}/update-credentials")
async def update_student_credentials(sid: int, data: dict, user: dict = Depends(require_admin)):
    """Admin can change student's username and/or password."""
    from app.utils.auth import hash_password
    conn = get_db()
    student = conn.execute("SELECT user_id FROM students WHERE id = ?", (sid,)).fetchone()
    if not student or not student["user_id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Student user account not found")
    uid = student["user_id"]
    new_username = data.get("username")
    new_password = data.get("password")
    if new_username:
        existing = conn.execute("SELECT id FROM users WHERE username = ? AND id != ?", (new_username, uid)).fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="Username already taken")
        conn.execute("UPDATE users SET username = ? WHERE id = ?", (new_username, uid))
    if new_password:
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), uid))
    conn.commit()
    conn.close()
    return {"message": "Credentials updated successfully"}

@router.get("/{sid}/credentials")
async def get_student_credentials(sid: int, user: dict = Depends(require_admin)):
    """Admin can view student's username."""
    conn = get_db()
    student = conn.execute("SELECT user_id FROM students WHERE id = ?", (sid,)).fetchone()
    if not student or not student["user_id"]:
        conn.close()
        return {"username": "", "user_id": None}
    u = conn.execute("SELECT username FROM users WHERE id = ?", (student["user_id"],)).fetchone()
    conn.close()
    return {"username": u["username"] if u else "", "user_id": student["user_id"]}

@router.get("/dashboard/stats")
async def dashboard_stats(user: dict = Depends(require_admin)):
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    active = conn.execute("SELECT COUNT(*) FROM students WHERE status = 'active'").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM students WHERE status = 'pending'").fetchone()[0]
    transferred = conn.execute("SELECT COUNT(*) FROM students WHERE status = 'transferred'").fetchone()[0]
    re_registered = conn.execute("SELECT COUNT(*) FROM students WHERE status = 're-registered'").fetchone()[0]
    conn.close()
    return {"total": total, "active": active, "pending": pending, "transferred": transferred, "re_registered": re_registered}

@router.get("/{sid}/documents")
async def get_student_documents(sid: int, user: dict = Depends(get_current_user)):
    """Get all documents for a student."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM documents WHERE student_id = ? ORDER BY created_at DESC", (sid,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/lookup/by-phone/{phone}")
async def lookup_student_by_phone(phone: str, user: dict = Depends(get_current_user)):
    """Lookup student by phone number (used as primary identifier)."""
    conn = get_db()
    row = conn.execute(
        """SELECT s.*, u.name as university_name, c.name as category_name, b.name as branch_name 
           FROM students s 
           LEFT JOIN universities u ON s.university_id = u.id 
           LEFT JOIN categories c ON s.category_id = c.id 
           LEFT JOIN branches b ON s.branch_id = b.id 
           WHERE s.phone = ?""", (phone,)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    student = dict(row)
    # Also get documents
    docs = conn.execute("SELECT * FROM documents WHERE student_id = ? ORDER BY created_at DESC", (student["id"],)).fetchall()
    student["documents"] = [dict(d) for d in docs]
    # Also get transactions
    txns = conn.execute("SELECT * FROM transactions WHERE student_id = ? ORDER BY created_at DESC", (student["id"],)).fetchall()
    student["transactions"] = [dict(t) for t in txns]
    conn.close()
    return student
