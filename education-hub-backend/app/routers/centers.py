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
    slab_level: str = "admin_to_center"

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


def auto_create_commission_ledger(conn, student_id: int, center_id: int, university_id: int = None):
    """Auto-create commission ledger entries based on hierarchy.
    
    When a student is admitted:
    - If by sub-center: Center earns from sub-center + Admin earns from sub-center
    - If by center: Admin earns from center
    """
    center = conn.execute("SELECT * FROM centers WHERE id = ?", (center_id,)).fetchone()
    if not center:
        return
    
    center_level = center["level"]
    parent_center_id = center["parent_center_id"]
    
    if center_level == "sub_center" and parent_center_id:
        # Sub-center admitted student
        # 1. Parent center earns commission from sub-center
        center_slab = conn.execute(
            """SELECT commission_amount FROM commission_slabs 
               WHERE (center_id = ? OR (center_id IS NULL AND slab_level = 'center_to_subcenter'))
               AND university_id = ? ORDER BY center_id DESC LIMIT 1""",
            (parent_center_id, university_id)
        ).fetchone() if university_id else None
        
        if center_slab and center_slab["commission_amount"] > 0:
            conn.execute(
                """INSERT INTO commission_ledger 
                   (student_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, amount, university_id, notes)
                   VALUES (?, 'sub_center', ?, 'center', ?, ?, ?, 'Auto: Sub-center to Center commission')""",
                (student_id, center_id, parent_center_id, center_slab["commission_amount"], university_id)
            )
        
        # 2. Admin earns commission from sub-center
        admin_slab = conn.execute(
            """SELECT commission_amount FROM commission_slabs 
               WHERE center_id IS NULL AND slab_level = 'admin_to_subcenter'
               AND university_id = ? LIMIT 1""",
            (university_id,)
        ).fetchone() if university_id else None
        
        if admin_slab and admin_slab["commission_amount"] > 0:
            conn.execute(
                """INSERT INTO commission_ledger 
                   (student_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, amount, university_id, notes)
                   VALUES (?, 'sub_center', ?, 'admin', NULL, ?, ?, 'Auto: Sub-center to Admin commission')""",
                (student_id, center_id, admin_slab["commission_amount"], university_id)
            )
    
    elif center_level == "center":
        # Center admitted student directly
        # Admin earns commission from center
        admin_slab = conn.execute(
            """SELECT commission_amount FROM commission_slabs 
               WHERE center_id IS NULL AND slab_level = 'admin_to_center'
               AND university_id = ? LIMIT 1""",
            (university_id,)
        ).fetchone() if university_id else None
        
        if admin_slab and admin_slab["commission_amount"] > 0:
            conn.execute(
                """INSERT INTO commission_ledger 
                   (student_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, amount, university_id, notes)
                   VALUES (?, 'center', ?, 'admin', NULL, ?, ?, 'Auto: Center to Admin commission')""",
                (student_id, center_id, admin_slab["commission_amount"], university_id)
            )


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
    # NOTE: Do NOT commit yet - wait until student record is also created to avoid orphaned users
    
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
        # Rollback the uncommitted user INSERT to avoid orphaned user accounts
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail="Could not generate unique enrollment number")
    
    # Handle total_fees if provided
    if data.get("total_fees"):
        conn.execute("UPDATE students SET total_fees = ? WHERE id = ?", (float(data["total_fees"]), sid))
    
    # Auto-create commission ledger entries based on hierarchy
    university_id = data.get("university_id")
    auto_create_commission_ledger(conn, sid, actual_center_id, university_id)
    
    # Auto-create student deal record (fees default to 0; center/admin fill later)
    total_fees = float(data.get("total_fees", 0) or 0)
    try:
        conn.execute(
            "INSERT INTO student_deals (student_id, sub_center_fee, center_deal, admin_deal, notes) VALUES (?, ?, 0, 0, ?)",
            (sid, total_fees, f"Auto-created on admission by center")
        )
    except Exception:
        pass  # deal may already exist or table not ready
    
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
    slab_level = data.slab_level
    if role == "center":
        center = get_current_center(user)
        center_id = center["id"]  # Center sets slabs for its sub-centers
        slab_level = "center_to_subcenter"  # Center can only set center→sub-center rates
    
    cursor = conn.execute(
        "INSERT INTO commission_slabs (university_id, center_id, min_admissions, max_admissions, commission_amount, slab_level) VALUES (?, ?, ?, ?, ?, ?)",
        (data.university_id, center_id, data.min_admissions, data.max_admissions, data.commission_amount, slab_level)
    )
    conn.commit()
    conn.close()
    return {"id": cursor.lastrowid, "message": "Commission slab created"}


@router.put("/commission/slabs/{slab_id}")
async def update_commission_slab(slab_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Update a commission slab."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    conn = get_db()
    update_fields = []
    values = []
    for field in ["min_admissions", "max_admissions", "commission_amount", "slab_level"]:
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
    
    # Auto-create commission ledger entries based on hierarchy
    try:
        student = conn.execute("SELECT * FROM students WHERE id = ?", (payment["student_id"],)).fetchone()
        if student and student["center_id"]:
            auto_create_commission_ledger(conn, payment["student_id"], student["center_id"], student["university_id"])
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


# ══════════════════════════════════════════════════════════════════
#  COMMISSION LEDGER — Hierarchy-aware commission tracking
# ══════════════════════════════════════════════════════════════════

@router.get("/commission/ledger")
async def list_commission_ledger(
    view: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """List commission ledger entries.
    Admin sees all. Center sees entries where it earns or owes.
    view param: 'earnings' (what I earn), 'payables' (what I owe), or None (all).
    """
    conn = get_db()
    role = user.get("role", "")
    
    query = """SELECT cl.*,
               s.name as student_name, s.enrollment_no, s.phone as student_phone,
               u.name as university_name,
               fc.name as from_center_name, fc.level as from_center_level,
               tc.name as to_center_name
               FROM commission_ledger cl
               LEFT JOIN students s ON cl.student_id = s.id
               LEFT JOIN universities u ON cl.university_id = u.id
               LEFT JOIN centers fc ON cl.from_entity_id = fc.id
               LEFT JOIN centers tc ON cl.to_entity_id = tc.id
               WHERE 1=1"""
    params = []
    
    if role == "center":
        center = get_current_center(user)
        cid = center["id"]
        all_ids = get_center_and_subcenter_ids(conn, cid)
        
        if view == "earnings":
            # What this center earns (from sub-centers)
            query += " AND cl.to_entity_type = 'center' AND cl.to_entity_id = ?"
            params.append(cid)
        elif view == "payables":
            # What this center/sub-centers owe to admin and parent
            placeholders = ",".join(["?"] * len(all_ids))
            query += f" AND cl.from_entity_id IN ({placeholders})"
            params.extend(all_ids)
        else:
            # All related entries
            placeholders = ",".join(["?"] * len(all_ids))
            query += f" AND (cl.from_entity_id IN ({placeholders}) OR (cl.to_entity_type = 'center' AND cl.to_entity_id = ?))"
            params.extend(all_ids)
            params.append(cid)
    else:
        # Admin: optionally filter by view
        if view == "earnings":
            query += " AND cl.to_entity_type = 'admin'"
    
    if status:
        query += " AND cl.status = ?"
        params.append(status)
    
    query += " ORDER BY cl.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"ledger": [dict(r) for r in rows]}


@router.get("/commission/ledger/summary")
async def commission_ledger_summary(user: dict = Depends(get_current_user)):
    """Get commission hierarchy summary for dashboard.
    Shows total earnings, payables, paid, pending for the logged-in entity.
    """
    conn = get_db()
    role = user.get("role", "")
    
    if role == "center":
        center = get_current_center(user)
        cid = center["id"]
        level = center["level"]
        parent_id = center["parent_center_id"]
        
        # Earnings: what this center earns from sub-centers
        earnings_total = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'center' AND to_entity_id = ?",
            (cid,)
        ).fetchone()[0]
        earnings_paid = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'center' AND to_entity_id = ? AND status = 'paid'",
            (cid,)
        ).fetchone()[0]
        earnings_pending = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'center' AND to_entity_id = ? AND status = 'pending'",
            (cid,)
        ).fetchone()[0]
        
        # Payables: what this center owes to admin
        payable_to_admin = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'admin'",
            (cid,)
        ).fetchone()[0]
        payable_to_admin_paid = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'admin' AND status = 'paid'",
            (cid,)
        ).fetchone()[0]
        payable_to_admin_pending = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'admin' AND status = 'pending'",
            (cid,)
        ).fetchone()[0]
        
        # Payables to parent center (if sub-center)
        payable_to_center = 0
        payable_to_center_paid = 0
        payable_to_center_pending = 0
        if level == "sub_center" and parent_id:
            payable_to_center = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'center' AND to_entity_id = ?",
                (cid, parent_id)
            ).fetchone()[0]
            payable_to_center_paid = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'center' AND to_entity_id = ? AND status = 'paid'",
                (cid, parent_id)
            ).fetchone()[0]
            payable_to_center_pending = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'center' AND to_entity_id = ? AND status = 'pending'",
                (cid, parent_id)
            ).fetchone()[0]
        
        # Sub-center commissions flowing through (what sub-centers owe admin)
        all_ids = get_center_and_subcenter_ids(conn, cid)
        sub_ids = [sid for sid in all_ids if sid != cid]
        subcenter_to_admin = 0
        if sub_ids:
            placeholders = ",".join(["?"] * len(sub_ids))
            subcenter_to_admin = conn.execute(
                f"SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id IN ({placeholders}) AND to_entity_type = 'admin'",
                sub_ids
            ).fetchone()[0]
        
        conn.close()
        return {
            "role": "center",
            "level": level,
            "center_name": center["name"],
            "earnings_from_subcenters": {"total": earnings_total, "paid": earnings_paid, "pending": earnings_pending},
            "payable_to_admin": {"total": payable_to_admin, "paid": payable_to_admin_paid, "pending": payable_to_admin_pending},
            "payable_to_parent_center": {"total": payable_to_center, "paid": payable_to_center_paid, "pending": payable_to_center_pending},
            "subcenter_admin_commission": subcenter_to_admin,
        }
    else:
        # Admin summary
        total_from_centers = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'admin' AND from_entity_type = 'center'"
        ).fetchone()[0]
        total_from_subcenters = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'admin' AND from_entity_type = 'sub_center'"
        ).fetchone()[0]
        total_paid = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'admin' AND status = 'paid'"
        ).fetchone()[0]
        total_pending = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'admin' AND status = 'pending'"
        ).fetchone()[0]
        
        # Center-to-center flows
        center_to_center = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'center'"
        ).fetchone()[0]
        
        conn.close()
        return {
            "role": "admin",
            "admin_earnings": {
                "total": total_from_centers + total_from_subcenters,
                "from_centers": total_from_centers,
                "from_subcenters": total_from_subcenters,
                "paid": total_paid,
                "pending": total_pending,
            },
            "center_to_center_commission": center_to_center,
        }


@router.post("/commission/ledger")
async def add_commission_ledger(data: dict, user: dict = Depends(get_current_user)):
    """Manually add a commission ledger entry."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO commission_ledger 
           (student_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, amount, university_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.get("student_id"), data.get("from_entity_type", "center"), data.get("from_entity_id"),
         data.get("to_entity_type", "admin"), data.get("to_entity_id"),
         data.get("amount", 0), data.get("university_id"), data.get("notes", "Manual entry"))
    )
    conn.commit()
    conn.close()
    return {"id": cursor.lastrowid, "message": "Commission ledger entry added"}


@router.put("/commission/ledger/{entry_id}/pay")
async def mark_ledger_paid(entry_id: int, user: dict = Depends(get_current_user)):
    """Mark a commission ledger entry as paid."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    conn = get_db()
    conn.execute("UPDATE commission_ledger SET status = 'paid', paid_date = ? WHERE id = ?",
                 (datetime.now().isoformat(), entry_id))
    conn.commit()
    conn.close()
    return {"message": "Commission marked as paid"}


@router.delete("/commission/ledger/{entry_id}")
async def delete_ledger_entry(entry_id: int, user: dict = Depends(require_admin)):
    """Delete a commission ledger entry (admin only)."""
    conn = get_db()
    conn.execute("DELETE FROM commission_ledger WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return {"message": "Commission ledger entry deleted"}


@router.get("/commission/hierarchy-report")
async def commission_hierarchy_report(user: dict = Depends(get_current_user)):
    """Full hierarchy commission report for admin.
    Shows each center with its sub-centers and commission flows.
    """
    role = user.get("role", "")
    conn = get_db()
    
    if role == "center":
        center = get_current_center(user)
        cid = center["id"]
        
        # Get sub-centers
        sub_centers = conn.execute(
            """SELECT c.id, c.name, c.mobile, c.owner_name, c.level,
                      (SELECT COUNT(*) FROM students WHERE center_id = c.id) as student_count,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'center' AND to_entity_id = ?) as commission_to_center,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'admin') as commission_to_admin,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'center' AND to_entity_id = ? AND status = 'paid') as paid_to_center,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'admin' AND status = 'paid') as paid_to_admin
               FROM centers c WHERE c.parent_center_id = ?
               ORDER BY c.name""",
            (cid, cid, cid)
        ).fetchall()
        
        # Own stats
        own_students = conn.execute("SELECT COUNT(*) FROM students WHERE center_id = ?", (cid,)).fetchone()[0]
        own_to_admin = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'admin'",
            (cid,)
        ).fetchone()[0]
        own_to_admin_paid = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = ? AND to_entity_type = 'admin' AND status = 'paid'",
            (cid,)
        ).fetchone()[0]
        
        conn.close()
        return {
            "center": {"id": cid, "name": center["name"], "student_count": own_students, "commission_to_admin": own_to_admin, "paid_to_admin": own_to_admin_paid},
            "sub_centers": [dict(r) for r in sub_centers],
        }
    else:
        # Admin: show all centers with their hierarchy
        centers = conn.execute(
            """SELECT c.id, c.name, c.mobile, c.owner_name, c.level, c.parent_center_id,
                      pc.name as parent_center_name,
                      (SELECT COUNT(*) FROM students WHERE center_id = c.id) as student_count,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'admin') as commission_to_admin,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'admin' AND status = 'paid') as paid_to_admin,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'admin' AND status = 'pending') as pending_to_admin,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE from_entity_id = c.id AND to_entity_type = 'center') as commission_to_center,
                      (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE to_entity_type = 'center' AND to_entity_id = c.id) as earned_from_subcenters
               FROM centers c
               LEFT JOIN centers pc ON c.parent_center_id = pc.id
               ORDER BY c.level, c.name"""
        ).fetchall()
        
        conn.close()
        return {"centers": [dict(r) for r in centers]}


@router.post("/commission/ledger/generate")
async def generate_commission_for_student(data: dict, user: dict = Depends(get_current_user)):
    """Manually trigger commission generation for a student (admin use)."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_id = data.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")
    
    conn = get_db()
    student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    
    center_id = student["center_id"]
    university_id = student["university_id"]
    
    if not center_id:
        conn.close()
        raise HTTPException(status_code=400, detail="Student is not assigned to any center")
    
    # Check if already has ledger entries
    existing = conn.execute("SELECT COUNT(*) FROM commission_ledger WHERE student_id = ?", (student_id,)).fetchone()[0]
    if existing > 0:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Student already has {existing} commission entries. Delete them first to regenerate.")
    
    auto_create_commission_ledger(conn, student_id, center_id, university_id)
    conn.commit()
    conn.close()
    return {"message": "Commission entries generated successfully"}


@router.post("/commission/ledger/bulk-pay")
async def bulk_mark_paid(data: dict, user: dict = Depends(get_current_user)):
    """Mark multiple commission ledger entries as paid."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    
    conn = get_db()
    placeholders = ",".join(["?"] * len(ids))
    conn.execute(
        f"UPDATE commission_ledger SET status = 'paid', paid_date = ? WHERE id IN ({placeholders})",
        [datetime.now().isoformat()] + ids
    )
    conn.commit()
    conn.close()
    return {"message": f"{len(ids)} entries marked as paid"}


# ══════════════════════════════════════════════════════════════════
# Deal-based Fee Tracking (3-tier: Sub-center fee → Center deal → Admin deal)
# ══════════════════════════════════════════════════════════════════

class StudentDealCreate(BaseModel):
    student_id: int
    sub_center_fee: float = 0
    center_deal: float = 0
    admin_deal: float = 0
    notes: Optional[str] = None

class StudentDealUpdate(BaseModel):
    sub_center_fee: Optional[float] = None
    center_deal: Optional[float] = None
    admin_deal: Optional[float] = None
    notes: Optional[str] = None

class DealPaymentCreate(BaseModel):
    student_id: int
    from_entity_type: str  # 'sub_center', 'center'
    from_entity_id: int
    to_entity_type: str    # 'center', 'admin'
    to_entity_id: Optional[int] = None
    amount: float
    payment_mode: str = "cash"
    utr_number: Optional[str] = None
    notes: Optional[str] = None


@router.get("/deals")
async def list_student_deals(
    user: dict = Depends(get_current_user),
    search: str = "",
    center_id: Optional[int] = None,
):
    """List all student deals. Admin sees all, center sees their own students."""
    role = user.get("role", "")
    conn = get_db()

    if role in ("admin", "super_admin", "branch_admin"):
        query = """
            SELECT sd.*, s.name as student_name, s.phone as student_phone,
                   s.enrollment_no, s.center_id,
                   c.name as center_name, c.level as center_level,
                   pc.name as parent_center_name, c.parent_center_id,
                   u.name as university_name, cat.name as course_name
            FROM student_deals sd
            JOIN students s ON sd.student_id = s.id
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN centers pc ON c.parent_center_id = pc.id
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN categories cat ON s.category_id = cat.id
            WHERE 1=1
        """
        params: list = []
        if search:
            query += " AND (s.name LIKE ? OR s.phone LIKE ? OR s.enrollment_no LIKE ?)"
            params += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if center_id:
            # Get this center + its sub-centers
            all_ids = get_center_and_subcenter_ids(conn, center_id)
            placeholders = ",".join(["?"] * len(all_ids))
            query += f" AND s.center_id IN ({placeholders})"
            params += all_ids
        query += " ORDER BY sd.updated_at DESC"
        deals = [dict(r) for r in conn.execute(query, params).fetchall()]
    elif role == "center":
        center = get_current_center(user)
        cid = center["id"]
        all_ids = get_center_and_subcenter_ids(conn, cid)
        placeholders = ",".join(["?"] * len(all_ids))
        query = f"""
            SELECT sd.*, s.name as student_name, s.phone as student_phone,
                   s.enrollment_no, s.center_id,
                   c.name as center_name, c.level as center_level,
                   pc.name as parent_center_name, c.parent_center_id,
                   u.name as university_name, cat.name as course_name
            FROM student_deals sd
            JOIN students s ON sd.student_id = s.id
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN centers pc ON c.parent_center_id = pc.id
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN categories cat ON s.category_id = cat.id
            WHERE s.center_id IN ({placeholders})
        """
        params = all_ids
        if search:
            query += " AND (s.name LIKE ? OR s.phone LIKE ? OR s.enrollment_no LIKE ?)"
            params += [f"%{search}%", f"%{search}%", f"%{search}%"]
        query += " ORDER BY sd.updated_at DESC"
        deals = [dict(r) for r in conn.execute(query, params).fetchall()]
        # Visibility: center sees sub_center_fee + center_deal, but NOT admin_deal
        # Sub-center sees only sub_center_fee
        if center["level"] == "sub_center":
            for d in deals:
                d.pop("admin_deal", None)
                d.pop("center_deal", None)
        else:
            for d in deals:
                d.pop("admin_deal", None)
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    conn.close()
    return {"deals": deals}


@router.post("/deals")
async def create_student_deal(data: StudentDealCreate, user: dict = Depends(require_admin)):
    """Admin creates/updates a deal for a student."""
    conn = get_db()
    existing = conn.execute("SELECT id FROM student_deals WHERE student_id = ?", (data.student_id,)).fetchone()
    if existing:
        conn.execute(
            """UPDATE student_deals SET sub_center_fee = ?, center_deal = ?, admin_deal = ?, notes = ?,
               updated_at = CURRENT_TIMESTAMP WHERE student_id = ?""",
            (data.sub_center_fee, data.center_deal, data.admin_deal, data.notes, data.student_id)
        )
    else:
        conn.execute(
            "INSERT INTO student_deals (student_id, sub_center_fee, center_deal, admin_deal, notes) VALUES (?, ?, ?, ?, ?)",
            (data.student_id, data.sub_center_fee, data.center_deal, data.admin_deal, data.notes)
        )
    conn.commit()
    conn.close()
    return {"message": "Deal saved successfully"}


@router.put("/deals/{deal_id}")
async def update_student_deal(deal_id: int, data: StudentDealUpdate, user: dict = Depends(require_admin)):
    """Admin updates an existing deal."""
    conn = get_db()
    deal = conn.execute("SELECT * FROM student_deals WHERE id = ?", (deal_id,)).fetchone()
    if not deal:
        conn.close()
        raise HTTPException(status_code=404, detail="Deal not found")
    
    updates = []
    params: list = []
    if data.sub_center_fee is not None:
        updates.append("sub_center_fee = ?")
        params.append(data.sub_center_fee)
    if data.center_deal is not None:
        updates.append("center_deal = ?")
        params.append(data.center_deal)
    if data.admin_deal is not None:
        updates.append("admin_deal = ?")
        params.append(data.admin_deal)
    if data.notes is not None:
        updates.append("notes = ?")
        params.append(data.notes)
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(deal_id)
        conn.execute(f"UPDATE student_deals SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
    conn.close()
    return {"message": "Deal updated successfully"}


@router.delete("/deals/{deal_id}")
async def delete_student_deal(deal_id: int, user: dict = Depends(require_admin)):
    """Admin deletes a student deal."""
    conn = get_db()
    conn.execute("DELETE FROM student_deals WHERE id = ?", (deal_id,))
    conn.commit()
    conn.close()
    return {"message": "Deal deleted"}


@router.put("/deals/{deal_id}/center-update")
async def center_update_deal(deal_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Center updates their own deal fields (sub_center_fee, center_deal). Cannot set admin_deal."""
    role = user.get("role", "")
    if role != "center":
        raise HTTPException(status_code=403, detail="Only centers can use this endpoint")
    center = get_current_center(user)
    cid = center["id"]
    conn = get_db()
    # Verify deal belongs to this center's students
    deal = conn.execute("""
        SELECT sd.*, s.center_id FROM student_deals sd
        JOIN students s ON sd.student_id = s.id
        WHERE sd.id = ?
    """, (deal_id,)).fetchone()
    if not deal:
        conn.close()
        raise HTTPException(status_code=404, detail="Deal not found")
    all_ids = get_center_and_subcenter_ids(conn, cid)
    if deal["center_id"] not in all_ids:
        conn.close()
        raise HTTPException(status_code=403, detail="Not your student's deal")
    updates = []
    params: list = []
    if "sub_center_fee" in data:
        updates.append("sub_center_fee = ?")
        params.append(float(data["sub_center_fee"]))
    if "center_deal" in data:
        updates.append("center_deal = ?")
        params.append(float(data["center_deal"]))
    if "notes" in data:
        updates.append("notes = ?")
        params.append(data["notes"])
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(deal_id)
        conn.execute(f"UPDATE student_deals SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
    conn.close()
    return {"message": "Deal updated"}


@router.get("/deals/summary")
async def deal_summary(user: dict = Depends(get_current_user)):
    """Get deal summary with profit calculations and payment tracking."""
    role = user.get("role", "")
    conn = get_db()

    if role in ("admin", "super_admin", "branch_admin"):
        # Admin sees everything
        deals = conn.execute("""
            SELECT sd.*, s.name as student_name, s.center_id,
                   c.name as center_name, c.level as center_level, c.parent_center_id,
                   pc.name as parent_center_name
            FROM student_deals sd
            JOIN students s ON sd.student_id = s.id
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN centers pc ON c.parent_center_id = pc.id
        """).fetchall()
        deals = [dict(d) for d in deals]

        total_sub_center_fee = sum(d["sub_center_fee"] or 0 for d in deals)
        total_center_deal = sum(d["center_deal"] or 0 for d in deals)
        total_admin_deal = sum(d["admin_deal"] or 0 for d in deals)

        # Payment tracking: what has been paid
        admin_received = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM deal_payments WHERE to_entity_type = 'admin' AND status = 'paid'"
        ).fetchone()[0]
        admin_pending = total_admin_deal - admin_received

        # Per-center breakdown
        center_breakdown = {}
        for d in deals:
            cid = d["center_id"]
            if cid not in center_breakdown:
                center_breakdown[cid] = {
                    "center_id": cid,
                    "center_name": d["center_name"] or "Direct",
                    "center_level": d["center_level"] or "direct",
                    "parent_center_name": d["parent_center_name"],
                    "student_count": 0,
                    "total_sub_center_fee": 0,
                    "total_center_deal": 0,
                    "total_admin_deal": 0,
                }
            center_breakdown[cid]["student_count"] += 1
            center_breakdown[cid]["total_sub_center_fee"] += d["sub_center_fee"] or 0
            center_breakdown[cid]["total_center_deal"] += d["center_deal"] or 0
            center_breakdown[cid]["total_admin_deal"] += d["admin_deal"] or 0

        conn.close()
        return {
            "total_students": len(deals),
            "total_sub_center_fee": total_sub_center_fee,
            "total_center_deal": total_center_deal,
            "total_admin_deal": total_admin_deal,
            "admin_received": admin_received,
            "admin_pending": admin_pending,
            "sub_center_profit": total_sub_center_fee - total_center_deal,
            "center_profit": total_center_deal - total_admin_deal,
            "center_breakdown": list(center_breakdown.values()),
        }

    elif role == "center":
        center = get_current_center(user)
        cid = center["id"]
        all_ids = get_center_and_subcenter_ids(conn, cid)
        placeholders = ",".join(["?"] * len(all_ids))

        deals = conn.execute(f"""
            SELECT sd.*, s.name as student_name, s.center_id,
                   c.name as center_name, c.level as center_level
            FROM student_deals sd
            JOIN students s ON sd.student_id = s.id
            LEFT JOIN centers c ON s.center_id = c.id
            WHERE s.center_id IN ({placeholders})
        """, all_ids).fetchall()
        deals = [dict(d) for d in deals]

        total_sub_center_fee = sum(d["sub_center_fee"] or 0 for d in deals)
        total_center_deal = sum(d["center_deal"] or 0 for d in deals)

        if center["level"] == "sub_center":
            # Sub-center only sees sub_center_fee
            conn.close()
            return {
                "total_students": len(deals),
                "total_sub_center_fee": total_sub_center_fee,
                "level": "sub_center",
                "center_name": center["name"],
            }
        else:
            # Center sees sub_center_fee + center_deal
            center_received = conn.execute(
                "SELECT COALESCE(SUM(amount), 0) FROM deal_payments WHERE to_entity_type = 'center' AND to_entity_id = ? AND status = 'paid'",
                (cid,)
            ).fetchone()[0]
            conn.close()
            return {
                "total_students": len(deals),
                "total_sub_center_fee": total_sub_center_fee,
                "total_center_deal": total_center_deal,
                "center_received": center_received,
                "center_pending": total_center_deal - center_received,
                "level": "center",
                "center_name": center["name"],
            }
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/deals/students-without-deals")
async def students_without_deals(
    user: dict = Depends(require_admin),
    search: str = "",
    center_id: Optional[int] = None,
):
    """List center students that don't have a deal entry yet."""
    conn = get_db()
    query = """
        SELECT s.id, s.name, s.phone, s.enrollment_no, s.center_id,
               c.name as center_name, c.level as center_level,
               u.name as university_name, cat.name as course_name
        FROM students s
        LEFT JOIN centers c ON s.center_id = c.id
        LEFT JOIN universities u ON s.university_id = u.id
        LEFT JOIN categories cat ON s.category_id = cat.id
        WHERE s.center_id IS NOT NULL
          AND s.id NOT IN (SELECT student_id FROM student_deals)
    """
    params: list = []
    if search:
        query += " AND (s.name LIKE ? OR s.phone LIKE ? OR s.enrollment_no LIKE ?)"
        params += [f"%{search}%", f"%{search}%", f"%{search}%"]
    if center_id:
        all_ids = get_center_and_subcenter_ids(conn, center_id)
        ph = ",".join(["?"] * len(all_ids))
        query += f" AND s.center_id IN ({ph})"
        params += all_ids
    query += " ORDER BY s.name LIMIT 50"
    students = [dict(r) for r in conn.execute(query, params).fetchall()]
    conn.close()
    return {"students": students}


@router.post("/deals/bulk")
async def bulk_create_deals(data: dict, user: dict = Depends(require_admin)):
    """Bulk create deals for multiple students with same amounts."""
    student_ids = data.get("student_ids", [])
    sub_center_fee = data.get("sub_center_fee", 0)
    center_deal = data.get("center_deal", 0)
    admin_deal = data.get("admin_deal", 0)
    notes = data.get("notes", "")

    if not student_ids:
        raise HTTPException(status_code=400, detail="No student IDs provided")

    conn = get_db()
    created = 0
    updated = 0
    for sid in student_ids:
        existing = conn.execute("SELECT id FROM student_deals WHERE student_id = ?", (sid,)).fetchone()
        if existing:
            conn.execute(
                """UPDATE student_deals SET sub_center_fee = ?, center_deal = ?, admin_deal = ?, notes = ?,
                   updated_at = CURRENT_TIMESTAMP WHERE student_id = ?""",
                (sub_center_fee, center_deal, admin_deal, notes, sid)
            )
            updated += 1
        else:
            conn.execute(
                "INSERT INTO student_deals (student_id, sub_center_fee, center_deal, admin_deal, notes) VALUES (?, ?, ?, ?, ?)",
                (sid, sub_center_fee, center_deal, admin_deal, notes)
            )
            created += 1
    conn.commit()
    conn.close()
    return {"message": f"Created {created}, Updated {updated} deals"}


# Deal payments (track payments between entities)
@router.get("/deals/payments")
async def list_deal_payments(user: dict = Depends(get_current_user)):
    """List deal payments. Admin sees all, center sees relevant ones."""
    role = user.get("role", "")
    conn = get_db()

    if role in ("admin", "super_admin", "branch_admin"):
        payments = conn.execute("""
            SELECT dp.*, s.name as student_name, s.enrollment_no,
                   fc.name as from_center_name, tc.name as to_center_name
            FROM deal_payments dp
            JOIN students s ON dp.student_id = s.id
            LEFT JOIN centers fc ON dp.from_entity_id = fc.id AND dp.from_entity_type IN ('center', 'sub_center')
            LEFT JOIN centers tc ON dp.to_entity_id = tc.id AND dp.to_entity_type = 'center'
            ORDER BY dp.created_at DESC
        """).fetchall()
    elif role == "center":
        center = get_current_center(user)
        cid = center["id"]
        payments = conn.execute("""
            SELECT dp.*, s.name as student_name, s.enrollment_no,
                   fc.name as from_center_name, tc.name as to_center_name
            FROM deal_payments dp
            JOIN students s ON dp.student_id = s.id
            LEFT JOIN centers fc ON dp.from_entity_id = fc.id AND dp.from_entity_type IN ('center', 'sub_center')
            LEFT JOIN centers tc ON dp.to_entity_id = tc.id AND dp.to_entity_type = 'center'
            WHERE dp.from_entity_id = ? OR dp.to_entity_id = ?
            ORDER BY dp.created_at DESC
        """, (cid, cid)).fetchall()
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    conn.close()
    return {"payments": [dict(p) for p in payments]}


@router.post("/deals/payments")
async def create_deal_payment(data: DealPaymentCreate, user: dict = Depends(require_admin)):
    """Admin records a payment between entities."""
    conn = get_db()
    conn.execute(
        """INSERT INTO deal_payments (student_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id,
           amount, payment_mode, utr_number, notes, status, paid_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP)""",
        (data.student_id, data.from_entity_type, data.from_entity_id, data.to_entity_type, data.to_entity_id,
         data.amount, data.payment_mode, data.utr_number, data.notes)
    )
    conn.commit()
    conn.close()
    return {"message": "Payment recorded"}


@router.delete("/deals/payments/{payment_id}")
async def delete_deal_payment(payment_id: int, user: dict = Depends(require_admin)):
    """Admin deletes a deal payment."""
    conn = get_db()
    conn.execute("DELETE FROM deal_payments WHERE id = ?", (payment_id,))
    conn.commit()
    conn.close()
    return {"message": "Payment deleted"}
