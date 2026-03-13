from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.utils.auth import require_admin, get_current_user, hash_password, require_only_admin
import json
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
    """Get center_id + all sub-center IDs under it."""
    ids = [center_id]
    sub_centers = conn.execute("SELECT id FROM centers WHERE parent_center_id = ?", (center_id,)).fetchall()
    for sc in sub_centers:
        ids.append(sc["id"])
        # Recursively get sub-sub-centers (if any deeper nesting)
        deeper = conn.execute("SELECT id FROM centers WHERE parent_center_id = ?", (sc["id"],)).fetchall()
        for d in deeper:
            ids.append(d["id"])
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
async def change_center_password(center_id: int, data: dict, user: dict = Depends(require_admin)):
    """Admin changes a center's login password."""
    new_password = data.get("password", "")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    conn = get_db()
    center = conn.execute("SELECT * FROM centers WHERE id = ?", (center_id,)).fetchone()
    if not center:
        conn.close()
        raise HTTPException(status_code=404, detail="Center not found")
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
    search: Optional[str] = None,
    status: Optional[str] = None,
    university_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """List students for a center (and optionally its sub-centers)."""
    conn = get_db()
    
    if include_sub:
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

    # Count
    count_q = query.replace(
        f"SELECT s.*, u.name as university_name, c.name as category_name, \n                br.name as branch_name, ct.name as center_name",
        "SELECT COUNT(*)"
    )
    total = conn.execute(count_q, params).fetchone()[0]

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
    """Center adds a student under itself."""
    if user.get("role") != "center":
        raise HTTPException(status_code=403, detail="Only center users can use this endpoint")
    
    center = get_current_center(user)
    conn = get_db()
    
    # Check duplicate phone
    phone = data.get("phone")
    if phone:
        existing = conn.execute("SELECT id FROM students WHERE phone = ?", (phone,)).fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="Is mobile number se ek student pehle se registered hai.")
    
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
    
    # Generate enrollment number with retry loop to avoid race condition duplicates
    import sqlite3
    fields = ["enrollment_no", "name", "email", "phone", "university_id", "category_id", "branch_id",
              "session_name", "admission_type", "father_name", "mother_name", "date_of_birth", "gender",
              "current_address", "current_city", "current_state", "current_pincode",
              "aadhar_no", "status", "center_id", "admission_source"]
    
    for _attempt in range(5):
        max_row = conn.execute("SELECT MAX(CAST(SUBSTR(enrollment_no, 4) AS INTEGER)) FROM students").fetchone()
        next_num = (max_row[0] or 1000) + 1
        enrollment_no = f"EDU{str(next_num).zfill(6)}"
        
        values = [
            enrollment_no, data.get("name", ""), data.get("email", ""), phone,
            data.get("university_id"), data.get("category_id"), data.get("branch_id"),
            data.get("session_name"), data.get("admission_type", "FRESH_ADMISSION"),
            data.get("father_name"), data.get("mother_name"), data.get("date_of_birth"), data.get("gender"),
            data.get("current_address"), data.get("current_city"), data.get("current_state"), data.get("current_pincode"),
            data.get("aadhar_no"), "active", actual_center_id, admission_source
        ]
        
        placeholders = ",".join(["?"] * len(fields))
        field_names = ",".join(fields)
        try:
            cursor = conn.execute(f"INSERT INTO students ({field_names}) VALUES ({placeholders})", values)
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
    return {"id": sid, "enrollment_no": enrollment_no, "message": "Student added successfully"}


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
