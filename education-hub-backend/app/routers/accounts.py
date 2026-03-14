from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os, uuid, hmac, hashlib, json, urllib.parse, sqlite3
from datetime import datetime
from app.database import get_db
from app.utils.auth import require_admin, require_only_admin, get_current_user

# Razorpay Configuration (Test Keys - replace with live keys for production)
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_demo1234567890")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "demo_secret_1234567890abcdef")

from app.utils.uploads import get_upload_dir
from app.utils.image_optimize import optimize_image

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


def _generate_receipt_no(conn, prefix: str, tid: int, sid: int, amount: float) -> str:
    """Generate a unique receipt number with retry loop to handle race conditions."""
    for _attempt in range(5):
        max_num = conn.execute("SELECT MAX(CAST(SUBSTR(receipt_no, -6) AS INTEGER)) FROM receipts").fetchone()[0] or 1000
        receipt_no = f"{prefix}-{str(max_num + 1).zfill(6)}"
        try:
            conn.execute("INSERT INTO receipts (transaction_id, student_id, receipt_no, amount) VALUES (?, ?, ?, ?)",
                         (tid, sid, receipt_no, amount))
            return receipt_no
        except sqlite3.IntegrityError:
            continue
    raise HTTPException(status_code=500, detail="Could not generate unique receipt number")


def _get_branding(conn) -> dict:
    """Get branding/receipt settings from settings table."""
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    s = {r["key"]: r["value"] for r in rows}
    return {
        "company_name": s.get("company_name", "ASFF Education Hub"),
        "company_phone": s.get("company_phone", ""),
        "company_email": s.get("company_email", ""),
        "company_address": s.get("company_address", ""),
        "gst_number": s.get("receipt_gst_number", ""),
        "receipt_prefix": s.get("receipt_prefix", "ASFF"),
        "receipt_footer": s.get("receipt_footer", "This is a computer generated receipt."),
        "site_tagline": s.get("site_tagline", ""),
        "whatsapp_api_url": s.get("whatsapp_api_url", ""),
        "whatsapp_api_key": s.get("whatsapp_api_key", ""),
    }


def _get_fee_summary(conn, student_id: int) -> dict:
    """Calculate fee summary for a student."""
    student = conn.execute("SELECT total_fees, name, email, phone FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        return {"total_fees": 0, "total_paid": 0, "pending": 0, "name": "", "email": "", "phone": "", "course": "", "university": "", "father_name": ""}
    total_fees = student["total_fees"] or 0
    fp = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE student_id=? AND status='approved' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)", (student_id,)).fetchone()[0]
    txn = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE student_id=? AND transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)", (student_id,)).fetchone()[0]
    total_paid = fp + txn
    # Fetch course/university via JOINs (students table uses FK IDs, not direct columns)
    course = university = father_name = ""
    try:
        extra = conn.execute(
            "SELECT s.father_name, c.name as course, u.name as university FROM students s "
            "LEFT JOIN categories c ON s.category_id = c.id "
            "LEFT JOIN universities u ON s.university_id = u.id "
            "WHERE s.id = ?", (student_id,)
        ).fetchone()
        if extra:
            course = extra["course"] or ""
            university = extra["university"] or ""
            father_name = extra["father_name"] or ""
    except Exception:
        pass
    return {"total_fees": total_fees, "total_paid": total_paid, "pending": max(0, total_fees - total_paid), "name": student["name"] or "", "email": student["email"] or "", "phone": student["phone"] or "", "course": course, "university": university, "father_name": father_name}


def _send_receipt_notifications(conn, student_id: int, receipt_no: str, amount: float, payment_mode: str, utr_number: str):
    """Send receipt via email and WhatsApp (if configured). Runs in background-safe manner."""
    try:
        branding = _get_branding(conn)
        summary = _get_fee_summary(conn, student_id)
        payment_date = datetime.now().strftime("%d-%b-%Y")

        # Send email
        if summary["email"]:
            try:
                from app.utils.email import send_receipt_email
                send_receipt_email(
                    to_email=summary["email"],
                    student_name=summary["name"],
                    receipt_no=receipt_no,
                    amount=amount,
                    payment_mode=payment_mode or "",
                    utr_number=utr_number or "",
                    payment_date=payment_date,
                    total_fees=summary["total_fees"],
                    total_paid=summary["total_paid"],
                    pending=summary["pending"],
                    branding=branding,
                    student_phone=summary["phone"],
                    student_email=summary["email"],
                    student_course=summary["course"],
                    student_university=summary["university"],
                    student_father=summary["father_name"],
                )
                print(f"Receipt email sent to {summary['email']} for {receipt_no}")
            except Exception as e:
                print(f"Receipt email failed: {e}")

        # Send WhatsApp if API configured
        wa_api_url = branding.get("whatsapp_api_url", "")
        wa_api_key = branding.get("whatsapp_api_key", "")
        if wa_api_url and wa_api_key and summary["phone"]:
            try:
                import requests
                phone = summary["phone"].replace(" ", "").replace("-", "").replace("+", "")
                if phone.startswith("0"):
                    phone = "91" + phone[1:]
                elif not phone.startswith("91") and len(phone) == 10:
                    phone = "91" + phone
                msg = (f"*{branding['company_name']}*\n\n"
                       f"Fee Receipt: *{receipt_no}*\n"
                       f"Amount Paid: *Rs.{amount:,.0f}*\n"
                       f"Mode: {payment_mode or 'N/A'}\n"
                       f"Date: {payment_date}\n\n"
                       f"Total Fees: Rs.{summary['total_fees']:,.0f}\n"
                       f"Total Paid: Rs.{summary['total_paid']:,.0f}\n"
                       f"Pending: Rs.{summary['pending']:,.0f}\n\n"
                       f"Thank you for your payment!")
                requests.post(wa_api_url, json={"api_key": wa_api_key, "phone": phone, "message": msg}, timeout=10)
                print(f"WhatsApp receipt sent to {phone} for {receipt_no}")
            except Exception as e:
                print(f"WhatsApp receipt failed: {e}")
    except Exception as e:
        print(f"Receipt notification error: {e}")


class TransactionCreate(BaseModel):
    student_phone: Optional[str] = None
    student_id: Optional[int] = None
    amount: float
    transaction_type: str = "credit"
    utr_number: Optional[str] = None
    account_name: Optional[str] = None
    payment_mode: Optional[str] = None
    description: Optional[str] = None
    proof_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "completed"

class FeeRecordCreate(BaseModel):
    student_id: int
    total_fee: float = 0
    paid_amount: float = 0
    account_name: Optional[str] = None
    last_utr: Optional[str] = None

@router.get("/transactions")
async def list_transactions(student_id: Optional[int] = None, branch_id: Optional[int] = None, center_only: Optional[bool] = None, page: int = 1, limit: int = 50, user: dict = Depends(require_admin)):
    conn = get_db()
    query = """SELECT t.*, st.name as student_name, st.phone as student_phone, st.enrollment_no, b.name as branch_name, c.name as center_name
               FROM transactions t JOIN students st ON t.student_id = st.id
               LEFT JOIN branches b ON st.branch_id = b.id
               LEFT JOIN centers c ON st.center_id = c.id
               WHERE (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL)"""
    params = []
    if student_id:
        query += " AND t.student_id = ?"
        params.append(student_id)
    if branch_id:
        query += " AND st.branch_id = ?"
        params.append(branch_id)
    if center_only is True:
        query += " AND st.center_id IS NOT NULL AND st.center_id > 0"
    elif center_only is False:
        query += " AND (st.center_id IS NULL OR st.center_id = 0)"
    total = conn.execute(query.replace("SELECT t.*, st.name as student_name, st.phone as student_phone, st.enrollment_no, b.name as branch_name, c.name as center_name", "SELECT COUNT(*)"), params).fetchone()[0]
    query += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"transactions": [dict(r) for r in rows], "total": total}

@router.post("/transactions")
async def create_transaction(data: TransactionCreate, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized to create transactions")
    conn = get_db()
    # Resolve student_id from phone if provided
    sid = data.student_id
    if data.student_phone and not sid:
        student = conn.execute("SELECT id FROM students WHERE phone = ?", (data.student_phone,)).fetchone()
        if not student:
            conn.close()
            raise HTTPException(status_code=404, detail="Student not found with this mobile number")
        sid = student["id"]
    if not sid:
        conn.close()
        raise HTTPException(status_code=400, detail="Student phone or ID required")
    # Center ownership check: verify student belongs to this center
    if role == "center":
        from app.routers.centers import get_current_center, get_center_and_subcenter_ids
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        student_check = conn.execute("SELECT center_id FROM students WHERE id = ?", (sid,)).fetchone()
        if not student_check or student_check["center_id"] not in all_ids:
            conn.close()
            raise HTTPException(status_code=403, detail="Student does not belong to your center")
    # Admin cannot collect fees for center students - only center or student can
    if role in ("admin", "super_admin", "branch_admin"):
        student_check = conn.execute("SELECT center_id FROM students WHERE id = ?", (sid,)).fetchone()
        if student_check and student_check["center_id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Fees for center students can only be collected by the center or the student themselves. Admin cannot collect fees for center students.")
    description = data.description or data.notes or ""
    cursor = conn.execute(
        "INSERT INTO transactions (student_id, amount, transaction_type, utr_number, account_name, payment_mode, description, proof_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (sid, data.amount, data.transaction_type, data.utr_number, data.account_name, data.payment_mode, description, data.proof_url, data.status)
    )
    tid = cursor.lastrowid
    # Auto create receipt with prefix from settings (retry loop for race condition)
    branding = _get_branding(conn)
    prefix = branding.get("receipt_prefix", "ASFF")
    receipt_no = _generate_receipt_no(conn, prefix, tid, sid, data.amount)
    # Update fee record
    fee = conn.execute("SELECT * FROM fee_records WHERE student_id = ?", (sid,)).fetchone()
    if fee:
        new_paid = fee["paid_amount"] + data.amount
        conn.execute("UPDATE fee_records SET paid_amount=?, pending_amount=total_fee-?, last_utr=?, account_name=? WHERE student_id=?",
                     (new_paid, new_paid, data.utr_number, data.account_name, sid))
    conn.commit()
    # Send Telegram + Email notification for payment
    try:
        from app.utils.notifications import send_notification
        student_info = conn.execute("SELECT name FROM students WHERE id=?", (sid,)).fetchone()
        sname = student_info["name"] if student_info else "Unknown"
        send_notification(conn, "payment", "New Payment Received",
            f"Student: {sname}\nAmount: Rs.{data.amount:,.0f}\nReceipt: {receipt_no}\nMode: {data.payment_mode or 'N/A'}\nUTR: {data.utr_number or 'N/A'}",
            "/admin/accounts")
    except Exception as e:
        print(f"Notification error: {e}")
    conn.close()
    # Send receipt email + WhatsApp (after closing connection to avoid DB lock)
    try:
        notify_conn = get_db()
        _send_receipt_notifications(notify_conn, sid, receipt_no, data.amount, data.payment_mode, data.utr_number)
        notify_conn.close()
    except Exception as e:
        print(f"Receipt notification error: {e}")
    return {"id": tid, "receipt_no": receipt_no, "message": "Transaction recorded"}

@router.get("/receipts")
async def list_receipts(student_id: Optional[int] = None, branch_id: Optional[int] = None, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    conn = get_db()
    query = """SELECT r.*, st.name as student_name, st.enrollment_no, b.name as branch_name
               FROM receipts r JOIN students st ON r.student_id = st.id
               LEFT JOIN branches b ON st.branch_id = b.id WHERE 1=1"""
    params = []

    # Center can only see receipts of their students
    if role == "center":
        from app.routers.centers import get_current_center, get_center_and_subcenter_ids
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        placeholders = ",".join(["?"] * len(all_ids))
        query += f" AND st.center_id IN ({placeholders})"
        params.extend(all_ids)

    if student_id:
        query += " AND r.student_id = ?"
        params.append(student_id)
    if branch_id:
        query += " AND st.branch_id = ?"
        params.append(branch_id)
    query += " ORDER BY r.date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/receipts/{receipt_id}/resend")
async def resend_receipt(receipt_id: int, user: dict = Depends(get_current_user)):
    """Resend a receipt notification via email/WhatsApp.

    Allowed for admin roles and centers (centers only for their own students).
    """
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = get_db()
    receipt = conn.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,)).fetchone()
    if not receipt:
        conn.close()
        raise HTTPException(status_code=404, detail="Receipt not found")

    sid = receipt["student_id"]

    # Center ownership check
    if role == "center":
        from app.routers.centers import get_current_center, get_center_and_subcenter_ids
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        student_check = conn.execute("SELECT center_id FROM students WHERE id = ?", (sid,)).fetchone()
        if not student_check or student_check["center_id"] not in all_ids:
            conn.close()
            raise HTTPException(status_code=403, detail="Not authorized")

    txn = None
    if receipt.get("transaction_id"):
        txn = conn.execute("SELECT payment_mode, utr_number FROM transactions WHERE id = ?", (receipt["transaction_id"],)).fetchone()

    receipt_no = receipt["receipt_no"]
    amount = float(receipt["amount"] or 0)
    payment_mode = txn["payment_mode"] if txn else ""
    utr_number = txn["utr_number"] if txn else ""
    conn.close()

    try:
        notify_conn = get_db()
        _send_receipt_notifications(notify_conn, sid, receipt_no, amount, payment_mode, utr_number)
        notify_conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resend receipt: {e}")

    return {"message": "Receipt resent"}

@router.get("/fee-records")
async def list_fee_records(student_id: Optional[int] = None, user: dict = Depends(require_admin)):
    conn = get_db()
    query = """SELECT f.*, st.name as student_name, st.enrollment_no
               FROM fee_records f JOIN students st ON f.student_id = st.id WHERE 1=1"""
    params = []
    if student_id:
        query += " AND f.student_id = ?"
        params.append(student_id)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/fee-records")
async def create_fee_record(data: FeeRecordCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    pending = data.total_fee - data.paid_amount
    existing = conn.execute("SELECT id FROM fee_records WHERE student_id = ?", (data.student_id,)).fetchone()
    if existing:
        conn.execute("UPDATE fee_records SET total_fee=?, paid_amount=?, pending_amount=?, account_name=?, last_utr=? WHERE student_id=?",
                     (data.total_fee, data.paid_amount, pending, data.account_name, data.last_utr, data.student_id))
    else:
        conn.execute("INSERT INTO fee_records (student_id, total_fee, paid_amount, pending_amount, account_name, last_utr) VALUES (?, ?, ?, ?, ?, ?)",
                     (data.student_id, data.total_fee, data.paid_amount, pending, data.account_name, data.last_utr))
    conn.commit()
    conn.close()
    return {"message": "Fee record saved"}

@router.get("/add-money")
async def add_money_summary(user: dict = Depends(require_admin)):
    conn = get_db()
    total_collected = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type = 'credit' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)").fetchone()[0]
    # Calculate pending dynamically: sum of all students' total_fees minus actual paid amounts
    total_fees_all = conn.execute("SELECT COALESCE(SUM(total_fees), 0) FROM students").fetchone()[0]
    # Total paid = approved fee_payments (non-deleted) + admin-added transactions (non-deleted, non-mirror)
    fp_total = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE status = 'approved' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)").fetchone()[0]
    admin_total = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type = 'credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)").fetchone()[0]
    total_paid_all = fp_total + admin_total
    total_pending = max(0, total_fees_all - total_paid_all)
    conn.close()
    return {"total_collected": total_collected, "total_pending": total_pending, "total_fees": total_fees_all, "total_paid": total_paid_all}

@router.post("/upload-proof")
async def upload_proof(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload payment proof (PDF/image) - accessible by both admin and student."""
    upload_dir = get_upload_dir()
    os.makedirs(upload_dir + "/proofs", exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    filename = f"proof_{uuid.uuid4().hex[:8]}.{ext}"
    content = await file.read()
    content, filename = optimize_image(content, filename)
    filepath = os.path.join(upload_dir, "proofs", filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/proofs/{filename}", "filename": filename}

# ===== Payment Settings for Students =====

@router.get("/payment-settings")
async def get_payment_settings(user: dict = Depends(get_current_user)):
    """Get payment settings (UPI QR, bank details) for student payment form."""
    conn = get_db()
    keys = ["upi_qr_image", "bank_account_name", "bank_account_number", "bank_ifsc_code", "bank_name", "bank_branch"]
    result = {}
    for key in keys:
        row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        result[key] = row["value"] if row else ""
    conn.close()
    return result

# ===== Student Fee Payments (Online) =====

@router.get("/my-fees")
async def get_my_fees(user: dict = Depends(get_current_user)):
    """Student gets their fee summary."""
    conn = get_db()
    student = conn.execute("SELECT id, total_fees FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not student:
        conn.close()
        return {"total_fees": 0, "paid": 0, "pending": 0, "payments": []}
    sid = student["id"]
    total_fees = student["total_fees"] or 0
    # Sum approved payments from fee_payments only (transactions table already mirrors these, so don't double count)
    paid = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = ? AND status = 'approved' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)", (sid,)).fetchone()[0]
    # Only count admin-added transactions that are NOT from fee payment approvals (avoid double counting)
    admin_paid = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE student_id = ? AND transaction_type = 'credit' AND description NOT LIKE 'Online Fee Payment%' AND description NOT LIKE 'Razorpay Payment%' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)", (sid,)).fetchone()[0]
    total_paid = paid + admin_paid
    pending = max(0, total_fees - total_paid)
    # Get all fee payments by this student (exclude deleted)
    fee_payment_rows = conn.execute(
        """SELECT fp.*, u.name as approved_by_name, 'online' as source
           FROM fee_payments fp LEFT JOIN users u ON fp.approved_by = u.id 
           WHERE fp.student_id = ? AND (fp.deleted_by_admin = 0 OR fp.deleted_by_admin IS NULL) ORDER BY fp.created_at DESC""", (sid,)
    ).fetchall()
    # Get admin-added transactions (not from online fee payments) so they appear in payment history
    admin_txn_rows = conn.execute(
        """SELECT t.id, t.amount, t.payment_mode, t.utr_number, t.proof_url, t.description as remarks,
           t.status, t.created_at, NULL as approved_at, NULL as approved_by, NULL as approved_by_name,
           NULL as rejection_reason, 'admin' as source
           FROM transactions t
           WHERE t.student_id = ? AND t.transaction_type = 'credit'
           AND t.description NOT LIKE 'Online Fee Payment%%' AND t.description NOT LIKE 'Razorpay Payment%%'
           AND (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL)
           ORDER BY t.created_at DESC""", (sid,)
    ).fetchall()
    # Combine and sort by date
    all_payments = [dict(p) for p in fee_payment_rows] + [dict(t) for t in admin_txn_rows]
    all_payments.sort(key=lambda x: x.get("created_at", "") or "", reverse=True)
    conn.close()
    return {"total_fees": total_fees, "paid": total_paid, "pending": pending, "payments": all_payments}

@router.post("/fee-payments")
async def submit_fee_payment(data: dict, user: dict = Depends(get_current_user)):
    """Student submits a fee payment for approval."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit fee payments")
    conn = get_db()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student record not found")
    sid = student["id"]
    amount = data.get("amount", 0)
    if not amount or float(amount) <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid amount")
    conn.execute(
        "INSERT INTO fee_payments (student_id, amount, payment_mode, utr_number, proof_url, remarks) VALUES (?, ?, ?, ?, ?, ?)",
        (sid, float(amount), data.get("payment_mode", "upi"), data.get("utr_number", ""), data.get("proof_url", ""), data.get("remarks", ""))
    )
    conn.commit()
    # Send notification for student fee payment submission
    try:
        from app.utils.notifications import send_notification
        student_info = conn.execute("SELECT name FROM students WHERE id=?", (sid,)).fetchone()
        sname = student_info["name"] if student_info else "Unknown"
        send_notification(conn, "payment", "Student Fee Payment Submitted",
            f"Student: {sname}\nAmount: Rs.{float(amount):,.0f}\nMode: {data.get('payment_mode','upi')}\nUTR: {data.get('utr_number','N/A')}\nStatus: Pending Approval",
            "/admin/accounts")
    except Exception as e:
        print(f"Notification error: {e}")
    conn.close()
    return {"message": "Payment submitted for approval"}

@router.get("/fee-payments")
async def list_fee_payments(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    """List fee payments - admin sees all, student sees own."""
    conn = get_db()
    query = """SELECT fp.*, st.name as student_name, st.enrollment_no, st.phone as student_phone,
                      u.name as approved_by_name
               FROM fee_payments fp 
               JOIN students st ON fp.student_id = st.id
               LEFT JOIN users u ON fp.approved_by = u.id WHERE (fp.deleted_by_admin = 0 OR fp.deleted_by_admin IS NULL)"""
    params = []
    if user.get("role") == "student":
        student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
        if student:
            query += " AND fp.student_id = ?"
            params.append(student["id"])
        else:
            conn.close()
            return []
    if status:
        query += " AND fp.status = ?"
        params.append(status)
    query += " ORDER BY fp.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.put("/fee-payments/{pid}/approve")
async def approve_fee_payment(pid: int, user: dict = Depends(require_admin)):
    """Admin approves a student fee payment."""
    conn = get_db()
    payment = conn.execute("SELECT * FROM fee_payments WHERE id = ?", (pid,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment["status"] != "pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Payment is not pending")
    # Mark as approved
    conn.execute("UPDATE fee_payments SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?",
                 (int(user["sub"]), pid))
    # Also add to transactions table
    sid = payment["student_id"]
    cursor = conn.execute(
        "INSERT INTO transactions (student_id, amount, transaction_type, utr_number, payment_mode, description, proof_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (sid, payment["amount"], "credit", payment["utr_number"], payment["payment_mode"], f"Online Fee Payment #{pid}", payment["proof_url"], "completed")
    )
    tid = cursor.lastrowid
    # Auto create receipt with prefix (retry loop for race condition)
    branding = _get_branding(conn)
    prefix = branding.get("receipt_prefix", "ASFF")
    receipt_no = _generate_receipt_no(conn, prefix, tid, sid, payment["amount"])
    # Update fee record if exists
    fee = conn.execute("SELECT * FROM fee_records WHERE student_id = ?", (sid,)).fetchone()
    if fee:
        new_paid = fee["paid_amount"] + payment["amount"]
        conn.execute("UPDATE fee_records SET paid_amount=?, pending_amount=total_fee-?, last_utr=? WHERE student_id=?",
                     (new_paid, new_paid, payment["utr_number"], sid))
    conn.commit()
    conn.close()
    # Send receipt email + WhatsApp (after closing connection to avoid DB lock)
    try:
        notify_conn = get_db()
        _send_receipt_notifications(notify_conn, sid, receipt_no, payment["amount"], payment["payment_mode"], payment["utr_number"])
        notify_conn.close()
    except Exception as e:
        print(f"Receipt notification error: {e}")
    return {"message": "Payment approved and added to accounts"}

@router.put("/fee-payments/{pid}/reject")
async def reject_fee_payment(pid: int, data: dict, user: dict = Depends(require_admin)):
    """Admin rejects a student fee payment."""
    conn = get_db()
    payment = conn.execute("SELECT * FROM fee_payments WHERE id = ?", (pid,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")
    reason = data.get("reason", "")
    conn.execute("UPDATE fee_payments SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?",
                 (reason, int(user["sub"]), pid))
    conn.commit()
    conn.close()
    return {"message": "Payment rejected"}

# ===== Razorpay Payment Gateway =====

@router.get("/razorpay/config")
async def get_razorpay_config(user: dict = Depends(get_current_user)):
    """Return Razorpay public key for frontend checkout."""
    return {"key_id": RAZORPAY_KEY_ID}

@router.post("/razorpay/create-order")
async def create_razorpay_order(data: dict, user: dict = Depends(get_current_user)):
    """Create a Razorpay order for fee payment."""
    amount = data.get("amount", 0)
    if not amount or float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    conn = get_db()
    student = conn.execute("SELECT id, name, email, phone FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student record not found")
    
    amount_paise = int(float(amount) * 100)  # Razorpay uses paise
    
    try:
        import razorpay
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"fee_{student['id']}_{uuid.uuid4().hex[:8]}",
            "notes": {
                "student_id": str(student["id"]),
                "student_name": student["name"] or "",
                "purpose": "Fee Payment"
            }
        }
        order = client.order.create(data=order_data)
        # Store order amount server-side for verification later
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (f"rzp_order_{order['id']}", str(amount_paise))
        )
        conn.commit()
        conn.close()
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID,
            "student_name": student["name"] or "",
            "student_email": student["email"] or "",
            "student_phone": student["phone"] or "",
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.post("/razorpay/verify")
async def verify_razorpay_payment(data: dict, user: dict = Depends(get_current_user)):
    """Verify Razorpay payment signature and record the payment."""
    razorpay_order_id = data.get("razorpay_order_id", "")
    razorpay_payment_id = data.get("razorpay_payment_id", "")
    razorpay_signature = data.get("razorpay_signature", "")
    
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing payment details")
    
    # Verify signature
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed - invalid signature")
    
    # Payment verified - get server-stored amount (not client-supplied)
    conn = get_db()
    order_amount_row = conn.execute("SELECT value FROM settings WHERE key = ?", (f"rzp_order_{razorpay_order_id}",)).fetchone()
    if not order_amount_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Order not found - possible tampering")
    amount = int(order_amount_row["value"]) / 100  # Convert paise back to rupees
    # Clean up the stored order
    conn.execute("DELETE FROM settings WHERE key = ?", (f"rzp_order_{razorpay_order_id}",))
    
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student record not found")
    sid = student["id"]
    
    # Insert fee payment as approved (Razorpay verified)
    conn.execute(
        "INSERT INTO fee_payments (student_id, amount, payment_mode, utr_number, proof_url, remarks, status, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        (sid, float(amount), "razorpay", razorpay_payment_id, "", f"Razorpay Order: {razorpay_order_id}", "approved")
    )
    
    # Also add to transactions
    cursor = conn.execute(
        "INSERT INTO transactions (student_id, amount, transaction_type, utr_number, payment_mode, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (sid, float(amount), "credit", razorpay_payment_id, "razorpay", f"Razorpay Payment - Order: {razorpay_order_id}", "completed")
    )
    tid = cursor.lastrowid
    
    # Auto create receipt with prefix (retry loop for race condition)
    branding = _get_branding(conn)
    prefix = branding.get("receipt_prefix", "ASFF")
    receipt_no = _generate_receipt_no(conn, prefix, tid, sid, float(amount))
    
    # Update fee record if exists
    fee = conn.execute("SELECT * FROM fee_records WHERE student_id = ?", (sid,)).fetchone()
    if fee:
        new_paid = fee["paid_amount"] + float(amount)
        conn.execute("UPDATE fee_records SET paid_amount=?, pending_amount=total_fee-?, last_utr=? WHERE student_id=?",
                     (new_paid, new_paid, razorpay_payment_id, sid))
    
    conn.commit()
    conn.close()
    # Send receipt email + WhatsApp (after closing connection to avoid DB lock)
    try:
        notify_conn = get_db()
        _send_receipt_notifications(notify_conn, sid, receipt_no, float(amount), "razorpay", razorpay_payment_id)
        notify_conn.close()
    except Exception as e:
        print(f"Receipt notification error: {e}")
    return {"message": "Payment verified and recorded successfully", "receipt_no": receipt_no}

@router.get("/student-statement")
async def student_statement(phone: str = "", user: dict = Depends(require_admin)):
    """Get complete payment statement for a student by mobile number."""
    if not phone:
        return {"student": None, "payments": [], "message": "Enter mobile number to search"}
    conn = get_db()
    # Get ALL students with this phone number
    students = conn.execute(
        "SELECT s.id, s.name, s.phone, s.email, s.enrollment_no, s.total_fees, u.name as university_name, c.name as course_name "
        "FROM students s LEFT JOIN universities u ON s.university_id = u.id LEFT JOIN categories c ON s.category_id = c.id "
        "WHERE s.phone = ? ORDER BY s.total_fees DESC, s.id DESC", (phone,)
    ).fetchall()
    if not students:
        conn.close()
        return {"student": None, "payments": [], "message": "No student found with this mobile number"}
    # Use the student with highest total_fees (most relevant)
    student = students[0]
    student_ids = [s["id"] for s in students]
    placeholders = ",".join(["?"] * len(student_ids))
    # Get all fee_payments (online payments) for ALL matching students (exclude deleted)
    fee_payments = conn.execute(
        f"SELECT fp.id, fp.amount, fp.payment_mode, fp.utr_number, fp.status, fp.created_at, fp.approved_at, fp.remarks, fp.proof_url, "
        f"'online' as source FROM fee_payments fp WHERE fp.student_id IN ({placeholders}) AND (fp.deleted_by_admin = 0 OR fp.deleted_by_admin IS NULL) ORDER BY fp.created_at DESC", student_ids
    ).fetchall()
    # Get admin-added transactions for ALL matching students (exclude deleted)
    transactions = conn.execute(
        f"SELECT t.id, t.amount, t.payment_mode, t.utr_number, t.status, t.created_at, NULL as approved_at, t.description as remarks, t.proof_url, "
        f"'admin' as source FROM transactions t WHERE t.student_id IN ({placeholders}) AND t.transaction_type = 'credit' "
        f"AND t.description NOT LIKE 'Online Fee Payment%%' AND t.description NOT LIKE 'Razorpay Payment%%' "
        f"AND (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL) "
        f"ORDER BY t.created_at DESC", student_ids
    ).fetchall()
    all_payments = [dict(p) for p in fee_payments] + [dict(t) for t in transactions]
    all_payments.sort(key=lambda x: x.get("created_at", "") or "", reverse=True)
    # Calculate totals across all matching students
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

@router.delete("/transactions/{tid}")
async def delete_transaction(tid: int, user: dict = Depends(require_only_admin)):
    """Soft delete a transaction - only admin, not employee."""
    conn = get_db()
    txn = conn.execute("SELECT * FROM transactions WHERE id = ?", (tid,)).fetchone()
    if not txn:
        conn.close()
        raise HTTPException(status_code=404, detail="Transaction not found")
    # Soft delete - mark as deleted
    conn.execute("UPDATE transactions SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (tid,))
    # Also soft delete the linked fee_payment if this transaction came from an online payment
    desc = txn["description"] or ""
    if desc.startswith("Online Fee Payment #"):
        try:
            fp_id = int(desc.split("#")[1].split()[0])
            conn.execute("UPDATE fee_payments SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (fp_id,))
        except (ValueError, IndexError):
            pass
    elif desc.startswith("Razorpay Payment"):
        # Razorpay descriptions use "Razorpay Payment - Order: {order_id}", no #id
        # Match by student_id + payment_id (stored as utr_number) + razorpay mode
        conn.execute(
            "UPDATE fee_payments SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP "
            "WHERE student_id = ? AND payment_mode = 'razorpay' AND utr_number = ? AND status = 'approved'",
            (txn["student_id"], txn["utr_number"])
        )
    conn.commit()
    conn.close()
    return {"message": "Transaction deleted"}

@router.delete("/fee-payments/{pid}")
async def delete_fee_payment(pid: int, user: dict = Depends(require_only_admin)):
    """Soft delete a fee payment entry - only admin, not employee."""
    conn = get_db()
    payment = conn.execute("SELECT * FROM fee_payments WHERE id = ?", (pid,)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Fee payment not found")
    # Soft delete the fee payment
    conn.execute("UPDATE fee_payments SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (pid,))
    # If it was approved, also soft delete the corresponding transaction
    if payment["status"] == "approved":
        if payment["payment_mode"] == "razorpay":
            # Razorpay transactions use "Razorpay Payment - Order: ..." description
            conn.execute(
                "UPDATE transactions SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP "
                "WHERE student_id = ? AND payment_mode = 'razorpay' AND utr_number = ?",
                (payment["student_id"], payment["utr_number"])
            )
        else:
            conn.execute("UPDATE transactions SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE description = ? AND student_id = ?",
                         (f"Online Fee Payment #{pid}", payment["student_id"]))
    conn.commit()
    conn.close()
    return {"message": "Fee payment deleted"}

class BulkDeleteRequest(BaseModel):
    ids: list

@router.post("/transactions/bulk-delete")
async def bulk_delete_transactions(req: BulkDeleteRequest, user: dict = Depends(require_only_admin)):
    """Bulk soft delete transactions - only admin."""
    if not req.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    conn = get_db()
    placeholders = ",".join(["?"] * len(req.ids))
    # Also soft delete linked fee_payments for online payment transactions
    for tid in req.ids:
        txn = conn.execute("SELECT * FROM transactions WHERE id = ?", (tid,)).fetchone()
        if txn:
            desc = txn["description"] or ""
            if desc.startswith("Online Fee Payment #"):
                try:
                    fp_id = int(desc.split("#")[1].split()[0])
                    conn.execute("UPDATE fee_payments SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (fp_id,))
                except (ValueError, IndexError):
                    pass
            elif desc.startswith("Razorpay Payment"):
                conn.execute(
                    "UPDATE fee_payments SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP "
                    "WHERE student_id = ? AND payment_mode = 'razorpay' AND utr_number = ? AND status = 'approved'",
                    (txn["student_id"], txn["utr_number"])
                )
    conn.execute(f"UPDATE transactions SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN ({placeholders})", req.ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(req.ids)} transactions deleted"}

@router.post("/fee-payments/bulk-delete")
async def bulk_delete_fee_payments(req: BulkDeleteRequest, user: dict = Depends(require_only_admin)):
    """Bulk soft delete fee payments - only admin."""
    if not req.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    conn = get_db()
    placeholders = ",".join(["?"] * len(req.ids))
    # Soft delete associated approved transactions
    for pid in req.ids:
        payment = conn.execute("SELECT * FROM fee_payments WHERE id = ?", (pid,)).fetchone()
        if payment and payment["status"] == "approved":
            if payment["payment_mode"] == "razorpay":
                conn.execute(
                    "UPDATE transactions SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP "
                    "WHERE student_id = ? AND payment_mode = 'razorpay' AND utr_number = ?",
                    (payment["student_id"], payment["utr_number"])
                )
            else:
                conn.execute("UPDATE transactions SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE description = ? AND student_id = ?",
                             (f"Online Fee Payment #{pid}", payment["student_id"]))
    conn.execute(f"UPDATE fee_payments SET deleted_by_admin = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN ({placeholders})", req.ids)
    conn.commit()
    conn.close()
    return {"message": f"{len(req.ids)} fee payments deleted"}

@router.get("/my-deleted-payments")
async def get_my_deleted_payments(user: dict = Depends(get_current_user)):
    """Student gets their deleted payments (soft deleted by admin) - both fee_payments and transactions."""
    conn = get_db()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not student:
        conn.close()
        return []
    sid = student["id"]
    results = []
    # Get deleted fee_payments
    deleted_fees = conn.execute(
        """SELECT fp.*, u.name as approved_by_name 
           FROM fee_payments fp LEFT JOIN users u ON fp.approved_by = u.id 
           WHERE fp.student_id = ? AND fp.deleted_by_admin = 1 ORDER BY fp.deleted_at DESC""", (sid,)
    ).fetchall()
    for p in deleted_fees:
        d = dict(p)
        d["source"] = "fee_payment"
        results.append(d)
    # Get deleted transactions (admin-added entries)
    deleted_txns = conn.execute(
        """SELECT t.* FROM transactions t 
           WHERE t.student_id = ? AND t.deleted_by_admin = 1 
           AND t.description NOT LIKE 'Online Fee Payment%' AND t.description NOT LIKE 'Razorpay Payment%'
           ORDER BY t.deleted_at DESC""", (sid,)
    ).fetchall()
    for t in deleted_txns:
        d = dict(t)
        d["source"] = "transaction"
        d["payment_mode"] = d.get("payment_mode", "admin_entry")
        d["utr_number"] = d.get("utr_number", "")
        d["status"] = "approved"
        results.append(d)
    conn.close()
    return results

@router.get("/my-receipts")
async def get_my_receipts(user: dict = Depends(get_current_user)):
    """Student gets their receipts."""
    conn = get_db()
    student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
    if not student:
        conn.close()
        return []
    sid = student["id"]
    rows = conn.execute("""
        SELECT r.id, r.receipt_no, r.amount, r.date, r.transaction_id,
               t.payment_mode, t.utr_number, t.description
        FROM receipts r LEFT JOIN transactions t ON r.transaction_id = t.id
        WHERE r.student_id = ? ORDER BY r.date DESC
    """, (sid,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/receipt-data/{receipt_id}")
async def get_receipt_data(receipt_id: int, user: dict = Depends(get_current_user)):
    """Get full receipt data for PDF generation (student or admin)."""
    conn = get_db()
    receipt = conn.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,)).fetchone()
    if not receipt:
        conn.close()
        raise HTTPException(status_code=404, detail="Receipt not found")
    role = user.get("role", "")

    # If student, verify ownership
    if role == "student":
        student = conn.execute("SELECT id FROM students WHERE user_id = ?", (int(user["sub"]),)).fetchone()
        if not student or student["id"] != receipt["student_id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Not authorized")

    # If center, verify student belongs to center (including sub-centers)
    if role == "center":
        from app.routers.centers import get_current_center, get_center_and_subcenter_ids
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        student_row = conn.execute("SELECT center_id FROM students WHERE id = ?", (receipt["student_id"],)).fetchone()
        if not student_row or student_row["center_id"] not in all_ids:
            conn.close()
            raise HTTPException(status_code=403, detail="Not authorized")
    sid = receipt["student_id"]
    student = conn.execute("""
        SELECT s.*, u.name as university_name, c.name as course_name, b.name as branch_name
        FROM students s LEFT JOIN universities u ON s.university_id = u.id
        LEFT JOIN categories c ON s.category_id = c.id LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.id = ?
    """, (sid,)).fetchone()
    txn = conn.execute("SELECT * FROM transactions WHERE id = ?", (receipt["transaction_id"],)).fetchone() if receipt["transaction_id"] else None
    branding = _get_branding(conn)
    summary = _get_fee_summary(conn, sid)
    # Get center name if student belongs to a center
    center_name = ""
    if student and student["center_id"]:
        center_row = conn.execute("SELECT name FROM centers WHERE id = ?", (student["center_id"],)).fetchone()
        if center_row:
            center_name = center_row["name"]
    conn.close()
    s = dict(student) if student else {}
    t = dict(txn) if txn else {}
    return {
        "receipt_no": receipt["receipt_no"],
        "amount": receipt["amount"],
        "date": receipt["date"],
        "student": {"name": s.get("name",""), "phone": s.get("phone",""), "email": s.get("email",""), "address": s.get("address",""), "university": s.get("university_name",""), "course": s.get("course_name",""), "branch": s.get("branch_name",""), "father_name": s.get("father_name",""), "center_name": center_name},
        "payment": {"payment_mode": t.get("payment_mode",""), "utr_number": t.get("utr_number",""), "description": t.get("description","")},
        "fee_summary": {"total_fees": summary["total_fees"], "total_paid": summary["total_paid"], "pending": summary["pending"]},
        "branding": branding,
    }

@router.get("/student/{student_id}/payments")
async def get_student_payments(student_id: int, user: dict = Depends(get_current_user)):
    """Get payment history for a specific student. Center and admin can view."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized")
    conn = get_db()
    # Center ownership check: verify student belongs to this center
    if role == "center":
        from app.routers.centers import get_current_center, get_center_and_subcenter_ids
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        placeholders = ",".join(["?"] * len(all_ids))
        student = conn.execute(f"SELECT id FROM students WHERE id = ? AND center_id IN ({placeholders})", [student_id] + all_ids).fetchone()
        if not student:
            conn.close()
            raise HTTPException(status_code=403, detail="Student does not belong to your center")
    # Get fee_payments
    fp_rows = conn.execute(
        """SELECT fp.id, fp.amount, fp.payment_mode, fp.utr_number, fp.status, fp.created_at, fp.remarks as notes, 'student_payment' as source
           FROM fee_payments fp WHERE fp.student_id = ? AND (fp.deleted_by_admin = 0 OR fp.deleted_by_admin IS NULL)
           ORDER BY fp.created_at DESC""", (student_id,)
    ).fetchall()
    # Get admin transactions
    txn_rows = conn.execute(
        """SELECT t.id, t.amount, t.payment_mode, t.utr_number, t.status, t.created_at, t.description as notes, 'admin_transaction' as source
           FROM transactions t WHERE t.student_id = ? AND t.transaction_type = 'credit'
           AND (t.deleted_by_admin = 0 OR t.deleted_by_admin IS NULL)
           ORDER BY t.created_at DESC""", (student_id,)
    ).fetchall()
    all_payments = [dict(p) for p in fp_rows] + [dict(t) for t in txn_rows]
    all_payments.sort(key=lambda x: x.get("created_at", "") or "", reverse=True)
    conn.close()
    return {"payments": all_payments}


@router.post("/student/{student_id}/payment")
async def center_record_payment(student_id: int, data: dict, user: dict = Depends(get_current_user)):
    """Center records a fee payment for a student."""
    role = user.get("role", "")
    if role not in ("admin", "super_admin", "branch_admin", "center"):
        raise HTTPException(status_code=403, detail="Not authorized to record payments")
    
    amount = data.get("amount", 0)
    if not amount or float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    payment_mode = data.get("payment_mode", "cash")
    notes = data.get("notes", "")
    utr_number = data.get("utr_number", "")
    
    conn = get_db()
    student = conn.execute("SELECT id, name, phone, center_id FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Center ownership check: verify student belongs to this center
    if role == "center":
        from app.routers.centers import get_current_center, get_center_and_subcenter_ids
        center = get_current_center(user)
        all_ids = get_center_and_subcenter_ids(conn, center["id"])
        if student["center_id"] not in all_ids:
            conn.close()
            raise HTTPException(status_code=403, detail="Student does not belong to your center")
    
    # Create transaction
    description = f"Center fee payment - {payment_mode}" + (f" - {notes}" if notes else "")
    cursor = conn.execute(
        "INSERT INTO transactions (student_id, amount, transaction_type, utr_number, payment_mode, description, status) VALUES (?, ?, 'credit', ?, ?, ?, 'completed')",
        (student_id, float(amount), utr_number, payment_mode, description)
    )
    tid = cursor.lastrowid
    
    # Generate receipt
    branding = _get_branding(conn)
    prefix = branding.get("receipt_prefix", "ASFF")
    receipt_no = _generate_receipt_no(conn, prefix, tid, student_id, float(amount))
    
    # Update fee record
    fee = conn.execute("SELECT * FROM fee_records WHERE student_id = ?", (student_id,)).fetchone()
    if fee:
        new_paid = fee["paid_amount"] + float(amount)
        conn.execute("UPDATE fee_records SET paid_amount=?, pending_amount=total_fee-?, last_utr=? WHERE student_id=?",
                     (new_paid, new_paid, utr_number, student_id))
    
    # Auto-create commission record if student has center_id
    center_id = student["center_id"]
    if center_id:
        try:
            # Find applicable commission slab
            university_id = conn.execute("SELECT university_id FROM students WHERE id = ?", (student_id,)).fetchone()
            uni_id = university_id["university_id"] if university_id else None
            student_count = conn.execute("SELECT COUNT(*) FROM students WHERE center_id = ?", (center_id,)).fetchone()[0]
            slab = conn.execute(
                "SELECT commission_amount FROM commission_slabs WHERE (center_id IS NULL OR center_id = ?) AND (university_id IS NULL OR university_id = ?) AND min_admissions <= ? AND (max_admissions IS NULL OR max_admissions >= ?) ORDER BY commission_amount DESC LIMIT 1",
                (center_id, uni_id, student_count, student_count)
            ).fetchone()
            if slab:
                comm_amount = slab["commission_amount"]
                conn.execute(
                    "INSERT INTO center_commissions (center_id, student_id, university_id, amount, commission_type, notes) VALUES (?, ?, ?, ?, 'per_student', ?)",
                    (center_id, student_id, uni_id, comm_amount, f"Auto-commission on fee payment of Rs.{float(amount):,.0f}")
                )
        except Exception as e:
            print(f"Commission auto-create error: {e}")
    
    conn.commit()
    
    # Send notifications
    try:
        from app.utils.notifications import send_notification
        send_notification(conn, "payment", "Center Fee Payment",
            f"Student: {student['name']}\nAmount: Rs.{float(amount):,.0f}\nReceipt: {receipt_no}\nMode: {payment_mode}",
            "/admin/accounts")
    except Exception:
        pass
    
    conn.close()
    
    # Send receipt notifications
    try:
        notify_conn = get_db()
        _send_receipt_notifications(notify_conn, student_id, receipt_no, float(amount), payment_mode, utr_number)
        notify_conn.close()
    except Exception:
        pass
    
    return {"receipt_no": receipt_no, "message": f"Payment of Rs.{float(amount):,.0f} recorded for {student['name']}"}


@router.get("/branch-report")
async def branch_report(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("""
        SELECT b.id, b.name, 
               COALESCE(SUM(t.amount), 0) as total_amount,
               COUNT(DISTINCT t.student_id) as student_count
        FROM branches b 
        LEFT JOIN students st ON st.branch_id = b.id
        LEFT JOIN transactions t ON t.student_id = st.id
        GROUP BY b.id, b.name
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]
