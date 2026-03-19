from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict
from app.database import get_db
from app.utils.auth import require_admin, get_current_user
import os, uuid

router = APIRouter(prefix="/api/settings", tags=["Settings"])

# Keys that must never be exposed to unauthenticated callers
SENSITIVE_PREFIXES = ("smtp_", "sms_api", "payment_", "razorpay_", "whatsapp_api",
                      "telegram_", "notification_email", "rzp_order_")

@router.get("")
async def get_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    # Filter out sensitive keys from public endpoint
    return {r["key"]: r["value"] for r in rows if not r["key"].startswith(SENSITIVE_PREFIXES)}

@router.get("/all")
async def get_all_settings(user: dict = Depends(require_admin)):
    """Admin-only endpoint that returns ALL settings including sensitive keys."""
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

@router.put("")
async def update_settings(data: Dict[str, str], user: dict = Depends(require_admin)):
    conn = get_db()
    for key, value in data.items():
        existing = conn.execute("SELECT id FROM settings WHERE key = ?", (key,)).fetchone()
        if existing:
            conn.execute("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", (value, key))
        else:
            conn.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()
    return {"message": "Settings updated"}

@router.get("/targets")
async def get_targets(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM targets ORDER BY year DESC, month DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/targets")
async def set_target(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    existing = conn.execute("SELECT id FROM targets WHERE month = ? AND year = ?", (data.get("month"), data.get("year"))).fetchone()
    if existing:
        conn.execute("UPDATE targets SET target_count = ? WHERE id = ?", (data.get("target_count", 0), existing["id"]))
    else:
        conn.execute("INSERT INTO targets (admin_id, month, year, target_count) VALUES (?, ?, ?, ?)",
                     (int(user["sub"]), data.get("month"), data.get("year"), data.get("target_count", 0)))
    conn.commit()
    conn.close()
    return {"message": "Target set"}

@router.get("/dashboard")
async def admin_dashboard(user: dict = Depends(require_admin)):
    conn = get_db()
    total_students = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    active_students = conn.execute("SELECT COUNT(*) FROM students WHERE status = 'active'").fetchone()[0]
    total_universities = conn.execute("SELECT COUNT(*) FROM universities").fetchone()[0]
    total_branches = conn.execute("SELECT COUNT(*) FROM branches").fetchone()[0]
    total_enquiries = conn.execute("SELECT COUNT(*) FROM enquiries").fetchone()[0]
    new_enquiries = conn.execute("SELECT COUNT(*) FROM enquiries WHERE status = 'new'").fetchone()[0]
    total_revenue = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type = 'credit'").fetchone()[0]
    pending_fees = conn.execute("SELECT COALESCE(SUM(CASE WHEN pending_amount > 0 THEN pending_amount ELSE 0 END), 0) FROM fee_records").fetchone()[0]
    open_tickets = conn.execute("SELECT COUNT(*) FROM tickets WHERE status = 'open'").fetchone()[0]
    pending_payments = conn.execute("SELECT COUNT(*) FROM fee_payments WHERE status = 'pending'").fetchone()[0]
    
    # Current month target
    from datetime import datetime
    now = datetime.now()
    target = conn.execute("SELECT * FROM targets WHERE month = ? AND year = ?", (now.month, now.year)).fetchone()
    # Use date range for reliable month filtering (handles all date formats)
    month_start = f"{now.year}-{str(now.month).zfill(2)}-01"
    if now.month == 12:
        month_end = f"{now.year + 1}-01-01"
    else:
        month_end = f"{now.year}-{str(now.month + 1).zfill(2)}-01"
    month_admissions = conn.execute(
        "SELECT COUNT(*) FROM students WHERE created_at >= ? AND created_at < ?",
        (month_start, month_end)
    ).fetchone()[0]
    
    # Recent students
    recent_students = conn.execute("SELECT s.*, u.name as university_name FROM students s LEFT JOIN universities u ON s.university_id = u.id ORDER BY s.created_at DESC LIMIT 5").fetchall()
    
    # Recent enquiries
    recent_enquiries = conn.execute("SELECT e.*, u.name as university_name FROM enquiries e LEFT JOIN universities u ON e.university_id = u.id ORDER BY e.created_at DESC LIMIT 5").fetchall()
    
    conn.close()
    return {
        "total_students": total_students,
        "active_students": active_students,
        "total_universities": total_universities,
        "total_branches": total_branches,
        "total_enquiries": total_enquiries,
        "new_enquiries": new_enquiries,
        "total_revenue": total_revenue,
        "pending_fees": pending_fees,
        "open_tickets": open_tickets,
        "pending_payments": pending_payments,
        "target": dict(target) if target else {"target_count": 0, "achieved_count": 0},
        "month_admissions": month_admissions,
        "recent_students": [dict(r) for r in recent_students],
        "recent_enquiries": [dict(r) for r in recent_enquiries]
    }

@router.post("/test-smtp")
async def test_smtp(data: dict, user: dict = Depends(require_admin)):
    """Test SMTP configuration by sending a test email."""
    try:
        from app.utils.email import send_email
        to_email = data.get("to_email", "")
        if not to_email:
            return {"success": False, "message": "Please provide a test email address"}
        result = send_email(to_email, "Test Email - Education Hub", "<h2>SMTP Test Successful!</h2><p>Your SMTP configuration is working correctly.</p>")
        if result:
            return {"success": True, "message": "Test email sent successfully!"}
        else:
            return {"success": False, "message": "SMTP not configured or failed. Please check your SMTP settings."}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@router.post("/test-telegram")
async def test_telegram(data: dict, user: dict = Depends(require_admin)):
    """Test Telegram bot by sending a test message to all chat IDs (comma-separated)."""
    token = data.get("telegram_bot_token", "")
    chat_ids_raw = data.get("telegram_chat_id", "")
    if not token or not chat_ids_raw:
        return {"success": False, "message": "Bot token and Chat ID are required"}
    try:
        import requests as req
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        chat_ids = [cid.strip() for cid in chat_ids_raw.split(",") if cid.strip()]
        sent = 0
        errors = []
        for cid in chat_ids:
            try:
                resp = req.post(url, json={
                    "chat_id": cid,
                    "text": "\U0001F514 Test notification from ASFF Education Hub!\nYour Telegram notifications are configured correctly.\nChat ID: " + cid,
                    "parse_mode": "HTML"
                }, timeout=10)
                if resp.status_code == 200 and resp.json().get("ok"):
                    sent += 1
                else:
                    err = resp.json().get("description", "Unknown error")
                    errors.append(f"Chat {cid}: {err}")
            except Exception as e:
                errors.append(f"Chat {cid}: {str(e)}")
        if sent > 0 and not errors:
            return {"success": True, "message": f"Test message sent to {sent} chat(s)!"}
        elif sent > 0:
            return {"success": True, "message": f"Sent to {sent}/{len(chat_ids)} chats. Errors: {'; '.join(errors)}"}
        else:
            return {"success": False, "message": f"Failed: {'; '.join(errors)}"}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@router.get("/center-settings/{center_id}")
async def get_center_settings(center_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT * FROM center_settings WHERE center_id = ?", (center_id,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"center_id": center_id, "receipt_company_name": "", "receipt_address": "", "receipt_phone": "", "receipt_email": "", "receipt_logo_url": "", "receipt_footer": ""}

@router.put("/center-settings/{center_id}")
async def update_center_settings(center_id: int, data: dict, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        if center["id"] != center_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif role not in ("super_admin", "admin", "branch_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    conn = get_db()
    existing = conn.execute("SELECT id FROM center_settings WHERE center_id = ?", (center_id,)).fetchone()
    if existing:
        conn.execute(
            """UPDATE center_settings SET receipt_company_name=?, receipt_address=?, receipt_phone=?, receipt_email=?, receipt_logo_url=?, receipt_footer=?, updated_at=CURRENT_TIMESTAMP WHERE center_id=?""",
            (data.get("receipt_company_name", ""), data.get("receipt_address", ""), data.get("receipt_phone", ""), data.get("receipt_email", ""), data.get("receipt_logo_url", ""), data.get("receipt_footer", ""), center_id)
        )
    else:
        conn.execute(
            """INSERT INTO center_settings (center_id, receipt_company_name, receipt_address, receipt_phone, receipt_email, receipt_logo_url, receipt_footer) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (center_id, data.get("receipt_company_name", ""), data.get("receipt_address", ""), data.get("receipt_phone", ""), data.get("receipt_email", ""), data.get("receipt_logo_url", ""), data.get("receipt_footer", ""))
        )
    conn.commit()
    conn.close()
    return {"message": "Center settings updated"}

@router.post("/center-settings/{center_id}/upload-logo")
async def upload_center_logo(center_id: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload logo image for center receipt/invoice header."""
    role = user.get("role", "")
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        if center["id"] != center_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif role not in ("super_admin", "admin", "branch_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    from app.utils.uploads import get_upload_dir
    upload_dir = get_upload_dir()
    logo_dir = os.path.join(upload_dir, "center_logos")
    os.makedirs(logo_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "logo.png")[1] or ".png"
    filename = f"center_{center_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(logo_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    logo_url = f"/uploads/center_logos/{filename}"

    # Auto-update the center_settings receipt_logo_url
    conn = get_db()
    existing = conn.execute("SELECT id FROM center_settings WHERE center_id = ?", (center_id,)).fetchone()
    if existing:
        conn.execute("UPDATE center_settings SET receipt_logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE center_id = ?", (logo_url, center_id))
    else:
        conn.execute("INSERT INTO center_settings (center_id, receipt_logo_url) VALUES (?, ?)", (center_id, logo_url))
    conn.commit()
    conn.close()

    return {"logo_url": logo_url, "message": "Logo uploaded successfully"}

@router.get("/sessions")
async def get_sessions():
    conn = get_db()
    rows = conn.execute("SELECT * FROM sessions ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/sessions")
async def create_session(data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute("INSERT INTO sessions (name, start_date, end_date) VALUES (?, ?, ?)",
                          (data.get("name"), data.get("start_date"), data.get("end_date")))
    conn.commit()
    sid = cursor.lastrowid
    conn.close()
    return {"id": sid, "message": "Session created"}
