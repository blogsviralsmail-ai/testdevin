"""Fees Chain Management System
Sub-center → Center → Admin → University payment chain with invoices & receipts.
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.utils.auth import get_current_user, require_admin
from app.routers.centers import get_current_center, get_center_and_subcenter_ids
import os, uuid, json, sqlite3
from datetime import datetime

router = APIRouter(prefix="/api/fees-chain", tags=["Fees Chain"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads")


@router.get("/student-lookup")
async def lookup_student_for_fees(phone: str = "", user: dict = Depends(get_current_user)):
    """Lookup student by phone for fees chain entry."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if not phone or len(phone) < 3:
        return {"students": []}
    conn = get_db()
    rows = conn.execute(
        """SELECT s.id, s.name, s.phone, s.email, u.name as university_name, c.name as course_name,
                  s.total_fees, s.center_id, ct.name as center_name
           FROM students s
           LEFT JOIN universities u ON s.university_id = u.id
           LEFT JOIN categories c ON s.category_id = c.id
           LEFT JOIN centers ct ON s.center_id = ct.id
           WHERE s.phone LIKE ? LIMIT 10""",
        (f"%{phone}%",)
    ).fetchall()
    conn.close()
    return {"students": [dict(r) for r in rows]}


# ── Pydantic Models ──────────────────────────────────────────────

class LevelPaymentCreate(BaseModel):
    from_level: str  # sub_center, center, admin
    from_id: int
    to_level: str    # center, admin, university
    to_id: Optional[int] = None
    amount: float
    payment_mode: str = "cash"
    utr_number: Optional[str] = None
    notes: Optional[str] = None
    student_phone: Optional[str] = None
    student_name: Optional[str] = None
    student_university: Optional[str] = None
    student_course: Optional[str] = None

class LevelPaymentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# ── Helper: Generate invoice number ──────────────────────────────

def _insert_invoice_with_retry(conn, prefix="INV", from_level="", from_id=0, to_level="", to_id=None, amount=0, items="[]", payment_id=0):
    """Generate unique invoice number and INSERT in one atomic retry loop."""
    for _attempt in range(5):
        row = conn.execute(
            "SELECT MAX(CAST(CASE WHEN INSTR(invoice_number, '-') > 0 "
            "THEN SUBSTR(invoice_number, INSTR(invoice_number, '-') + 1) "
            "ELSE invoice_number END AS INTEGER)) FROM level_invoices"
        ).fetchone()
        max_num = (row[0] if row and row[0] else 1000)
        invoice_number = f"{prefix}-{str(max_num + 1).zfill(6)}"
        try:
            conn.execute(
                """INSERT INTO level_invoices (invoice_number, from_level, from_id, to_level, to_id, amount, items, payment_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (invoice_number, from_level, from_id, to_level, to_id, amount, items, payment_id)
            )
            return invoice_number
        except sqlite3.IntegrityError:
            continue
    raise HTTPException(status_code=500, detail="Could not generate unique invoice number")


def _get_entity_name(conn, level: str, entity_id: int) -> str:
    """Get name for an entity (center/sub-center/admin)."""
    if level == "admin":
        return "Admin"
    if level in ("center", "sub_center"):
        row = conn.execute("SELECT name FROM centers WHERE id = ?", (entity_id,)).fetchone()
        return row["name"] if row else f"Center #{entity_id}"
    if level == "university":
        row = conn.execute("SELECT name FROM universities WHERE id = ?", (entity_id,)).fetchone()
        return row["name"] if row else f"University #{entity_id}"
    return level


# ══════════════════════════════════════════════════════════════════
#  FEES CHAIN PAYMENTS
# ══════════════════════════════════════════════════════════════════

@router.get("/payments")
async def list_level_payments(
    user: dict = Depends(get_current_user),
    direction: str = "",  # 'incoming', 'outgoing', or '' for all
    status: str = "",
    from_level: str = "",
    to_level: str = "",
):
    """List payments in the chain. Admin sees all, center/sub-center sees own."""
    role = user.get("role", "")
    conn = get_db()

    query = """SELECT lp.*,
               (SELECT GROUP_CONCAT(ur.file_url) FROM university_receipts ur WHERE ur.payment_id = lp.id) as receipt_files
               FROM level_payments lp WHERE 1=1"""
    params: list = []

    if role in ("admin", "super_admin", "branch_admin"):
        # Admin sees all
        pass
    elif role == "center":
        center = get_current_center(user)
        cid = center["id"]
        all_ids = get_center_and_subcenter_ids(conn, cid)
        placeholders = ",".join(["?"] * len(all_ids))
        if direction == "incoming":
            query += f" AND to_level IN ('center','sub_center') AND to_id IN ({placeholders})"
            params += all_ids
        elif direction == "outgoing":
            query += f" AND from_level IN ('center','sub_center') AND from_id IN ({placeholders})"
            params += all_ids
        else:
            query += f" AND ((from_level IN ('center','sub_center') AND from_id IN ({placeholders})) OR (to_level IN ('center','sub_center') AND to_id IN ({placeholders})))"
            params += all_ids + all_ids
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    if status:
        query += " AND lp.status = ?"
        params.append(status)
    if from_level:
        query += " AND lp.from_level = ?"
        params.append(from_level)
    if to_level:
        query += " AND lp.to_level = ?"
        params.append(to_level)

    query += " ORDER BY lp.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    payments = []
    for r in rows:
        d = dict(r)
        d["from_name"] = _get_entity_name(conn, d["from_level"], d["from_id"])
        d["to_name"] = _get_entity_name(conn, d["to_level"], d["to_id"]) if d["to_id"] else d["to_level"].title()
        payments.append(d)
    conn.close()
    return {"payments": payments}


@router.post("/payments")
async def create_level_payment(data: LevelPaymentCreate, user: dict = Depends(get_current_user)):
    """Record a payment between levels (SC→Center, Center→Admin, Admin→University)."""
    role = user.get("role", "")
    conn = get_db()

    # Validate: only the 'from' entity can create a payment
    if role == "center":
        center = get_current_center(user)
        cid = center["id"]
        all_ids = get_center_and_subcenter_ids(conn, cid)
        if data.from_id not in all_ids:
            conn.close()
            raise HTTPException(status_code=403, detail="You can only create payments from your own center/sub-centers")
    elif role not in ("admin", "super_admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    # Auto-lookup student details if student_phone provided
    student_name = data.student_name or ""
    student_university = data.student_university or ""
    student_course = data.student_course or ""
    if data.student_phone and not student_name:
        stu = conn.execute(
            """SELECT s.name, u.name as uni_name, c.name as course_name
               FROM students s
               LEFT JOIN universities u ON s.university_id = u.id
               LEFT JOIN categories c ON s.category_id = c.id
               WHERE s.phone = ?""",
            (data.student_phone,)
        ).fetchone()
        if stu:
            student_name = stu["name"] or ""
            student_university = stu["uni_name"] or ""
            student_course = stu["course_name"] or ""

    # Generate a temporary invoice number for the payment record
    invoice_number = "PENDING"
    cursor = conn.execute(
        """INSERT INTO level_payments (from_level, from_id, to_level, to_id, amount, payment_mode, utr_number, notes, invoice_number, student_phone, student_name, student_university, student_course)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.from_level, data.from_id, data.to_level, data.to_id, data.amount,
         data.payment_mode, data.utr_number, data.notes, invoice_number,
         data.student_phone or "", student_name, student_university, student_course)
    )
    payment_id = cursor.lastrowid

    # Generate invoice with retry loop (INSERT inside loop catches IntegrityError)
    from_name = _get_entity_name(conn, data.from_level, data.from_id)
    to_name = _get_entity_name(conn, data.to_level, data.to_id) if data.to_id else data.to_level.title()
    items_json = json.dumps([{
        "description": f"Fees payment from {from_name} to {to_name}",
        "amount": data.amount
    }])
    invoice_number = _insert_invoice_with_retry(
        conn, "INV", data.from_level, data.from_id, data.to_level, data.to_id, data.amount, items_json, payment_id
    )
    # Update the payment record with the actual invoice number
    conn.execute("UPDATE level_payments SET invoice_number = ? WHERE id = ?", (invoice_number, payment_id))
    conn.commit()
    conn.close()
    return {"id": payment_id, "invoice_number": invoice_number, "message": "Payment recorded & invoice generated"}


@router.put("/payments/{payment_id}/approve")
async def approve_level_payment(payment_id: int, user: dict = Depends(get_current_user)):
    """Approve an incoming payment (receiver approves)."""
    role = user.get("role", "")
    conn = get_db()
    payment = conn.execute("SELECT * FROM level_payments WHERE id = ?", (payment_id,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")

    # Verify the approver is the receiver
    if role == "center":
        center = get_current_center(user)
        if payment["to_level"] not in ("center", "sub_center") or payment["to_id"] != center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Only the receiver can approve this payment")
    elif role not in ("admin", "super_admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    conn.execute(
        "UPDATE level_payments SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (int(user["sub"]), payment_id)
    )
    conn.execute("UPDATE level_invoices SET status = 'paid' WHERE payment_id = ?", (payment_id,))
    conn.commit()
    conn.close()
    return {"message": "Payment approved"}


@router.put("/payments/{payment_id}/reject")
async def reject_level_payment(payment_id: int, data: dict = {}, user: dict = Depends(get_current_user)):
    """Reject an incoming payment."""
    role = user.get("role", "")
    conn = get_db()
    payment = conn.execute("SELECT * FROM level_payments WHERE id = ?", (payment_id,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")

    if role == "center":
        center = get_current_center(user)
        if payment["to_level"] not in ("center", "sub_center") or payment["to_id"] != center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Only the receiver can reject")
    elif role not in ("admin", "super_admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    reason = data.get("reason", "") if isinstance(data, dict) else ""
    conn.execute(
        "UPDATE level_payments SET status = 'rejected', notes = COALESCE(notes,'') || ' | Rejected: ' || ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (reason, payment_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Payment rejected"}


@router.delete("/payments/{payment_id}")
async def delete_level_payment(payment_id: int, user: dict = Depends(require_admin)):
    """Admin can delete a payment."""
    conn = get_db()
    conn.execute("DELETE FROM university_receipts WHERE payment_id = ?", (payment_id,))
    conn.execute("DELETE FROM level_invoices WHERE payment_id = ?", (payment_id,))
    conn.execute("DELETE FROM level_payments WHERE id = ?", (payment_id,))
    conn.commit()
    conn.close()
    return {"message": "Payment deleted"}


# ══════════════════════════════════════════════════════════════════
#  INVOICES
# ══════════════════════════════════════════════════════════════════

@router.get("/invoices")
async def list_invoices(
    user: dict = Depends(get_current_user),
    direction: str = "",
):
    """List invoices. Admin sees all, center sees own."""
    role = user.get("role", "")
    conn = get_db()

    query = "SELECT li.*, lp.status as payment_status, lp.payment_mode, lp.utr_number FROM level_invoices li LEFT JOIN level_payments lp ON li.payment_id = lp.id WHERE 1=1"
    params: list = []

    if role in ("admin", "super_admin", "branch_admin"):
        pass
    elif role == "center":
        center = get_current_center(user)
        cid = center["id"]
        all_ids = get_center_and_subcenter_ids(conn, cid)
        placeholders = ",".join(["?"] * len(all_ids))
        if direction == "incoming":
            query += f" AND li.to_level IN ('center','sub_center') AND li.to_id IN ({placeholders})"
            params += all_ids
        elif direction == "outgoing":
            query += f" AND li.from_level IN ('center','sub_center') AND li.from_id IN ({placeholders})"
            params += all_ids
        else:
            query += f" AND ((li.from_level IN ('center','sub_center') AND li.from_id IN ({placeholders})) OR (li.to_level IN ('center','sub_center') AND li.to_id IN ({placeholders})))"
            params += all_ids + all_ids
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")

    query += " ORDER BY li.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    invoices = []
    for r in rows:
        d = dict(r)
        d["from_name"] = _get_entity_name(conn, d["from_level"], d["from_id"])
        d["to_name"] = _get_entity_name(conn, d["to_level"], d["to_id"]) if d["to_id"] else d["to_level"].title()
        invoices.append(d)
    conn.close()
    return {"invoices": invoices}


@router.get("/invoices/{invoice_id}")
async def get_invoice_detail(invoice_id: int, user: dict = Depends(get_current_user)):
    """Get detailed invoice data for PDF generation."""
    conn = get_db()
    invoice = conn.execute(
        "SELECT li.*, lp.payment_mode, lp.utr_number, lp.status as payment_status, lp.proof_urls FROM level_invoices li LEFT JOIN level_payments lp ON li.payment_id = lp.id WHERE li.id = ?",
        (invoice_id,)
    ).fetchone()
    if not invoice:
        conn.close()
        raise HTTPException(status_code=404, detail="Invoice not found")
    d = dict(invoice)
    d["from_name"] = _get_entity_name(conn, d["from_level"], d["from_id"])
    d["to_name"] = _get_entity_name(conn, d["to_level"], d["to_id"]) if d["to_id"] else d["to_level"].title()

    # Get branding from the 'to' entity for invoice header
    if d["to_level"] in ("center", "sub_center") and d["to_id"]:
        settings = conn.execute("SELECT * FROM center_settings WHERE center_id = ?", (d["to_id"],)).fetchone()
        if settings:
            d["invoice_branding"] = dict(settings)
    elif d["to_level"] == "admin":
        # Use admin settings
        admin_settings = {}
        for row in conn.execute("SELECT key, value FROM settings").fetchall():
            admin_settings[row["key"]] = row["value"]
        d["invoice_branding"] = admin_settings

    conn.close()
    return d


# ══════════════════════════════════════════════════════════════════
#  UNIVERSITY RECEIPTS (screenshots uploaded by admin)
# ══════════════════════════════════════════════════════════════════

@router.get("/receipts")
async def list_university_receipts(user: dict = Depends(get_current_user)):
    """List university receipts (admin only or chain visible)."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin"):
        raise HTTPException(status_code=403, detail="Only admin can view university receipts")
    conn = get_db()
    rows = conn.execute(
        """SELECT ur.*, lp.amount, lp.from_level, lp.from_id, lp.to_level, lp.invoice_number, u.name as uploader_name
           FROM university_receipts ur
           JOIN level_payments lp ON ur.payment_id = lp.id
           LEFT JOIN users u ON ur.uploaded_by = u.id
           ORDER BY ur.created_at DESC"""
    ).fetchall()
    conn.close()
    return {"receipts": [dict(r) for r in rows]}


@router.post("/receipts/{payment_id}/upload")
async def upload_university_receipt(
    payment_id: int,
    files: List[UploadFile] = File(...),
    user: dict = Depends(require_admin),
):
    """Upload university receipt screenshots (multiple allowed)."""
    conn = get_db()
    payment = conn.execute("SELECT * FROM level_payments WHERE id = ?", (payment_id,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")

    receipts_dir = os.path.join(UPLOAD_DIR, "university_receipts")
    os.makedirs(receipts_dir, exist_ok=True)

    uploaded = []
    for f in files:
        ext = os.path.splitext(f.filename or "file")[1] or ".png"
        allowed = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
        if ext.lower() not in allowed:
            continue
        fname = f"{uuid.uuid4().hex}{ext}"
        fpath = os.path.join(receipts_dir, fname)
        content = await f.read()
        with open(fpath, "wb") as fp:
            fp.write(content)
        file_url = f"/uploads/university_receipts/{fname}"
        conn.execute(
            "INSERT INTO university_receipts (payment_id, file_url, file_name, uploaded_by) VALUES (?, ?, ?, ?)",
            (payment_id, file_url, f.filename, int(user["sub"]))
        )
        uploaded.append(file_url)

    conn.commit()
    conn.close()
    return {"message": f"{len(uploaded)} receipt(s) uploaded", "files": uploaded}


# ══════════════════════════════════════════════════════════════════
#  FEES CHAIN SUMMARY (aggregated view)
# ══════════════════════════════════════════════════════════════════

@router.get("/summary")
async def fees_chain_summary(user: dict = Depends(get_current_user)):
    """Get fees chain summary for the logged-in user's level."""
    role = user.get("role", "")
    conn = get_db()

    if role in ("admin", "super_admin", "branch_admin"):
        # Admin: Total received from centers, total paid to universities
        received_from_centers = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE to_level = 'admin' AND status = 'approved'"
        ).fetchone()[0]
        pending_from_centers = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE to_level = 'admin' AND status = 'pending'"
        ).fetchone()[0]
        paid_to_university = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE from_level = 'admin' AND to_level = 'university' AND status = 'approved'"
        ).fetchone()[0]
        pending_to_university = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE from_level = 'admin' AND to_level = 'university' AND status = 'pending'"
        ).fetchone()[0]
        total_invoices = conn.execute("SELECT COUNT(*) FROM level_invoices").fetchone()[0]
        total_receipts = conn.execute("SELECT COUNT(*) FROM university_receipts").fetchone()[0]

        conn.close()
        return {
            "level": "admin",
            "received_from_centers": received_from_centers,
            "pending_from_centers": pending_from_centers,
            "paid_to_university": paid_to_university,
            "pending_to_university": pending_to_university,
            "total_invoices": total_invoices,
            "total_receipts": total_receipts,
        }

    elif role == "center":
        center = get_current_center(user)
        cid = center["id"]
        level = center["level"]

        # Received from sub-centers (if center)
        received_from_sc = 0
        pending_from_sc = 0
        if level == "center":
            received_from_sc = conn.execute(
                "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE to_level = 'center' AND to_id = ? AND from_level = 'sub_center' AND status = 'approved'",
                (cid,)
            ).fetchone()[0]
            pending_from_sc = conn.execute(
                "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE to_level = 'center' AND to_id = ? AND from_level = 'sub_center' AND status = 'pending'",
                (cid,)
            ).fetchone()[0]

        # Paid to parent (center→admin or sub_center→center)
        to_level = "admin" if level == "center" else "center"
        paid_to_parent = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE from_id = ? AND from_level = ? AND status = 'approved'",
            (cid, level)
        ).fetchone()[0]
        pending_to_parent = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM level_payments WHERE from_id = ? AND from_level = ? AND status = 'pending'",
            (cid, level)
        ).fetchone()[0]

        my_invoices = conn.execute(
            "SELECT COUNT(*) FROM level_invoices WHERE (from_id = ? AND from_level = ?) OR (to_id = ? AND to_level = ?)",
            (cid, level, cid, level)
        ).fetchone()[0]

        conn.close()
        return {
            "level": level,
            "center_id": cid,
            "center_name": center["name"],
            "received_from_sub_centers": received_from_sc,
            "pending_from_sub_centers": pending_from_sc,
            "paid_to_parent": paid_to_parent,
            "pending_to_parent": pending_to_parent,
            "total_invoices": my_invoices,
        }
    else:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
