from fastapi import APIRouter, Depends, Response, HTTPException
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin
from datetime import datetime, timedelta
import urllib.parse
import shutil
import os

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/admissions")
async def admission_trends(year: Optional[int] = None, user: dict = Depends(require_admin)):
    conn = get_db()
    query = "SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM students WHERE status='active'"
    params = []
    if year:
        query += " AND strftime('%Y', created_at) = ?"
        params.append(str(year))
    query += " GROUP BY month ORDER BY month"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/university-wise")
async def university_wise(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("""
        SELECT u.name as university, COUNT(s.id) as students, 
               SUM(CASE WHEN s.status='active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN s.status='pending' THEN 1 ELSE 0 END) as pending
        FROM universities u LEFT JOIN students s ON u.id = s.university_id
        GROUP BY u.id ORDER BY students DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/revenue")
async def revenue_analytics(user: dict = Depends(require_admin)):
    conn = get_db()
    monthly_fp = conn.execute("""
        SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(amount),0) as total 
        FROM fee_payments WHERE status='approved' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)
        GROUP BY month
    """).fetchall()
    monthly_txn = conn.execute("""
        SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(amount),0) as total 
        FROM transactions WHERE transaction_type='credit' AND status='completed'
        AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%'
        AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)
        GROUP BY month
    """).fetchall()
    monthly_map = {}
    for r in monthly_fp:
        m = r["month"]
        if m:
            monthly_map[m] = monthly_map.get(m, 0) + (r["total"] or 0)
    for r in monthly_txn:
        m = r["month"]
        if m:
            monthly_map[m] = monthly_map.get(m, 0) + (r["total"] or 0)
    monthly = [{"month": k, "total": v} for k, v in sorted(monthly_map.items())]
    
    total_fees = conn.execute("SELECT COALESCE(SUM(total_fees),0) FROM students").fetchone()[0]
    fp_total = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE status='approved' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)").fetchone()[0]
    admin_total = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin = 0 OR deleted_by_admin IS NULL)").fetchone()[0]
    total_collected = fp_total + admin_total
    total_pending = max(0, total_fees - total_collected)
    conn.close()
    return {"monthly": monthly, "total_collected": total_collected, "total_pending": total_pending, "total_fees": total_fees}

@router.get("/revenue-trends")
async def revenue_trends(months: int = 12, user: dict = Depends(require_admin)):
    conn = get_db()
    results = []
    now = datetime.now()
    for i in range(months - 1, -1, -1):
        d = now - timedelta(days=i * 30)
        month_str = d.strftime("%Y-%m")
        month_label = d.strftime("%b %Y")
        fp = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE status='approved' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL) AND strftime('%%Y-%%m', created_at)=?", (month_str,)).fetchone()[0]
        txn = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL) AND strftime('%%Y-%%m', created_at)=?", (month_str,)).fetchone()[0]
        students = conn.execute("SELECT COUNT(*) FROM students WHERE strftime('%%Y-%%m', created_at)=?", (month_str,)).fetchone()[0]
        results.append({"month": month_label, "month_key": month_str, "revenue": fp + txn, "students": students})
    conn.close()
    return results

@router.get("/lead-conversion")
async def lead_conversion(user: dict = Depends(require_admin)):
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    by_status = conn.execute("""
        SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY 
        CASE status WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'interested' THEN 3 
        WHEN 'qualified' THEN 4 WHEN 'negotiation' THEN 5 WHEN 'converted' THEN 6 WHEN 'lost' THEN 7 END
    """).fetchall()
    monthly = conn.execute("""
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as total,
        SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost
        FROM leads GROUP BY month ORDER BY month DESC LIMIT 12
    """).fetchall()
    by_source = conn.execute("SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC").fetchall()
    conversion_rate = 0
    if total > 0:
        converted = conn.execute("SELECT COUNT(*) FROM leads WHERE status='converted'").fetchone()[0]
        conversion_rate = round((converted / total) * 100, 1)
    conn.close()
    return {"total": total, "by_status": [dict(r) for r in by_status], "monthly": [dict(r) for r in monthly], "by_source": [dict(r) for r in by_source], "conversion_rate": conversion_rate}

@router.get("/student-growth")
async def student_growth(user: dict = Depends(require_admin)):
    conn = get_db()
    monthly = conn.execute("""
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count,
        SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending
        FROM students GROUP BY month ORDER BY month
    """).fetchall()
    uni_dist = conn.execute("""
        SELECT u.name as university, COUNT(s.id) as count FROM students s JOIN universities u ON s.university_id = u.id GROUP BY u.id ORDER BY count DESC LIMIT 10
    """).fetchall()
    course_dist = conn.execute("""
        SELECT c.name as course, COUNT(s.id) as count FROM students s JOIN categories c ON s.category_id = c.id GROUP BY c.id ORDER BY count DESC LIMIT 10
    """).fetchall()
    branch_dist = conn.execute("""
        SELECT COALESCE(b.name, 'Unassigned') as branch, COUNT(s.id) as count FROM students s LEFT JOIN branches b ON s.branch_id = b.id GROUP BY s.branch_id ORDER BY count DESC
    """).fetchall()
    conn.close()
    return {"monthly": [dict(r) for r in monthly], "by_university": [dict(r) for r in uni_dist], "by_course": [dict(r) for r in course_dist], "by_branch": [dict(r) for r in branch_dist]}

@router.get("/branch-performance")
async def branch_performance(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("""
        SELECT b.name as branch, COUNT(s.id) as students,
               SUM(CASE WHEN s.status='active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN s.created_at >= date('now','start of month') THEN 1 ELSE 0 END) as this_month
        FROM branches b LEFT JOIN students s ON b.id = s.branch_id
        GROUP BY b.id ORDER BY students DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/counselor-performance")
async def counselor_performance(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("""
        SELECT u.name as counselor, 
               COUNT(DISTINCT l.id) as total_leads,
               SUM(CASE WHEN l.status='converted' THEN 1 ELSE 0 END) as converted,
               SUM(CASE WHEN l.status='lost' THEN 1 ELSE 0 END) as lost
        FROM users u LEFT JOIN leads l ON u.id = l.assigned_to
        WHERE u.role IN ('admin','super_admin','branch_admin')
        GROUP BY u.id ORDER BY converted DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/overview")
async def overview(user: dict = Depends(require_admin)):
    conn = get_db()
    total_students = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    active_students = conn.execute("SELECT COUNT(*) FROM students WHERE status='active'").fetchone()[0]
    pending_students = conn.execute("SELECT COUNT(*) FROM students WHERE status='pending'").fetchone()[0]
    total_universities = conn.execute("SELECT COUNT(*) FROM universities").fetchone()[0]
    total_enquiries = conn.execute("SELECT COUNT(*) FROM enquiries").fetchone()[0]
    total_leads = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    this_month_admissions = conn.execute("SELECT COUNT(*) FROM students WHERE status='active' AND created_at >= date('now','start of month')").fetchone()[0]
    fp_total = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE status='approved' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)").fetchone()[0]
    admin_total = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)").fetchone()[0]
    total_revenue = fp_total + admin_total
    total_fees = conn.execute("SELECT COALESCE(SUM(total_fees),0) FROM students").fetchone()[0]
    converted_leads = conn.execute("SELECT COUNT(*) FROM leads WHERE status='converted'").fetchone()[0]
    lead_conversion = round((converted_leads / total_leads * 100), 1) if total_leads > 0 else 0
    now = datetime.now()
    month_str = now.strftime("%Y-%m")
    month_fp = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE status='approved' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL) AND strftime('%%Y-%%m', created_at)=?", (month_str,)).fetchone()[0]
    month_txn = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL) AND strftime('%%Y-%%m', created_at)=?", (month_str,)).fetchone()[0]
    this_month_revenue = month_fp + month_txn
    conn.close()
    return {
        "total_students": total_students, "active_students": active_students, "pending_students": pending_students,
        "total_universities": total_universities, "total_enquiries": total_enquiries, "total_leads": total_leads,
        "this_month_admissions": this_month_admissions, "total_revenue": total_revenue, "total_fees": total_fees,
        "lead_conversion": lead_conversion, "converted_leads": converted_leads,
        "this_month_revenue": this_month_revenue, "total_pending": max(0, total_fees - total_revenue)
    }

# ==================== FEE REMINDERS ====================
@router.get("/fee-reminders/students")
async def get_students_with_pending_fees(user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("""
        SELECT s.id, s.name, s.email, s.phone, s.total_fees, u.name as university_name,
        COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.student_id=s.id AND fp.status='approved' AND (fp.deleted_by_admin=0 OR fp.deleted_by_admin IS NULL)),0) +
        COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.student_id=s.id AND t.transaction_type='credit' AND t.description NOT LIKE 'Online Fee Payment%%' AND t.description NOT LIKE 'Razorpay Payment%%' AND (t.deleted_by_admin=0 OR t.deleted_by_admin IS NULL)),0) as paid
        FROM students s LEFT JOIN universities u ON s.university_id = u.id
        WHERE s.total_fees > 0 AND s.status = 'active'
        ORDER BY s.name
    """).fetchall()
    results = []
    for r in rows:
        d = dict(r)
        d["pending"] = max(0, (d["total_fees"] or 0) - (d["paid"] or 0))
        if d["pending"] > 0:
            results.append(d)
    conn.close()
    return results

@router.post("/fee-reminders/send")
async def send_fee_reminders(data: dict, user: dict = Depends(require_admin)):
    student_ids = data.get("student_ids", [])
    custom_message = data.get("message", "")
    if not student_ids:
        return {"sent": 0, "failed": 0, "message": "No students selected"}
    conn = get_db()
    sent = 0
    failed = 0
    company_name = "ASFF Education Hub"
    try:
        cn_row = conn.execute("SELECT value FROM settings WHERE key='company_name'").fetchone()
        if cn_row:
            company_name = cn_row[0] or company_name
    except Exception:
        pass
    for sid in student_ids:
        student = conn.execute("""
            SELECT s.name, s.email, s.phone, s.total_fees,
            COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.student_id=s.id AND fp.status='approved' AND (fp.deleted_by_admin=0 OR fp.deleted_by_admin IS NULL)),0) +
            COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.student_id=s.id AND t.transaction_type='credit' AND t.description NOT LIKE 'Online Fee Payment%%' AND t.description NOT LIKE 'Razorpay Payment%%' AND (t.deleted_by_admin=0 OR t.deleted_by_admin IS NULL)),0) as paid
            FROM students s WHERE s.id = ?
        """, (sid,)).fetchone()
        if not student or not student["email"]:
            failed += 1
            continue
        pending = max(0, (student["total_fees"] or 0) - (student["paid"] or 0))
        if pending <= 0:
            continue
        try:
            from app.utils.email import send_email
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">{company_name}</h1>
                    <p style="margin: 5px 0 0; opacity: 0.9;">Fee Payment Reminder</p>
                </div>
                <div style="padding: 25px; background: #f8fafc; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #1e293b;">Dear {student['name']},</h2>
                    <p style="color: #475569;">This is a friendly reminder that you have a pending fee balance:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0; color: #64748b;">Total Fees</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">₹{student['total_fees']:,.0f}</td></tr>
                            <tr><td style="padding: 8px 0; color: #64748b;">Amount Paid</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #22c55e;">₹{student['paid']:,.0f}</td></tr>
                            <tr style="border-top: 2px solid #e2e8f0;"><td style="padding: 12px 0; color: #ef4444; font-weight: bold;">Pending Amount</td><td style="padding: 12px 0; text-align: right; font-weight: bold; color: #ef4444; font-size: 18px;">₹{pending:,.0f}</td></tr>
                        </table>
                    </div>
                    {f'<p style="color: #475569; background: #fef3c7; padding: 12px; border-radius: 8px;">{custom_message}</p>' if custom_message else ''}
                    <p style="color: #475569;">Please clear your pending fees at the earliest.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://asffeducationhub.com/student/fees" style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Pay Now</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">If you have already made the payment, please ignore this reminder.</p>
                </div>
            </div>"""
            result = send_email(student["email"], f"Fee Payment Reminder - {company_name}", html)
            if result:
                sent += 1
            else:
                failed += 1
        except Exception as e:
            print(f"Fee reminder error for student {sid}: {e}")
            failed += 1
    conn.commit()
    conn.close()
    return {"sent": sent, "failed": failed, "message": f"{sent} reminders sent" + (f", {failed} failed" if failed else "")}

@router.post("/fee-reminders/send-all")
async def send_all_fee_reminders(data: dict = {}, user: dict = Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT s.id FROM students s WHERE s.total_fees > 0 AND s.status = 'active' AND s.email IS NOT NULL AND s.email != ''").fetchall()
    student_ids = [r["id"] for r in rows]
    conn.close()
    return await send_fee_reminders({"student_ids": student_ids, "message": data.get("message", "")}, user)

# ==================== INVOICE/RECEIPT ====================
@router.get("/invoice/{student_id}/{payment_id}")
async def generate_invoice(student_id: int, payment_id: int, source: str = "online", user: dict = Depends(require_admin)):
    conn = get_db()
    student = conn.execute("""
        SELECT s.*, u.name as university_name, c.name as course_name, b.name as branch_name
        FROM students s LEFT JOIN universities u ON s.university_id = u.id LEFT JOIN categories c ON s.category_id = c.id LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.id = ?
    """, (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    if source == "admin":
        payment = conn.execute("SELECT * FROM transactions WHERE id = ? AND student_id = ?", (payment_id, student_id)).fetchone()
    else:
        payment = conn.execute("SELECT * FROM fee_payments WHERE id = ? AND student_id = ?", (payment_id, student_id)).fetchone()
    if not payment:
        conn.close()
        raise HTTPException(status_code=404, detail="Payment not found")
    settings_rows = conn.execute("SELECT key, value FROM settings").fetchall()
    settings = {r["key"]: r["value"] for r in settings_rows}
    fp_paid = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE student_id=? AND status='approved' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)", (student_id,)).fetchone()[0]
    admin_paid = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE student_id=? AND transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)", (student_id,)).fetchone()[0]
    total_paid = fp_paid + admin_paid
    conn.close()
    p = dict(payment)
    s = dict(student)
    return {
        "student": {"name": s.get("name",""), "enrollment_no": s.get("enrollment_no",""), "phone": s.get("phone",""), "email": s.get("email",""), "university": s.get("university_name",""), "course": s.get("course_name",""), "branch": s.get("branch_name",""), "father_name": s.get("father_name","")},
        "payment": {"id": p.get("id"), "amount": p.get("amount",0), "payment_mode": p.get("payment_mode",""), "utr_number": p.get("utr_number",""), "date": p.get("created_at",""), "status": p.get("status",""), "remarks": p.get("remarks","") or p.get("description","")},
        "fee_summary": {"total_fees": s.get("total_fees",0), "total_paid": total_paid, "pending": max(0, (s.get("total_fees",0) or 0) - total_paid)},
        "branding": {"company_name": settings.get("company_name","ASFF Education Hub"), "tagline": settings.get("tagline",""), "phone": settings.get("phone",""), "email": settings.get("email",""), "address": settings.get("address",""), "logo_url": settings.get("invoice_logo_url","") or settings.get("logo_url",""), "invoice_prefix": settings.get("invoice_prefix","ASFF"), "invoice_footer": settings.get("invoice_footer","This is a computer generated receipt.")}
    }

# ==================== ADMISSION PIPELINE ====================
@router.get("/pipeline")
async def admission_pipeline(date_from: Optional[str] = None, date_to: Optional[str] = None, status_filter: Optional[str] = None, source_filter: Optional[str] = None, sort_order: Optional[str] = "desc", user: dict = Depends(require_admin)):
    conn = get_db()
    # Build date filter clause
    date_clause = ""
    date_params = []
    if date_from:
        date_clause += " AND date(created_at) >= date(?)"
        date_params.append(date_from)
    if date_to:
        date_clause += " AND date(created_at) <= date(?)"
        date_params.append(date_to)
    
    new_leads = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='new'{date_clause}", date_params).fetchone()[0]
    contacted = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='contacted'{date_clause}", date_params).fetchone()[0]
    interested = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='interested'{date_clause}", date_params).fetchone()[0]
    qualified = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='qualified'{date_clause}", date_params).fetchone()[0]
    negotiation = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='negotiation'{date_clause}", date_params).fetchone()[0]
    converted = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='converted'{date_clause}", date_params).fetchone()[0]
    lost = conn.execute(f"SELECT COUNT(*) FROM leads WHERE status='lost'{date_clause}", date_params).fetchone()[0]
    total_leads = conn.execute(f"SELECT COUNT(*) FROM leads WHERE 1=1{date_clause}", date_params).fetchone()[0]
    total_enquiries = conn.execute("SELECT COUNT(*) FROM enquiries").fetchone()[0]
    new_enquiries = conn.execute("SELECT COUNT(*) FROM enquiries WHERE status='new'").fetchone()[0]
    total_students = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
    active_students = conn.execute("SELECT COUNT(*) FROM students WHERE status='active'").fetchone()[0]
    pending_students = conn.execute("SELECT COUNT(*) FROM students WHERE status='pending'").fetchone()[0]
    
    # Active leads (non-converted) with filters
    active_clause = " AND status != 'converted'"
    active_params = list(date_params)
    if status_filter and status_filter != "all":
        active_clause += " AND status = ?"
        active_params.append(status_filter)
    if source_filter and source_filter != "all":
        active_clause += " AND source = ?"
        active_params.append(source_filter)
    sort_dir = "ASC" if sort_order == "asc" else "DESC"
    active_leads = conn.execute(f"SELECT id, name, phone, email, status, source, created_at FROM leads WHERE 1=1{date_clause}{active_clause} ORDER BY created_at {sort_dir} LIMIT 50", active_params).fetchall()
    
    # Converted leads separately
    converted_params = list(date_params)
    converted_leads = conn.execute(f"SELECT id, name, phone, email, status, source, created_at, updated_at FROM leads WHERE status='converted'{date_clause} ORDER BY updated_at {sort_dir} LIMIT 50", converted_params).fetchall()
    
    # Get all unique sources for filter dropdown
    sources = conn.execute("SELECT DISTINCT source FROM leads WHERE source IS NOT NULL AND source != '' ORDER BY source").fetchall()
    
    recent_enquiries = conn.execute("SELECT id, name, phone, email, status, created_at FROM enquiries ORDER BY created_at DESC LIMIT 10").fetchall()
    conn.close()
    return {
        "stages": [
            {"name": "New Leads", "count": new_leads, "color": "#3B82F6"},
            {"name": "Contacted", "count": contacted, "color": "#F59E0B"},
            {"name": "Interested", "count": interested, "color": "#8B5CF6"},
            {"name": "Qualified", "count": qualified, "color": "#06B6D4"},
            {"name": "Negotiation", "count": negotiation, "color": "#F97316"},
            {"name": "Converted", "count": converted, "color": "#22C55E"},
            {"name": "Lost", "count": lost, "color": "#EF4444"},
        ],
        "summary": {"total_leads": total_leads, "total_enquiries": total_enquiries, "new_enquiries": new_enquiries, "total_students": total_students, "active_students": active_students, "pending_students": pending_students, "conversion_rate": round((converted / total_leads * 100), 1) if total_leads > 0 else 0},
        "recent_leads": [dict(r) for r in active_leads],
        "converted_leads": [dict(r) for r in converted_leads],
        "sources": [r[0] for r in sources],
        "recent_enquiries": [dict(r) for r in recent_enquiries],
    }

@router.post("/pipeline/convert-lead/{lead_id}")
async def convert_lead_to_student(lead_id: int, data: dict, user: dict = Depends(require_admin)):
    conn = get_db()
    lead = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if not lead:
        conn.close()
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = dict(lead)
    from app.utils.auth import hash_password
    import random
    username = lead.get("phone") or ("".join(lead.get("name","student").lower().split()) + str(random.randint(100,999)))
    temp_password = "Student@123"
    try:
        cursor = conn.execute("INSERT INTO users (username, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, 'student')", (username, lead.get("email",""), hash_password(temp_password), lead["name"], lead.get("phone","")))
        user_id = cursor.lastrowid
        cursor2 = conn.execute("INSERT INTO students (user_id, name, email, phone, university_id, category_id, branch_id, total_fees, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')",
            (user_id, lead["name"], lead.get("email",""), lead.get("phone",""), data.get("university_id"), data.get("category_id"), data.get("branch_id"), data.get("total_fees",0)))
        student_id = cursor2.lastrowid
        conn.execute("UPDATE leads SET status='converted', updated_at=CURRENT_TIMESTAMP WHERE id=?", (lead_id,))
        conn.execute("INSERT INTO lead_history (lead_id, action, new_status, old_status, note, performed_by) VALUES (?, 'status_change', 'converted', ?, ?, ?)",
            (lead_id, lead.get("status",""), f"Converted to student (ID: {student_id})", int(user["sub"])))
        conn.commit()
        conn.close()
        return {"message": f"Lead '{lead['name']}' converted to student!", "student_id": student_id, "username": username, "password": temp_password}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

# ==================== WHATSAPP ====================
@router.post("/whatsapp/send")
async def send_whatsapp_message(data: dict, user: dict = Depends(require_admin)):
    phone = data.get("phone", "")
    message = data.get("message", "")
    if not phone or not message:
        raise HTTPException(status_code=400, detail="Phone and message required")
    phone = phone.replace(" ","").replace("-","").replace("+","")
    if phone.startswith("0"):
        phone = "91" + phone[1:]
    elif not phone.startswith("91") and len(phone) == 10:
        phone = "91" + phone
    wa_link = f"https://wa.me/{phone}?text={urllib.parse.quote(message)}"
    return {"success": True, "method": "link", "wa_link": wa_link}

@router.post("/whatsapp/bulk-send")
async def bulk_send_whatsapp(data: dict, user: dict = Depends(require_admin)):
    target = data.get("target", "students")
    message_template = data.get("message", "")
    filters = data.get("filters", {})
    if not message_template:
        raise HTTPException(status_code=400, detail="Message template required")
    conn = get_db()
    recipients = []
    if target == "students":
        query = "SELECT id, name, phone, email, total_fees, university_id, category_id FROM students WHERE phone IS NOT NULL AND phone != ''"
        params = []
        if filters.get("status"):
            query += " AND status = ?"
            params.append(filters['status'])
        if filters.get("university_id"):
            query += " AND university_id = ?"
            params.append(int(filters['university_id']))
        if filters.get("category_id"):
            query += " AND category_id = ?"
            params.append(int(filters['category_id']))
        rows = conn.execute(query, params).fetchall()
        for r in rows:
            d = dict(r)
            fp = conn.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE student_id=? AND status='approved' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)", (d["id"],)).fetchone()[0]
            txn = conn.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE student_id=? AND transaction_type='credit' AND description NOT LIKE 'Online Fee Payment%%' AND description NOT LIKE 'Razorpay Payment%%' AND (deleted_by_admin=0 OR deleted_by_admin IS NULL)", (d["id"],)).fetchone()[0]
            d["paid"] = fp + txn
            d["pending"] = max(0, (d["total_fees"] or 0) - d["paid"])
            msg = message_template.replace("{name}", d["name"] or "").replace("{total_fees}", f"₹{d['total_fees']:,.0f}" if d["total_fees"] else "N/A").replace("{paid}", f"₹{d['paid']:,.0f}").replace("{pending}", f"₹{d['pending']:,.0f}")
            recipients.append({"id": d["id"], "name": d["name"], "phone": d["phone"], "message": msg})
    elif target == "leads":
        query = "SELECT id, name, phone, email, status FROM leads WHERE phone IS NOT NULL AND phone != ''"
        lead_params = []
        if filters.get("status"):
            query += " AND status = ?"
            lead_params.append(filters['status'])
        rows = conn.execute(query, lead_params).fetchall()
        for r in rows:
            d = dict(r)
            msg = message_template.replace("{name}", d["name"] or "").replace("{status}", d["status"] or "")
            recipients.append({"id": d["id"], "name": d["name"], "phone": d["phone"], "message": msg})
    conn.close()
    for r in recipients:
        phone = (r["phone"] or "").replace(" ","").replace("-","").replace("+","")
        if phone.startswith("0"):
            phone = "91" + phone[1:]
        elif not phone.startswith("91") and len(phone) == 10:
            phone = "91" + phone
        r["wa_link"] = f"https://wa.me/{phone}?text={urllib.parse.quote(r['message'])}"
    return {"recipients": recipients, "count": len(recipients)}

# ==================== BACKUP & RESTORE ====================
@router.get("/backup")
async def create_backup(user: dict = Depends(require_admin)):
    from app.database import DB_PATH
    backup_dir = os.path.join(os.path.dirname(DB_PATH), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"eduhub_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)
    shutil.copy2(DB_PATH, backup_path)
    file_size = os.path.getsize(backup_path)
    return {"message": "Backup created successfully", "filename": backup_filename, "size": file_size, "size_mb": round(file_size / (1024*1024), 2), "created_at": datetime.now().isoformat()}

@router.get("/backup/download")
async def download_backup(user: dict = Depends(require_admin)):
    from app.database import DB_PATH
    backup_dir = os.path.join(os.path.dirname(DB_PATH), "backups")
    if not os.path.exists(backup_dir):
        raise HTTPException(status_code=404, detail="No backups found")
    backups = sorted([f for f in os.listdir(backup_dir) if f.endswith(".db")], reverse=True)
    if not backups:
        raise HTTPException(status_code=404, detail="No backups found")
    backup_path = os.path.join(backup_dir, backups[0])
    with open(backup_path, "rb") as f:
        content = f.read()
    return Response(content=content, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={backups[0]}"})

@router.get("/backup/list")
async def list_backups(user: dict = Depends(require_admin)):
    from app.database import DB_PATH
    backup_dir = os.path.join(os.path.dirname(DB_PATH), "backups")
    if not os.path.exists(backup_dir):
        return []
    backups = []
    for f in sorted(os.listdir(backup_dir), reverse=True):
        if f.endswith(".db"):
            path = os.path.join(backup_dir, f)
            size = os.path.getsize(path)
            backups.append({"filename": f, "size": size, "size_mb": round(size/(1024*1024),2), "created_at": datetime.fromtimestamp(os.path.getctime(path)).isoformat()})
    return backups

@router.post("/backup/restore")
async def restore_backup(data: dict, user: dict = Depends(require_admin)):
    from app.database import DB_PATH
    filename = data.get("filename", "")
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    backup_dir = os.path.join(os.path.dirname(DB_PATH), "backups")
    backup_path = os.path.join(backup_dir, filename)
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Backup file not found")
    safety_backup = os.path.join(backup_dir, f"pre_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
    shutil.copy2(DB_PATH, safety_backup)
    shutil.copy2(backup_path, DB_PATH)
    return {"message": f"Database restored from {filename}. Safety backup: {os.path.basename(safety_backup)}"}

@router.delete("/backup/{filename}")
async def delete_backup(filename: str, user: dict = Depends(require_admin)):
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    from app.database import DB_PATH
    backup_dir = os.path.join(os.path.dirname(DB_PATH), "backups")
    backup_path = os.path.join(backup_dir, filename)
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Backup file not found")
    os.remove(backup_path)
    return {"message": f"Backup {filename} deleted"}
