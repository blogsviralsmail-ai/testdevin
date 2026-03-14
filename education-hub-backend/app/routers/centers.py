from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.utils.auth import require_admin, get_current_user, hash_password, require_only_admin
import json
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/centers", tags=["Centers"])


# ── Pydantic Models ──────────────────────────────────────────────

class CenterCreate(BaseModel):
    name: str
    mobile: str
    owner_name: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    parent_center_id: Optional[int] = None
    password: str = "Center@123"

class CenterUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None

class CommissionSlabCreate(BaseModel):
    university_id: int
    min_admissions: int = 1
    max_admissions: int = 999
    commission_amount: float = 0

class CenterCommissionCreate(BaseModel):
    student_id: int
    university_id: Optional[int] = None
    amount: float
    commission_type: str = "manual"
    notes: Optional[str] = None


# ── Helper: Get center for logged-in center user ─────────────────

def get_current_center(user: dict):
    """Get center record for the logged-in center user."""
    conn = get_db()
    center = conn.execute("SELECT * FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    conn.close()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found for this user")
    return dict(center)


def get_center_and_subcenter_ids(conn, center_id: int) -> list:
    """Get center_id + all sub-center IDs under it (full recursive)."""
    ids = [center_id]
    sub_centers = conn.execute("SELECT id FROM centers WHERE parent_center_id = ?", (center_id,)).fetchall()
    for sc in sub_centers:
        ids.extend(get_center_and_subcenter_ids(conn, sc["id"]))
    return ids


# ══════════════════════════════════════════════════════════════════
#  ADMIN APIs — Manage Centers
# ══════════════════════════════════════════════════════════════════

@router.get("")
async def list_centers(
    level: Optional[str] = None,
    parent_center_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """List all centers (admin) or sub-centers (center user)."""
    conn = get_db()
    role = user.get("role", "")

    query = """SELECT c.*, 
               pc.name as parent_center_name,
               (SELECT COUNT(*) FROM students WHERE center_id = c.id) as student_count,
               (SELECT COUNT(*) FROM centers WHERE parent_center_id = c.id) as sub_center_count
               FROM centers c
               LEFT JOIN centers pc ON c.parent_center_id = pc.id
               WHERE 1=1"""
    params = []

    # Center user can only see their sub-centers
    if role == "center":
        center = get_current_center(user)
        query += " AND (c.id = ? OR c.parent_center_id = ?)"
        params.extend([center["id"], center["id"]])
    
    if level:
        query += " AND c.level = ?"
        params.append(level)
    if parent_center_id:
        query += " AND c.parent_center_id = ?"
        params.append(parent_center_id)
    if status:
        query += " AND c.status = ?"
        params.append(status)
    if search:
        query += " AND (c.name LIKE ? OR c.mobile LIKE ? OR c.owner_name LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    
    query += " ORDER BY c.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"centers": [dict(r) for r in rows]}


@router.get("/stats")
async def center_stats(user: dict = Depends(get_current_user)):
    """Get center statistics for dashboard."""
    conn = get_db()
    role = user.get("role", "")

    if role == "center":
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        placeholders = ",".join(["?"] * len(all_ids))
        
        total_students = conn.execute(f"SELECT COUNT(*) FROM students WHERE center_id IN ({placeholders})", all_ids).fetchone()[0]
        own_students = conn.execute("SELECT COUNT(*) FROM students WHERE center_id = ?", (center["id"],)).fetchone()[0]
        sub_centers = conn.execute("SELECT COUNT(*) FROM centers WHERE parent_center_id = ?", (center["id"],)).fetchone()[0]
        
        # Total commission
        total_commission = conn.execute(f"SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id IN ({placeholders})", all_ids).fetchone()[0]
        paid_commission = conn.execute(f"SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id IN ({placeholders}) AND status = 'paid'", all_ids).fetchone()[0]
        pending_commission = conn.execute(f"SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id IN ({placeholders}) AND status = 'pending'", all_ids).fetchone()[0]
        
        conn.close()
        return {
            "total_students": total_students,
            "own_students": own_students,
            "sub_centers": sub_centers,
            "total_commission": total_commission,
            "paid_commission": paid_commission,
            "pending_commission": pending_commission,
            "center": dict(center) if isinstance(center, dict) else center
        }
    else:
        # Admin stats
        total_centers = conn.execute("SELECT COUNT(*) FROM centers WHERE level = 'center'").fetchone()[0]
        total_sub_centers = conn.execute("SELECT COUNT(*) FROM centers WHERE level = 'sub_center'").fetchone()[0]
        total_center_students = conn.execute("SELECT COUNT(*) FROM students WHERE center_id IS NOT NULL").fetchone()[0]
        total_commission = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM center_commissions").fetchone()[0]
        paid_commission = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE status = 'paid'").fetchone()[0]
        pending_commission = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE status = 'pending'").fetchone()[0]
        
        conn.close()
        return {
            "total_centers": total_centers,
            "total_sub_centers": total_sub_centers,
            "total_center_students": total_center_students,
            "total_commission": total_commission,
            "paid_commission": paid_commission,
            "pending_commission": pending_commission
        }


@router.get("/{center_id}")
async def get_center(center_id: int, user: dict = Depends(get_current_user)):
    """Get single center details."""
    conn = get_db()
    row = conn.execute("""SELECT c.*, pc.name as parent_center_name,
                          (SELECT COUNT(*) FROM students WHERE center_id = c.id) as student_count,
                          (SELECT COUNT(*) FROM centers WHERE parent_center_id = c.id) as sub_center_count
                          FROM centers c
                          LEFT JOIN centers pc ON c.parent_center_id = pc.id
                          WHERE c.id = ?""", (center_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Center not found")
    return dict(row)


@router.post("")
async def create_center(data: CenterCreate, user: dict = Depends(get_current_user)):
    """Create a new center (admin) or sub-center (center user)."""
    conn = get_db()
    role = user.get("role", "")

    # Block students and other non-privileged roles from creating centers
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to create centers")

    # Check duplicate mobile
    existing = conn.execute("SELECT id FROM centers WHERE mobile = ?", (data.mobile,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Is mobile number se pehle se center registered hai.")

    # Determine level
    level = "center"
    parent_id = data.parent_center_id
    
    if role == "center":
        # Center user creating a sub-center
        center = get_current_center(user)
        parent_id = center["id"]
        level = "sub_center"
    elif parent_id:
        level = "sub_center"

    # Create user account for center login (mobile as username)
    try:
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash, name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (data.mobile, data.email, hash_password(data.password), data.name, data.mobile, "center", 1)
        )
        center_user_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"User creation failed: {str(e)}")

    # Create center record
    cursor = conn.execute(
        """INSERT INTO centers (name, mobile, owner_name, email, address, city, state, parent_center_id, level, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.name, data.mobile, data.owner_name, data.email, data.address, data.city, data.state, parent_id, level, center_user_id)
    )
    center_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": center_id, "message": f"{'Sub-center' if level == 'sub_center' else 'Center'} created successfully", "login_mobile": data.mobile}


@router.put("/{center_id}")
async def update_center(center_id: int, data: CenterUpdate, user: dict = Depends(get_current_user)):
    """Update center details."""
    conn = get_db()
    
    # Center user can only update their own sub-centers
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to update centers")
    if role == "center":
        center = get_current_center(user)
        target = conn.execute("SELECT * FROM centers WHERE id = ?", (center_id,)).fetchone()
        if not target or (target["id"] != center["id"] and target["parent_center_id"] != center["id"]):
            conn.close()
            raise HTTPException(status_code=403, detail="You can only update your own center or sub-centers")

    update_fields = []
    values = []
    for field in ["name", "owner_name", "email", "address", "city", "state", "status"]:
        val = getattr(data, field, None)
        if val is not None:
            update_fields.append(f"{field}=?")
            values.append(val)
    
    if update_fields:
        values.append(center_id)
        conn.execute(f"UPDATE centers SET {', '.join(update_fields)}, updated_at=CURRENT_TIMESTAMP WHERE id=?", values)
        # Also update the linked user name if name changed
        if data.name:
            conn.execute("UPDATE users SET name = ? WHERE id = (SELECT user_id FROM centers WHERE id = ?)", (data.name, center_id))
        conn.commit()
    conn.close()
    return {"message": "Center updated"}


@router.put("/{center_id}/password")
async def change_center_password(center_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Admin or parent center changes a center/sub-center's login password."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    new_password = data.get("password", "")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    conn = get_db()
    center = conn.execute("SELECT * FROM centers WHERE id = ?", (center_id,)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    # Center user can only change password for their own sub-centers
    if role == "center":
        my_center = get_current_center(user)
        if center["parent_center_id"] != my_center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="You can only change passwords for your sub-centers")
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), center["user_id"]))
    conn.commit()
    conn.close()
    return {"message": f"Password changed for center '{center['name']}'"}


@router.delete("/{center_id}")
async def delete_center(center_id: int, user: dict = Depends(require_admin)):
    """Delete a center and its user account."""
    conn = get_db()
    center = conn.execute("SELECT * FROM centers WHERE id = ?", (center_id,)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    
    # Check if center has students
    student_count = conn.execute("SELECT COUNT(*) FROM students WHERE center_id = ?", (center_id,)).fetchone()[0]
    if student_count > 0:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Cannot delete center with {student_count} students. Transfer students first.")
    
    # Delete sub-centers first
    sub_centers = conn.execute("SELECT id, user_id FROM centers WHERE parent_center_id = ?", (center_id,)).fetchall()
    for sc in sub_centers:
        sc_students = conn.execute("SELECT COUNT(*) FROM students WHERE center_id = ?", (sc["id"],)).fetchone()[0]
        if sc_students > 0:
            conn.close()
            raise HTTPException(status_code=400, detail=f"Sub-center has {sc_students} students. Transfer students first.")
        conn.execute("DELETE FROM center_commissions WHERE center_id = ?", (sc["id"],))
        conn.execute("DELETE FROM commission_slabs WHERE center_id = ?", (sc["id"],))
        conn.execute("DELETE FROM centers WHERE id = ?", (sc["id"],))
        if sc["user_id"]:
            conn.execute("DELETE FROM users WHERE id = ?", (sc["user_id"],))
    
    # Delete center records
    conn.execute("DELETE FROM center_commissions WHERE center_id = ?", (center_id,))
    conn.execute("DELETE FROM commission_slabs WHERE center_id = ?", (center_id,))
    conn.execute("DELETE FROM centers WHERE id = ?", (center_id,))
    if center["user_id"]:
        conn.execute("DELETE FROM users WHERE id = ?", (center["user_id"],))
    conn.commit()
    conn.close()
    return {"message": "Center deleted"}


# ══════════════════════════════════════════════════════════════════
#  CENTER STUDENT APIs — Center manages its own students
# ══════════════════════════════════════════════════════════════════

@router.get("/{center_id}/students")
async def list_center_students(
    center_id: int,
    include_sub: bool = True,
    sub_centers_only: bool = False,
    search: Optional[str] = None,
    status: Optional[str] = None,
    university_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List students for a center (and optionally its sub-centers).
    sub_centers_only=true returns ONLY sub-center students (excludes parent center's own students).
    """
    conn = get_db()
    
    if sub_centers_only:
        all_ids = get_center_and_subcenter_ids(conn, center_id)
        all_ids = [cid for cid in all_ids if cid != center_id]
        if not all_ids:
            conn.close()
            return {"students": [], "total": 0, "page": page, "limit": limit}
    elif include_sub:
        all_ids = get_center_and_subcenter_ids(conn, center_id)
    else:
        all_ids = [center_id]
    
    placeholders = ",".join(["?"] * len(all_ids))
    query = f"""SELECT s.*, u.name as university_name, c.name as category_name, 
                br.name as branch_name, ct.name as center_name
                FROM students s
                LEFT JOIN universities u ON s.university_id = u.id
                LEFT JOIN categories c ON s.category_id = c.id
                LEFT JOIN branches br ON s.branch_id = br.id
                LEFT JOIN centers ct ON s.center_id = ct.id
                WHERE s.center_id IN ({placeholders})"""
    params = list(all_ids)

    if search:
        query += " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.enrollment_no LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])
    if status:
        query += " AND s.status = ?"
        params.append(status)
    if university_id:
        query += " AND s.university_id = ?"
        params.append(university_id)

    # Count — use a robust wrapper instead of fragile string replace
    count_q = f"SELECT COUNT(*) FROM students s LEFT JOIN universities u ON s.university_id = u.id LEFT JOIN categories c ON s.category_id = c.id LEFT JOIN branches br ON s.branch_id = br.id LEFT JOIN centers ct ON s.center_id = ct.id WHERE s.center_id IN ({placeholders})"
    count_params = list(all_ids)
    if search:
        count_q += " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.enrollment_no LIKE ?)"
        s2 = f"%{search}%"
        count_params.extend([s2, s2, s2, s2])
    if status:
        count_q += " AND s.status = ?"
        count_params.append(status)
    if university_id:
        count_q += " AND s.university_id = ?"
        count_params.append(university_id)
    total = conn.execute(count_q, count_params).fetchone()[0]

    query += " ORDER BY s.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    rows = conn.execute(query, params).fetchall()
    
    students_list = []
    for r in rows:
        d = dict(r)
        fp_paid = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = ? AND status = 'approved' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)", (d["id"],)).fetchone()[0]
        admin_paid = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE student_id = ? AND transaction_type = 'credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)", (d["id"],)).fetchone()[0]
        d["deposit"] = fp_paid + admin_paid
        students_list.append(d)
    
    conn.close()
    return {"students": students_list, "total": total, "page": page, "limit": limit}


@router.post("/my/students")
async def center_add_student(data: dict, user: dict = Depends(get_current_user)):
    """Center adds a student with user account (login credentials) under itself.
    Phone number is the student ID / username for login."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can use this endpoint")
    
    from app.utils.auth import hash_password
    center = get_current_center(user)
    conn = get_db()
    
    # Phone is required - it's the student ID / login username
    phone = data.get("phone", "").strip()
    if not phone:
        conn.close()
        raise HTTPException(status_code=400, detail="Phone number is required (yahi student ID / login ID hoga)")
    
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    
    if not name:
        conn.close()
        raise HTTPException(status_code=400, detail="Student name is required")
    if not password:
        conn.close()
        raise HTTPException(status_code=400, detail="Password is required for student login")
    
    # Check duplicate phone in students
    existing = conn.execute("SELECT id FROM students WHERE phone = ?", (phone,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Is mobile number se ek student pehle se registered hai.")
    
    # Check duplicate username in users (phone = username)
    existing_user = conn.execute("SELECT id FROM users WHERE username = ?", (phone,)).fetchone()
    if existing_user:
        conn.close()
        raise HTTPException(status_code=400, detail="Is mobile number se pehle se account hai.")
    
    # Create user account (phone = username, student role)
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash, name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (phone, email, hash_password(password), name, phone, "student", 1)
    )
    uid = cursor.lastrowid
    conn.commit()
    
    # Determine admission_source
    admission_source = "self"
    referring_sub_center_id = data.get("sub_center_id")
    actual_center_id = center["id"]
    
    if referring_sub_center_id:
        # Verify sub-center belongs to this center
        sc = conn.execute("SELECT * FROM centers WHERE id = ? AND parent_center_id = ?", (referring_sub_center_id, center["id"])).fetchone()
        if sc:
            actual_center_id = referring_sub_center_id
            admission_source = "chain"
    
    # Build student record with ALL fields (same as admin form)
    import sqlite3
    
    # All possible student fields from the form
    ALL_STUDENT_FIELDS = [
        "name", "email", "phone", "university_id", "category_id", "branch_id",
        "session_name", "admission_type", "father_name", "mother_name", "date_of_birth", "gender",
        "category_type", "nationality", "aadhar_no", "marital_status",
        "guardian_name", "father_occupation", "parent_phone", "parent_email",
        "current_address", "current_city", "current_state", "current_pincode",
        "permanent_address", "permanent_city", "permanent_state", "permanent_pincode",
        "tenth_board", "tenth_year", "tenth_percentage", "tenth_school",
        "twelfth_board", "twelfth_year", "twelfth_percentage", "twelfth_school",
        "graduation_university", "graduation_year", "graduation_percentage", "graduation_degree",
        "post_graduation_university", "post_graduation_year", "post_graduation_percentage", "post_graduation_degree",
        "blood_group", "disability", "disability_type",
        "hostel_required", "transport_required", "pickup_location",
        "extra_curricular", "achievements",
    ]
    
    student_data = {}
    for f in ALL_STUDENT_FIELDS:
        if f in data and data[f] is not None and data[f] != "":
            student_data[f] = data[f]
    
    # Force required fields
    student_data["name"] = name
    student_data["email"] = email
    student_data["phone"] = phone
    student_data["status"] = "active"
    student_data["center_id"] = actual_center_id
    student_data["admission_source"] = admission_source
    if "admission_type" not in student_data:
        student_data["admission_type"] = "FRESH_ADMISSION"
    
    for _attempt in range(5):
        max_row = conn.execute("SELECT MAX(CAST(SUBSTR(enrollment_no, 4) AS INTEGER)) FROM students").fetchone()
        next_num = (max_row[0] or 1000) + 1
        enrollment_no = f"EDU{str(next_num).zfill(6)}"
        
        field_names = ["user_id", "enrollment_no"] + list(student_data.keys())
        field_values = [uid, enrollment_no] + list(student_data.values())
        placeholders = ",".join(["?"] * len(field_names))
        names_str = ",".join(field_names)
        try:
            cursor = conn.execute(f"INSERT INTO students ({names_str}) VALUES ({placeholders})", field_values)
            sid = cursor.lastrowid
            break
        except sqlite3.IntegrityError:
            continue
    else:
        conn.close()
        raise HTTPException(status_code=500, detail="Could not generate unique enrollment number")
    
    # Handle total_fees if provided
    if data.get("total_fees"):
        conn.execute("UPDATE students SET total_fees = ? WHERE id = ?", (float(data["total_fees"]), sid))
    
    conn.commit()
    conn.close()
    return {"id": sid, "enrollment_no": enrollment_no, "username": phone, "message": "Student added with login credentials (Phone = Student ID)"}


@router.put("/my/students/{student_id}/password")
async def center_change_student_password(student_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Center changes a student's login password."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can use this endpoint")
    
    new_password = data.get("password", "")
    if not new_password or len(new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    
    center = get_current_center(user)
    conn = get_db()
    
    # Verify student belongs to this center or its sub-centers
    all_ids = get_center_and_subcenter_ids(conn, center["id"])
    placeholders = ",".join(["?"] * len(all_ids))
    student = conn.execute(f"SELECT * FROM students WHERE id = ? AND center_id IN ({placeholders})", [student_id] + all_ids).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found under your center")
    
    # Find user account for this student
    user_id = student["user_id"] if student["user_id"] else None
    if not user_id:
        # Try to find by phone
        u = conn.execute("SELECT id FROM users WHERE username = ? AND role = 'student'", (student["phone"],)).fetchone()
        if u:
            user_id = u["id"]
    
    if not user_id:
        conn.close()
        raise HTTPException(status_code=400, detail="Student has no login account. Re-add student to create login.")
    
    from app.utils.auth import hash_password as hp
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hp(new_password), user_id))
    conn.commit()
    conn.close()
    return {"message": f"Password changed for student '{student['name']}'"}


# ══════════════════════════════════════════════════════════════════
#  COMMISSION SLAB APIs
# ══════════════════════════════════════════════════════════════════

@router.get("/commission/slabs")
async def list_commission_slabs(
    university_id: Optional[int] = None,
    center_id: Optional[int] = None,
    user: dict = Depends(get_current_user)
):
    """List commission slabs. Admin sees all, center sees its own."""
    conn = get_db()
    role = user.get("role", "")
    
    query = """SELECT cs.*, u.name as university_name, c.name as center_name
               FROM commission_slabs cs
               LEFT JOIN universities u ON cs.university_id = u.id
               LEFT JOIN centers c ON cs.center_id = c.id
               WHERE 1=1"""
    params = []
    
    if role == "center":
        center = get_current_center(user)
        # Center sees admin-level slabs (center_id IS NULL) and their own slabs for sub-centers
        query += " AND (cs.center_id IS NULL OR cs.center_id = ?)"
        params.append(center["id"])
    
    if university_id:
        query += " AND cs.university_id = ?"
        params.append(university_id)
    if center_id:
        query += " AND cs.center_id = ?"
        params.append(center_id)
    
    query += " ORDER BY cs.university_id, cs.min_admissions"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"slabs": [dict(r) for r in rows]}


@router.post("/commission/slabs")
async def create_commission_slab(data: CommissionSlabCreate, user: dict = Depends(get_current_user)):
    """Create commission slab. Admin creates for centers, center creates for sub-centers."""
    conn = get_db()
    role = user.get("role", "")
    
    # Authorization check — only admin and center roles can create slabs
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to create commission slabs")
    
    center_id = None
    if role == "center":
        center = get_current_center(user)
        center_id = center["id"]  # Center sets slabs for its sub-centers
    
    cursor = conn.execute(
        "INSERT INTO commission_slabs (university_id, center_id, min_admissions, max_admissions, commission_amount) VALUES (?, ?, ?, ?, ?)",
        (data.university_id, center_id, data.min_admissions, data.max_admissions, data.commission_amount)
    )
    conn.commit()
    conn.close()
    return {"id": cursor.lastrowid, "message": "Commission slab created"}


@router.put("/commission/slabs/{slab_id}")
async def update_commission_slab(slab_id: int, data: dict, user: dict = Depends(require_admin)):
    """Update a commission slab."""
    conn = get_db()
    update_fields = []
    values = []
    for field in ["min_admissions", "max_admissions", "commission_amount"]:
        if field in data:
            update_fields.append(f"{field}=?")
            values.append(data[field])
    if update_fields:
        values.append(slab_id)
        conn.execute(f"UPDATE commission_slabs SET {', '.join(update_fields)} WHERE id=?", values)
        conn.commit()
    conn.close()
    return {"message": "Commission slab updated"}


@router.delete("/commission/slabs/{slab_id}")
async def delete_commission_slab(slab_id: int, user: dict = Depends(require_admin)):
    """Delete a commission slab."""
    conn = get_db()
    conn.execute("DELETE FROM commission_slabs WHERE id = ?", (slab_id,))
    conn.commit()
    conn.close()
    return {"message": "Commission slab deleted"}


# ══════════════════════════════════════════════════════════════════
#  CENTER COMMISSION TRACKING
# ══════════════════════════════════════════════════════════════════

@router.get("/commission/records")
async def list_commissions(
    center_id: Optional[int] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """List commission records."""
    conn = get_db()
    role = user.get("role", "")
    
    query = """SELECT cc.*, s.name as student_name, s.enrollment_no, s.phone as student_phone,
               u.name as university_name, c.name as center_name
               FROM center_commissions cc
               LEFT JOIN students s ON cc.student_id = s.id
               LEFT JOIN universities u ON cc.university_id = u.id
               LEFT JOIN centers c ON cc.center_id = c.id
               WHERE 1=1"""
    params = []
    
    if role == "center":
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        placeholders = ",".join(["?"] * len(all_ids))
        query += f" AND cc.center_id IN ({placeholders})"
        params.extend(all_ids)
    elif center_id:
        query += " AND cc.center_id = ?"
        params.append(center_id)
    
    if status:
        query += " AND cc.status = ?"
        params.append(status)
    
    query += " ORDER BY cc.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"commissions": [dict(r) for r in rows]}


@router.post("/commission/records")
async def create_commission(data: CenterCommissionCreate, user: dict = Depends(get_current_user)):
    """Add manual commission record for a student (NIOS etc.)."""
    conn = get_db()
    role = user.get("role", "")

    # Only admin and center roles can create commission records
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to create commission records")
    
    # Determine center_id
    student = conn.execute("SELECT center_id, university_id FROM students WHERE id = ?", (data.student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    
    center_id = student["center_id"]
    if not center_id:
        conn.close()
        raise HTTPException(status_code=400, detail="Student is not assigned to any center")
    
    university_id = data.university_id or student["university_id"]
    
    cursor = conn.execute(
        """INSERT INTO center_commissions (center_id, student_id, university_id, amount, commission_type, notes)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (center_id, data.student_id, university_id, data.amount, data.commission_type, data.notes)
    )
    conn.commit()
    conn.close()
    return {"id": cursor.lastrowid, "message": "Commission record added"}


@router.put("/commission/records/{record_id}/pay")
async def mark_commission_paid(record_id: int, user: dict = Depends(require_admin)):
    """Mark a commission as paid."""
    conn = get_db()
    conn.execute("UPDATE center_commissions SET status = 'paid', paid_date = ? WHERE id = ?",
                 (datetime.now().isoformat(), record_id))
    conn.commit()
    conn.close()
    return {"message": "Commission marked as paid"}


@router.delete("/commission/records/{record_id}")
async def delete_commission(record_id: int, user: dict = Depends(require_admin)):
    """Delete a commission record."""
    conn = get_db()
    conn.execute("DELETE FROM center_commissions WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return {"message": "Commission record deleted"}


# ══════════════════════════════════════════════════════════════════
#  CENTER COMMISSION REPORTS
# ══════════════════════════════════════════════════════════════════

@router.get("/commission/report")
async def commission_report(user: dict = Depends(get_current_user)):
    """Center-wise commission summary report."""
    conn = get_db()
    role = user.get("role", "")
    
    if role == "center":
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        placeholders = ",".join(["?"] * len(all_ids))
        
        rows = conn.execute(f"""
            SELECT c.id, c.name, c.mobile, c.level, c.owner_name,
                   (SELECT COUNT(*) FROM students WHERE center_id = c.id) as student_count,
                   (SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id = c.id) as total_commission,
                   (SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id = c.id AND status = 'paid') as paid_commission,
                   (SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id = c.id AND status = 'pending') as pending_commission
            FROM centers c WHERE c.id IN ({placeholders})
            ORDER BY c.level, c.name
        """, all_ids).fetchall()
    else:
        rows = conn.execute("""
            SELECT c.id, c.name, c.mobile, c.level, c.owner_name,
                   pc.name as parent_center_name,
                   (SELECT COUNT(*) FROM students WHERE center_id = c.id) as student_count,
                   (SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id = c.id) as total_commission,
                   (SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id = c.id AND status = 'paid') as paid_commission,
                   (SELECT COALESCE(SUM(amount), 0) FROM center_commissions WHERE center_id = c.id AND status = 'pending') as pending_commission
            FROM centers c
            LEFT JOIN centers pc ON c.parent_center_id = pc.id
            ORDER BY c.level, c.name
        """).fetchall()
    
    conn.close()
    return {"report": [dict(r) for r in rows]}


# ══════════════════════════════════════════════════════════════════
#  AUTO-PROMOTION API
# ══════════════════════════════════════════════════════════════════

@router.post("/promote")
async def promote_students(data: dict, user: dict = Depends(require_admin)):
    """Auto-promote students who passed their exams to next year/session."""
    conn = get_db()
    student_ids = data.get("student_ids", [])
    new_session = data.get("new_session", "")
    new_admission_type = data.get("new_admission_type", "RE_ADMISSION")
    
    if not student_ids or not new_session:
        conn.close()
        raise HTTPException(status_code=400, detail="student_ids and new_session required")
    
    promoted = 0
    for sid in student_ids:
        conn.execute(
            "UPDATE students SET session_name = ?, admission_type = ?, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_session, new_admission_type, sid)
        )
        promoted += 1
    
    conn.commit()
    conn.close()
    return {"message": f"{promoted} students promoted to {new_session}", "promoted_count": promoted}


@router.post("/auto-promote")
async def auto_promote_passed_students(data: dict, user: dict = Depends(require_admin)):
    """Auto-promote all passed students from a session to the next session."""
    conn = get_db()
    from_session = data.get("from_session", "")
    to_session = data.get("to_session", "")
    
    if not from_session or not to_session:
        conn.close()
        raise HTTPException(status_code=400, detail="from_session and to_session required")
    
    # Find students who have passed (status 'completed' or have passing exam results)
    # Check exam_results for passed students
    passed_students = conn.execute("""
        SELECT DISTINCT s.id FROM students s
        INNER JOIN exam_results er ON er.student_id = s.id
        WHERE s.session_name = ? AND er.status = 'passed' AND s.status = 'active'
    """, (from_session,)).fetchall()
    
    promoted = 0
    for row in passed_students:
        conn.execute(
            "UPDATE students SET session_name = ?, admission_type = 'RE_ADMISSION', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (to_session, row["id"])
        )
        promoted += 1
    
    conn.commit()
    conn.close()
    return {"message": f"{promoted} students auto-promoted from {from_session} to {to_session}", "promoted_count": promoted}


# ===================== CENTER PAYMENT SETTINGS =====================

@router.get("/my/payment-settings")
async def get_center_payment_settings(user: dict = Depends(get_current_user)):
    """Get current center's payment settings (QR code + bank details)."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    settings = conn.execute("SELECT * FROM center_payment_settings WHERE center_id = ?", (center["id"],)).fetchone()
    conn.close()
    if settings:
        return dict(settings)
    return {"center_id": center["id"], "upi_id": None, "upi_qr_url": None, "bank_name": None, "account_number": None, "ifsc_code": None, "account_holder_name": None}


@router.put("/my/payment-settings")
async def update_center_payment_settings(data: dict, user: dict = Depends(get_current_user)):
    """Update center's payment settings (QR code URL, UPI ID, bank details)."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    
    existing = conn.execute("SELECT id FROM center_payment_settings WHERE center_id = ?", (center["id"],)).fetchone()
    if existing:
        conn.execute("""UPDATE center_payment_settings SET 
            upi_id = ?, upi_qr_url = ?, bank_name = ?, account_number = ?, 
            ifsc_code = ?, account_holder_name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE center_id = ?""",
            (data.get("upi_id"), data.get("upi_qr_url"), data.get("bank_name"),
             data.get("account_number"), data.get("ifsc_code"), data.get("account_holder_name"),
             center["id"]))
    else:
        conn.execute("""INSERT INTO center_payment_settings 
            (center_id, upi_id, upi_qr_url, bank_name, account_number, ifsc_code, account_holder_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (center["id"], data.get("upi_id"), data.get("upi_qr_url"), data.get("bank_name"),
             data.get("account_number"), data.get("ifsc_code"), data.get("account_holder_name")))
    conn.commit()
    conn.close()
    return {"message": "Payment settings updated successfully"}


@router.post("/my/payment-settings/upload-qr")
async def upload_center_qr(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload QR code image for center payment settings."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    conn.close()
    
    from app.utils.uploads import get_upload_dir
    upload_dir = get_upload_dir()
    qr_dir = os.path.join(upload_dir, "center_qr")
    os.makedirs(qr_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename or "qr.png")[1] or ".png"
    filename = f"center_{center['id']}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(qr_dir, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    qr_url = f"/uploads/center_qr/{filename}"
    return {"qr_url": qr_url, "message": "QR code uploaded successfully"}


# ===================== CENTER FEE PAYMENTS MANAGEMENT =====================

@router.get("/my/fee-payments")
async def list_center_fee_payments(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List all fee payment requests for center's students."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    placeholders = ",".join(["?"] * len(center_ids))
    
    query = f"""SELECT cfp.*, s.name as student_name, s.phone as student_phone, 
                s.enrollment_no, c.name as center_name
                FROM center_fee_payments cfp
                JOIN students s ON cfp.student_id = s.id
                JOIN centers c ON cfp.center_id = c.id
                WHERE cfp.center_id IN ({placeholders})"""
    params = list(center_ids)
    
    if status:
        query += " AND cfp.status = ?"
        params.append(status)
    
    count_query = f"SELECT COUNT(*) FROM ({query})"
    total = conn.execute(count_query, params).fetchone()[0]
    
    query += " ORDER BY cfp.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    return {"payments": [dict(r) for r in rows], "total": total, "page": page, "limit": limit}


@router.put("/my/fee-payments/{payment_id}/approve")
async def approve_center_fee_payment(payment_id: int, user: dict = Depends(get_current_user)):
    """Approve a student's fee payment request."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    
    payment = conn.execute("SELECT * FROM center_fee_payments WHERE id = ?", (payment_id,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify this payment belongs to center or sub-center
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    if payment["center_id"] not in center_ids:
        conn.close()
        raise HTTPException(status_code=403, detail="This payment does not belong to your center")
    
    if payment["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail=f"Payment is already {payment['status']}")
    
    conn.execute("""UPDATE center_fee_payments SET status = 'approved', 
        approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?""",
        (int(user["sub"]), payment_id))
    conn.commit()
    
    # Auto-create commission record if applicable
    try:
        student = conn.execute("SELECT * FROM students WHERE id = ?", (payment["student_id"],)).fetchone()
        if student:
            slab = conn.execute("""SELECT * FROM commission_slabs 
                WHERE university_id = ? AND (category_id IS NULL OR category_id = ?)
                ORDER BY category_id DESC LIMIT 1""",
                (student["university_id"], student["category_id"])).fetchone()
            if slab:
                commission_amount = payment["amount"] * slab["percentage"] / 100
                if slab["max_amount"] and commission_amount > slab["max_amount"]:
                    commission_amount = slab["max_amount"]
                conn.execute("""INSERT INTO center_commissions 
                    (center_id, student_id, slab_id, amount, status, created_at)
                    VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)""",
                    (payment["center_id"], payment["student_id"], slab["id"], commission_amount))
                conn.commit()
    except Exception as e:
        print(f"Auto-commission creation failed: {e}")
    
    conn.close()
    return {"message": "Payment approved successfully"}


@router.put("/my/fee-payments/{payment_id}/reject")
async def reject_center_fee_payment(payment_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Reject a student's fee payment request."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    
    payment = conn.execute("SELECT * FROM center_fee_payments WHERE id = ?", (payment_id,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")
    
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    if payment["center_id"] not in center_ids:
        conn.close()
        raise HTTPException(status_code=403, detail="This payment does not belong to your center")
    
    if payment["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail=f"Payment is already {payment['status']}")
    
    conn.execute("""UPDATE center_fee_payments SET status = 'rejected', 
        rejection_reason = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?""",
        (data.get("reason", ""), int(user["sub"]), payment_id))
    conn.commit()
    conn.close()
    return {"message": "Payment rejected"}


# ===================== CENTER STUDENT FEE SUMMARY =====================

@router.get("/my/students/{student_id}/fees")
async def center_student_fee_summary(student_id: int, user: dict = Depends(get_current_user)):
    """Get fee summary for a specific student under this center."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    
    # Verify student belongs to center or sub-center
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    student = conn.execute("SELECT * FROM students WHERE id = ? AND center_id IN ({})".format(
        ",".join(["?"] * len(center_ids))), [student_id] + center_ids).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found under your center")
    
    # Get total fees
    total_fees = student["total_fees"] or 0
    
    # Get total paid from center_fee_payments (approved only)
    paid = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM center_fee_payments 
        WHERE student_id = ? AND status = 'approved'""", (student_id,)).fetchone()[0]
    
    # Also include admin-recorded payments if any (exclude mirror transactions to avoid double-counting)
    admin_paid = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM transactions 
        WHERE student_id = ? AND transaction_type = 'credit' 
        AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%'
        AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)""", (student_id,)).fetchone()[0]
    
    # Also include admin fee_payments (approved)
    admin_fp = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM fee_payments 
        WHERE student_id = ? AND status = 'approved' 
        AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)""", (student_id,)).fetchone()[0]
    
    total_paid = paid + admin_paid + admin_fp
    
    # Get payment history
    payments = conn.execute("""SELECT * FROM center_fee_payments 
        WHERE student_id = ? ORDER BY created_at DESC""", (student_id,)).fetchall()
    
    conn.close()
    return {
        "student_id": student_id,
        "student_name": student["name"],
        "total_fees": total_fees,
        "total_paid": total_paid,
        "balance": total_fees - total_paid,
        "center_payments": [dict(p) for p in payments]
    }


# ===================== STUDENT-FACING: CENTER PAYMENT INFO =====================

@router.get("/student/my-center-info")
async def student_get_center_info(user: dict = Depends(get_current_user)):
    """Student checks if they belong to a center and gets center payment settings."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    conn = get_db()
    uid = int(user["sub"])
    student = conn.execute("SELECT * FROM students WHERE user_id = ?", (uid,)).fetchone()
    if not student or not student["center_id"]:
        conn.close()
        return {"center_id": None}
    
    center = conn.execute("SELECT name FROM centers WHERE id = ?", (student["center_id"],)).fetchone()
    settings = conn.execute("SELECT * FROM center_payment_settings WHERE center_id = ?", 
                            (student["center_id"],)).fetchone()
    conn.close()
    
    result = {"center_id": student["center_id"], "center_name": center["name"] if center else "Unknown"}
    if settings:
        result["payment_settings"] = {
            "upi_id": settings["upi_id"],
            "upi_qr_url": settings["upi_qr_url"],
            "bank_name": settings["bank_name"],
            "account_number": settings["account_number"],
            "ifsc_code": settings["ifsc_code"],
            "account_holder_name": settings["account_holder_name"],
        }
    else:
        result["payment_settings"] = {}
    return result


@router.get("/student/payment-settings")
async def student_get_center_payment_settings(user: dict = Depends(get_current_user)):
    """Student fetches their center's payment settings (QR + bank details).
    Only works for students who belong to a center."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    conn = get_db()
    uid = int(user["sub"])
    student = conn.execute("SELECT * FROM students WHERE user_id = ?", (uid,)).fetchone()
    if not student or not student["center_id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="You are not assigned to any center")
    
    settings = conn.execute("SELECT * FROM center_payment_settings WHERE center_id = ?", 
                            (student["center_id"],)).fetchone()
    center = conn.execute("SELECT name FROM centers WHERE id = ?", (student["center_id"],)).fetchone()
    conn.close()
    
    result = {"center_name": center["name"] if center else "Unknown", "center_id": student["center_id"]}
    if settings:
        result.update({
            "upi_id": settings["upi_id"],
            "upi_qr_url": settings["upi_qr_url"],
            "bank_name": settings["bank_name"],
            "account_number": settings["account_number"],
            "ifsc_code": settings["ifsc_code"],
            "account_holder_name": settings["account_holder_name"],
        })
    return result


@router.post("/student/fee-payment")
async def student_submit_center_fee_payment(data: dict, user: dict = Depends(get_current_user)):
    """Student submits a fee payment to their center (UPI/bank/cash)."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    conn = get_db()
    uid = int(user["sub"])
    student = conn.execute("SELECT * FROM students WHERE user_id = ?", (uid,)).fetchone()
    if not student or not student["center_id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="You are not assigned to any center")
    
    amount = data.get("amount")
    if not amount or float(amount) <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    payment_mode = data.get("payment_mode", "upi")
    if payment_mode not in ("upi", "bank_transfer", "cash"):
        conn.close()
        raise HTTPException(status_code=400, detail="Payment mode must be upi, bank_transfer, or cash")
    
    conn.execute("""INSERT INTO center_fee_payments 
        (student_id, center_id, amount, payment_mode, utr_number, proof_url, remarks, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')""",
        (student["id"], student["center_id"], float(amount), payment_mode,
         data.get("utr_number"), data.get("proof_url"), data.get("remarks")))
    conn.commit()
    conn.close()
    return {"message": "Payment submitted successfully. Waiting for center approval."}


@router.get("/student/fee-summary")
async def student_center_fee_summary(user: dict = Depends(get_current_user)):
    """Student gets their fee summary from center."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    conn = get_db()
    uid = int(user["sub"])
    student = conn.execute("SELECT * FROM students WHERE user_id = ?", (uid,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    
    is_center_student = bool(student["center_id"])
    total_fees = student["total_fees"] or 0
    
    if is_center_student:
        # Center student: payments from center_fee_payments
        center_paid = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM center_fee_payments 
            WHERE student_id = ? AND status = 'approved'""", (student["id"],)).fetchone()[0]
        # Also include any admin payments (exclude mirror transactions to avoid double-counting)
        admin_paid = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM transactions 
            WHERE student_id = ? AND transaction_type = 'credit' 
            AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%'
            AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)""", (student["id"],)).fetchone()[0]
        admin_fp = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM fee_payments 
            WHERE student_id = ? AND status = 'approved' 
            AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)""", (student["id"],)).fetchone()[0]
        total_paid = center_paid + admin_paid + admin_fp
        
        payments = conn.execute("""SELECT * FROM center_fee_payments 
            WHERE student_id = ? ORDER BY created_at DESC""", (student["id"],)).fetchall()
    else:
        # Admin student: payments from fee_payments + transactions (exclude mirrors)
        fp_paid = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM fee_payments 
            WHERE student_id = ? AND status = 'approved' 
            AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)""", (student["id"],)).fetchone()[0]
        admin_paid = conn.execute("""SELECT COALESCE(SUM(amount), 0) FROM transactions 
            WHERE student_id = ? AND transaction_type = 'credit' 
            AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%'
            AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)""", (student["id"],)).fetchone()[0]
        total_paid = fp_paid + admin_paid
        
        payments = conn.execute("""SELECT * FROM fee_payments 
            WHERE student_id = ? ORDER BY created_at DESC""", (student["id"],)).fetchall()
    
    conn.close()
    return {
        "is_center_student": is_center_student,
        "center_id": student["center_id"],
        "total_fees": total_fees,
        "total_paid": total_paid,
        "balance": total_fees - total_paid,
        "payments": [dict(p) for p in payments]
    }


@router.get("/my/fee-summary")
async def center_fee_summary(user: dict = Depends(get_current_user)):
    """Get fee summary for center's students (total fees, total paid, pending)."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    placeholders = ",".join(["?"] * len(center_ids))
    total_fees = conn.execute(f"SELECT COALESCE(SUM(total_fees), 0) FROM students WHERE center_id IN ({placeholders})", center_ids).fetchone()[0]
    # Total paid from approved fee_payments
    fp_total = conn.execute(f"SELECT COALESCE(SUM(fp.amount), 0) FROM fee_payments fp JOIN students s ON fp.student_id = s.id WHERE s.center_id IN ({placeholders}) AND fp.status = 'approved' AND (fp.deleted_by_admin = 0 OR fp.deleted_by_admin IS NULL)", center_ids).fetchone()[0]
    # Total paid from admin/center transactions
    txn_total = conn.execute(f"SELECT COALESCE(SUM(t.amount), 0) FROM transactions t JOIN students s ON t.student_id = s.id WHERE s.center_id IN ({placeholders}) AND t.transaction_type = 'credit' AND t.description NOT LIKE 'Online Fee Payment%%' AND t.description NOT LIKE 'Razorpay Payment%%' AND (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL)", center_ids).fetchone()[0]
    total_paid = fp_total + txn_total
    total_pending = max(0, total_fees - total_paid)
    conn.close()
    return {"total_fees": total_fees, "total_paid": total_paid, "total_collected": total_paid, "total_pending": total_pending}


@router.get("/my/student-statement")
async def center_student_statement(phone: str = "", user: dict = Depends(get_current_user)):
    """Get complete payment statement for a center's student by phone number."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    if not phone:
        return {"student": None, "payments": [], "message": "Enter mobile number to search"}
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    placeholders_c = ",".join(["?"] * len(center_ids))
    students = conn.execute(
        f"SELECT s.id, s.name, s.phone, s.email, s.enrollment_no, s.total_fees, u.name as university_name, c.name as course_name "
        f"FROM students s LEFT JOIN universities u ON s.university_id = u.id LEFT JOIN categories c ON s.category_id = c.id "
        f"WHERE s.phone = ? AND s.center_id IN ({placeholders_c}) ORDER BY s.total_fees DESC, s.id DESC",
        [phone] + list(center_ids)
    ).fetchall()
    if not students:
        conn.close()
        return {"student": None, "payments": [], "message": "No student found with this mobile number in your center"}
    student = students[0]
    student_ids = [s["id"] for s in students]
    placeholders_s = ",".join(["?"] * len(student_ids))
    fee_payments = conn.execute(
        f"SELECT fp.id, fp.amount, fp.payment_mode, fp.utr_number, fp.status, fp.created_at, fp.approved_at, fp.remarks, fp.proof_url, "
        f"'online' as source FROM fee_payments fp WHERE fp.student_id IN ({placeholders_s}) AND (fp.deleted_by_admin = 0 OR fp.deleted_by_admin IS NULL) ORDER BY fp.created_at DESC", student_ids
    ).fetchall()
    transactions = conn.execute(
        f"SELECT t.id, t.amount, t.payment_mode, t.utr_number, t.status, t.created_at, NULL as approved_at, t.description as remarks, t.proof_url, "
        f"'admin' as source FROM transactions t WHERE t.student_id IN ({placeholders_s}) AND t.transaction_type = 'credit' "
        f"AND t.description NOT LIKE 'Online Fee Payment%%' AND t.description NOT LIKE 'Razorpay Payment%%' "
        f"AND (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL) ORDER BY t.created_at DESC", student_ids
    ).fetchall()
    all_payments = [dict(p) for p in fee_payments] + [dict(t) for t in transactions]
    all_payments.sort(key=lambda x: x.get("created_at", "") or "", reverse=True)
    total_paid_online = sum(p["amount"] for p in fee_payments if p["status"] == "approved")
    total_paid_admin = sum(t["amount"] for t in transactions)
    total_paid = total_paid_online + total_paid_admin
    total_fees = sum(s["total_fees"] or 0 for s in students)
    conn.close()
    return {
        "student": dict(student),
        "payments": all_payments,
        "summary": {"total_fees": total_fees, "total_paid": total_paid, "pending": max(0, total_fees - total_paid)},
        "message": "Statement found"
    }


@router.get("/my/transactions")
async def list_center_transactions(page: int = 1, limit: int = 50, user: dict = Depends(get_current_user)):
    """List all transactions for center's students."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can access this")
    conn = get_db()
    center = conn.execute("SELECT id FROM centers WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
    center_ids = get_center_and_subcenter_ids(conn, center["id"])
    placeholders = ",".join(["?"] * len(center_ids))
    query = f"""SELECT t.*, s.name as student_name, s.phone as student_phone, s.enrollment_no
                FROM transactions t JOIN students s ON t.student_id = s.id
                WHERE s.center_id IN ({placeholders}) AND (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL)"""
    params = list(center_ids)
    total = conn.execute(f"SELECT COUNT(*) FROM ({query})", params).fetchone()[0]
    query += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"transactions": [dict(r) for r in rows], "total": total}


@router.post("/student/upload-proof")
async def student_upload_payment_proof(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Student uploads payment proof image."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    from app.utils.uploads import get_upload_dir
    upload_dir = get_upload_dir()
    proof_dir = os.path.join(upload_dir, "payment_proofs")
    os.makedirs(proof_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename or "proof.png")[1] or ".png"
    filename = f"proof_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(proof_dir, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    proof_url = f"/uploads/payment_proofs/{filename}"
    return {"proof_url": proof_url, "message": "Proof uploaded successfully"}
