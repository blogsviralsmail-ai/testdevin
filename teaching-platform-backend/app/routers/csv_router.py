"""CSV download and bulk upload endpoints for admin panel"""
import csv
import io
import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from app.database import get_db
from app.auth import require_role, hash_password

router = APIRouter(prefix="/api/admin/csv", tags=["CSV"])


def require_admin():
    return require_role("admin")


# ==================== TEACHERS ====================

@router.get("/teachers/download")
def download_teachers(current_user: dict = Depends(require_admin())):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT u.id, u.email, u.full_name, u.phone, u.city, u.state, u.is_active, u.is_verified, u.created_at,
                   tp.hourly_rate, tp.experience_years, tp.qualification, tp.languages, tp.bio,
                   tp.rating, tp.total_reviews, tp.total_classes, tp.total_earnings, tp.is_approved,
                   tp.bank_name, tp.bank_account, tp.bank_ifsc, tp.upi_id
            FROM users u
            LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
            WHERE u.role = 'teacher'
            ORDER BY u.id
        """).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "email", "full_name", "phone", "city", "state", "is_active", "is_verified", "created_at",
        "hourly_rate", "experience_years", "qualification", "languages", "bio",
        "rating", "total_reviews", "total_classes", "total_earnings", "is_approved",
        "bank_name", "bank_account", "bank_ifsc", "upi_id"
    ])
    for r in rows:
        writer.writerow([
            r["id"], r["email"], r["full_name"], r["phone"], r["city"], r["state"],
            r["is_active"], r["is_verified"], r["created_at"],
            r["hourly_rate"], r["experience_years"], r["qualification"], r["languages"], r["bio"],
            r["rating"], r["total_reviews"], r["total_classes"], r["total_earnings"], r["is_approved"],
            r["bank_name"], r["bank_account"], r["bank_ifsc"], r["upi_id"]
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=teachers.csv"}
    )


@router.post("/teachers/upload")
async def upload_teachers(file: UploadFile = File(...), current_user: dict = Depends(require_admin())):
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    content = await file.read()
    text = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))

    added = 0
    updated = 0
    errors = []
    pw_hash = hash_password("teacher123")

    with get_db() as conn:
        for i, row in enumerate(reader, start=2):
            try:
                email = row.get("email", "").strip()
                if not email:
                    errors.append(f"Row {i}: Missing email")
                    continue

                full_name = row.get("full_name", "").strip()
                if not full_name:
                    errors.append(f"Row {i}: Missing full_name")
                    continue

                existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()

                if existing:
                    # Update existing teacher
                    user_id = existing["id"]
                    conn.execute("""UPDATE users SET full_name=?, phone=?, city=?, state=? WHERE id=?""",
                                 (full_name, row.get("phone", ""), row.get("city", ""), row.get("state", "Rajasthan"), user_id))

                    profile = conn.execute("SELECT id FROM teacher_profiles WHERE user_id = ?", (user_id,)).fetchone()
                    if profile:
                        conn.execute("""UPDATE teacher_profiles SET hourly_rate=?, experience_years=?, qualification=?,
                                        bio=?, bank_name=?, bank_account=?, bank_ifsc=?, upi_id=? WHERE user_id=?""",
                                     (float(row.get("hourly_rate", 150)), int(row.get("experience_years", 1)),
                                      row.get("qualification", "B.Ed"), row.get("bio", ""),
                                      row.get("bank_name", ""), row.get("bank_account", ""),
                                      row.get("bank_ifsc", ""), row.get("upi_id", ""), user_id))
                    updated += 1
                else:
                    # Create new teacher
                    cursor = conn.execute(
                        """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
                           VALUES (?, ?, ?, ?, 'teacher', ?, ?, 1, 1)""",
                        (email, pw_hash, full_name, row.get("phone", ""),
                         row.get("city", ""), row.get("state", "Rajasthan"))
                    )
                    user_id = cursor.lastrowid
                    langs = row.get("languages", '["Hindi", "English"]')
                    if not langs.startswith("["):
                        langs = json.dumps([l.strip() for l in langs.split(",")])
                    conn.execute(
                        """INSERT INTO teacher_profiles (user_id, bio, experience_years, hourly_rate, languages,
                           qualification, is_approved, bank_name, bank_account, bank_ifsc, upi_id)
                           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)""",
                        (user_id, row.get("bio", f"Teacher from {row.get('city', 'India')}"),
                         int(row.get("experience_years", 1)), float(row.get("hourly_rate", 150)),
                         langs, row.get("qualification", "B.Ed"),
                         row.get("bank_name", ""), row.get("bank_account", ""),
                         row.get("bank_ifsc", ""), row.get("upi_id", ""))
                    )
                    added += 1
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")

    return {"added": added, "updated": updated, "errors": errors[:20],
            "message": f"Upload complete: {added} added, {updated} updated" + (f", {len(errors)} errors" if errors else "")}


# ==================== STUDENTS ====================

@router.get("/students/download")
def download_students(current_user: dict = Depends(require_admin())):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, email, full_name, phone, city, state, is_active, is_verified, created_at
            FROM users WHERE role = 'student' ORDER BY id
        """).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "full_name", "phone", "city", "state", "is_active", "is_verified", "created_at"])
    for r in rows:
        writer.writerow([r["id"], r["email"], r["full_name"], r["phone"], r["city"], r["state"],
                         r["is_active"], r["is_verified"], r["created_at"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students.csv"}
    )


@router.post("/students/upload")
async def upload_students(file: UploadFile = File(...), current_user: dict = Depends(require_admin())):
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    content = await file.read()
    text = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))

    added = 0
    updated = 0
    errors = []
    pw_hash = hash_password("student123")

    with get_db() as conn:
        for i, row in enumerate(reader, start=2):
            try:
                email = row.get("email", "").strip()
                if not email:
                    errors.append(f"Row {i}: Missing email")
                    continue

                full_name = row.get("full_name", "").strip()
                if not full_name:
                    errors.append(f"Row {i}: Missing full_name")
                    continue

                existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()

                if existing:
                    conn.execute("""UPDATE users SET full_name=?, phone=?, city=?, state=? WHERE id=?""",
                                 (full_name, row.get("phone", ""), row.get("city", ""), row.get("state", "Rajasthan"), existing["id"]))
                    updated += 1
                else:
                    conn.execute(
                        """INSERT INTO users (email, password_hash, full_name, phone, role, city, state, is_active, is_verified)
                           VALUES (?, ?, ?, ?, 'student', ?, ?, 1, 1)""",
                        (email, pw_hash, full_name, row.get("phone", ""),
                         row.get("city", ""), row.get("state", "Rajasthan"))
                    )
                    added += 1
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")

    return {"added": added, "updated": updated, "errors": errors[:20],
            "message": f"Upload complete: {added} added, {updated} updated" + (f", {len(errors)} errors" if errors else "")}


# ==================== PAYMENTS ====================

@router.get("/payments/download")
def download_payments(current_user: dict = Depends(require_admin())):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT p.id, p.booking_id, p.amount, p.platform_fee, p.teacher_amount, p.status,
                   p.payment_method, p.transaction_ref, p.payout_ref, p.created_at, p.released_at,
                   u_student.full_name as student_name, u_student.email as student_email,
                   u_teacher.full_name as teacher_name, u_teacher.email as teacher_email
            FROM payments p
            LEFT JOIN bookings b ON b.id = p.booking_id
            LEFT JOIN users u_student ON u_student.id = b.student_id
            LEFT JOIN teacher_profiles tp ON tp.id = p.teacher_id
            LEFT JOIN users u_teacher ON u_teacher.id = tp.user_id
            ORDER BY p.id DESC
        """).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "booking_id", "student_name", "student_email", "teacher_name", "teacher_email",
                     "amount", "platform_fee", "teacher_amount", "status", "payment_method",
                     "transaction_ref", "payout_ref", "created_at", "released_at"])
    for r in rows:
        writer.writerow([r["id"], r["booking_id"], r["student_name"], r["student_email"],
                         r["teacher_name"], r["teacher_email"],
                         r["amount"], r["platform_fee"], r["teacher_amount"], r["status"],
                         r["payment_method"], r["transaction_ref"], r["payout_ref"],
                         r["created_at"], r["released_at"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments.csv"}
    )


# ==================== CLASSES ====================

@router.get("/classes/download")
def download_classes(current_user: dict = Depends(require_admin())):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT c.id, c.title, s.name as subject_name, u.full_name as teacher_name, u.email as teacher_email,
                   c.class_type, c.scheduled_at, c.duration_minutes, c.price, c.status, c.max_students,
                   c.meeting_link, c.created_at,
                   (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id) as booking_count
            FROM classes c
            JOIN subjects s ON s.id = c.subject_id
            JOIN teacher_profiles tp ON tp.id = c.teacher_id
            JOIN users u ON u.id = tp.user_id
            ORDER BY c.id DESC
        """).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "subject", "teacher_name", "teacher_email", "class_type",
                     "scheduled_at", "duration_minutes", "price", "status", "max_students",
                     "meeting_link", "booking_count", "created_at"])
    for r in rows:
        writer.writerow([r["id"], r["title"], r["subject_name"], r["teacher_name"], r["teacher_email"],
                         r["class_type"], r["scheduled_at"], r["duration_minutes"], r["price"],
                         r["status"], r["max_students"], r["meeting_link"], r["booking_count"],
                         r["created_at"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=classes.csv"}
    )


# ==================== TICKETS ====================

@router.get("/tickets/download")
def download_tickets(current_user: dict = Depends(require_admin())):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT t.id, t.subject, t.description, t.category, t.priority, t.status, t.created_at, t.updated_at,
                   u.full_name as user_name, u.email as user_email, u.role as user_role
            FROM support_tickets t
            JOIN users u ON u.id = t.user_id
            ORDER BY t.id DESC
        """).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "user_name", "user_email", "user_role", "subject", "description",
                     "category", "priority", "status", "created_at", "updated_at"])
    for r in rows:
        writer.writerow([r["id"], r["user_name"], r["user_email"], r["user_role"],
                         r["subject"], r["description"], r["category"], r["priority"],
                         r["status"], r["created_at"], r["updated_at"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets.csv"}
    )


# ==================== SETTINGS ====================

@router.get("/settings/download")
def download_settings(current_user: dict = Depends(require_admin())):
    with get_db() as conn:
        site = conn.execute("SELECT key, value FROM site_settings ORDER BY key").fetchall()
        email_cfg = conn.execute("SELECT * FROM email_config WHERE id = 1").fetchone()
        notif = conn.execute("SELECT key, is_enabled FROM email_notification_settings ORDER BY key").fetchall()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["[SITE SETTINGS]"])
    writer.writerow(["key", "value"])
    for s in site:
        writer.writerow([s["key"], s["value"]])

    writer.writerow([])
    writer.writerow(["[EMAIL CONFIG]"])
    writer.writerow(["setting", "value"])
    if email_cfg:
        writer.writerow(["smtp_host", email_cfg["smtp_host"]])
        writer.writerow(["smtp_port", email_cfg["smtp_port"]])
        writer.writerow(["smtp_username", email_cfg["smtp_username"]])
        writer.writerow(["sender_name", email_cfg["sender_name"]])
        writer.writerow(["sender_email", email_cfg["sender_email"]])
        writer.writerow(["is_enabled", email_cfg["is_enabled"]])

    writer.writerow([])
    writer.writerow(["[NOTIFICATION SETTINGS]"])
    writer.writerow(["key", "is_enabled"])
    for n in notif:
        writer.writerow([n["key"], n["is_enabled"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=settings.csv"}
    )


@router.post("/settings/upload")
async def upload_settings(file: UploadFile = File(...), current_user: dict = Depends(require_admin())):
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    content = await file.read()
    text = content.decode('utf-8-sig')
    lines = text.strip().split("\n")

    section = None
    site_updates = 0
    notif_updates = 0

    with get_db() as conn:
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if "[SITE SETTINGS]" in line:
                section = "site"
                continue
            if "[EMAIL CONFIG]" in line:
                section = "email"
                continue
            if "[NOTIFICATION SETTINGS]" in line:
                section = "notif"
                continue
            if line.startswith("key,") or line.startswith("setting,"):
                continue

            parts = line.split(",", 1)
            if len(parts) < 2:
                continue
            key = parts[0].strip()
            value = parts[1].strip()

            if section == "site" and key:
                conn.execute("INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
                             (key, value))
                site_updates += 1
            elif section == "notif" and key:
                enabled = 1 if value.strip() in ("1", "true", "True", "yes") else 0
                conn.execute("UPDATE email_notification_settings SET is_enabled = ?, updated_at = datetime('now') WHERE key = ?",
                             (enabled, key))
                notif_updates += 1

    return {"message": f"Settings imported: {site_updates} site settings, {notif_updates} notification settings updated"}
